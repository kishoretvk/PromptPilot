import requests
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json

DATABASE_URL = "sqlite:///./promptpilot_test.db"

def test_optimize_prompt():
    # Step 1: Create a test prompt
    create_payload = {
        "name": "Test Prompt for Optimization",
        "task_type": "text-generation",
        "messages": [{"role": "user", "content": "Tell me a joke about cats."}],
        "input_variables": {},
        "model_provider": "ollama",
        "model_name": "mistral:latest"
    }
    response = requests.post("http://localhost:8000/api/v1/prompts", json=create_payload)
    assert response.status_code == 201
    prompt_id = response.json()["id"]
    print(f"Created prompt with ID: {prompt_id}")

    # Step 2: Call optimize
    optimize_payload = {
        "task_description": "Generate a simple joke about cats, 1-2 sentences, family-friendly.",
        "max_iterations": 2
    }
    response = requests.post(f"http://localhost:8000/api/v1/prompts/{prompt_id}/optimize", json=optimize_payload)
    assert response.status_code == 200
    result = response.json()
    print(f"Optimization result: {json.dumps(result, indent=2)}")

    # Step 3: Query DB for new records
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    with Session() as session:
        from api.database.models import QualityScore, AISuggestion
        quality_scores = session.query(QualityScore).filter(QualityScore.prompt_id == prompt_id).all()
        ai_suggestions = session.query(AISuggestion).filter(AISuggestion.prompt_id == prompt_id).all()
        print(f"Quality scores created: {len(quality_scores)}")
        print(f"AI suggestions created: {len(ai_suggestions)}")
        for score in quality_scores:
            print(f"Score: {score.overall_score}, Issues: {score.issues}")
        for sug in ai_suggestions:
            print(f"Suggestion: {sug.suggestion_type} - {sug.description}")

if __name__ == "__main__":
    test_optimize_prompt()
