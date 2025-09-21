from celery import Celery
from api.main import app as fastapi_app
from api.services.ai_refinement_service import AutomatedRefinementService

celery_app = Celery('promptpilot', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

# Ensure the FastAPI app context is available for Celery tasks
celery_app.conf.update(app_name='promptpilot')

@celery_app.task(bind=True)
def run_refinement_task(self, prompt_id: str, task_description: str, max_iterations: int = 2):
    """Async task for running prompt refinement"""
    try:
        # Get dependencies (in production, inject via shared config or DB)
        from api.services.model_provider_service import ModelProviderService
        from api.services.validation_service import ValidationService
        from api.services.testing_service import TestingService
        from api.database.config import DatabaseManager

        model_provider = ModelProviderService()
        validation = ValidationService()
        testing = TestingService()
        db = DatabaseManager()

        refinement_service = AutomatedRefinementService(
            model_provider_service=model_provider,
            validation_service=validation,
            testing_service=testing,
            max_iterations=max_iterations
        )

        # Fetch prompt from DB
        from api.database.models import Prompt
        with db.get_session_context() as session:
            prompt = session.query(Prompt).filter(Prompt.id == prompt_id).first()
            if not prompt:
                return {"status": "failed", "error": "Prompt not found"}

            prompt_data = {
                "id": str(prompt.id),
                "name": prompt.name,
                "content": "\n".join([m.content for m in prompt.messages]) if prompt.messages else task_description,
            }

        # Run refinement
        result = refinement_service.auto_refine_prompt(
            prompt_data=prompt_data,
            max_iterations=max_iterations
        )

        # Update prompt with refined version
        refined_messages = result.refined_prompt.get("messages", [])
        prompt.messages = refined_messages
        prompt.updated_at = datetime.utcnow()
        session.commit()

        return {
            "status": "success",
            "refinement_id": str(uuid.uuid4()),
            "improvement": result.quality_improvement,
            "suggestions": result.suggestions if hasattr(result, 'suggestions') else [],
            "refined_prompt": result.refined_prompt,
            "iterations": result.iterations
        }
    except Exception as e:
        logger.error(f"Refinement task failed: {str(e)}")
        return {"status": "failed", "error": str(e)}
