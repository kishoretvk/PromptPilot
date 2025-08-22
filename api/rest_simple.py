from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import structlog
import uuid
from datetime import datetime
import json

from .schemas_simple import (
    PaginatedResponse, PromptResponse, CreatePromptRequest, UpdatePromptRequest,
    TestPromptRequest, TestResultResponse, MessageResponse, SettingsResponse,
    PromptStatusEnum
)
from .database_simple import get_db, init_db, test_db_connection, get_current_user

# Configure logging
logger = structlog.get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PromptPilot API",
    version="1.0.0",
    description="LLM Prompt Engineering and Pipeline Management Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for development
prompts_store = {}
pipelines_store = {}
analytics_store = {"usage": {}, "performance": {}, "costs": {}}
settings_store = {
    "theme": {"mode": "light", "primary_color": "#1976d2"},
    "notifications": {"email_notifications": True},
    "security": {"require_api_key": False},
    "api_keys": [],
    "integrations": []
}

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "PromptPilot API",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs",
        "health_url": "/health"
    }

# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    db_status = test_db_connection()
    return {
        "status": "healthy" if db_status else "degraded",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "database": "connected" if db_status else "disconnected"
    }

# Prompt Management Endpoints
@app.get("/api/v1/prompts", response_model=PaginatedResponse[PromptResponse], tags=["Prompts"])
async def get_prompts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    task_type: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get paginated list of prompts with filtering"""
    logger.info("Fetching prompts", user_id=current_user.id, page=page, limit=limit)
    
    # Filter prompts based on search criteria
    filtered_prompts = []
    for prompt in prompts_store.values():
        if search and search.lower() not in prompt["name"].lower():
            continue
        if tags and not any(tag in prompt["tags"] for tag in tags):
            continue
        if task_type and prompt["task_type"] != task_type:
            continue
        filtered_prompts.append(prompt)
    
    # Pagination
    total = len(filtered_prompts)
    start = (page - 1) * limit
    end = start + limit
    items = filtered_prompts[start:end]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": limit,
        "total_pages": (total + limit - 1) // limit,
        "has_next": end < total,
        "has_prev": page > 1
    }

@app.get("/api/v1/prompts/{prompt_id}", response_model=PromptResponse, tags=["Prompts"])
async def get_prompt(
    prompt_id: str,
    current_user = Depends(get_current_user)
):
    """Get specific prompt by ID"""
    logger.info("Fetching prompt", user_id=current_user.id, prompt_id=prompt_id)
    
    if prompt_id not in prompts_store:
        raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
    
    return prompts_store[prompt_id]

@app.post("/api/v1/prompts", response_model=PromptResponse, status_code=201, tags=["Prompts"])
async def create_prompt(
    prompt_data: CreatePromptRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Create a new prompt"""
    logger.info("Creating prompt", user_id=current_user.id, prompt_name=prompt_data.name)
    
    prompt_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_prompt = {
        "id": prompt_id,
        "name": prompt_data.name,
        "description": prompt_data.description or "",
        "task_type": prompt_data.task_type,
        "tags": prompt_data.tags,
        "developer_notes": prompt_data.developer_notes or "",
        "messages": [msg.dict() for msg in prompt_data.messages],
        "input_variables": prompt_data.input_variables,
        "model_provider": prompt_data.model_provider,
        "model_name": prompt_data.model_name,
        "parameters": prompt_data.parameters,
        "status": "draft",
        "version": "1.0.0",
        "owner_id": current_user.id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 0,
        "avg_execution_time": 0.0,
        "success_rate": 0.0,
        "total_cost": 0.0
    }
    
    prompts_store[prompt_id] = new_prompt
    
    logger.info("Prompt created", user_id=current_user.id, prompt_id=prompt_id)
    
    return new_prompt

@app.put("/api/v1/prompts/{prompt_id}", response_model=PromptResponse, tags=["Prompts"])
async def update_prompt(
    prompt_id: str,
    prompt_data: UpdatePromptRequest,
    current_user = Depends(get_current_user)
):
    """Update existing prompt"""
    logger.info("Updating prompt", user_id=current_user.id, prompt_id=prompt_id)
    
    if prompt_id not in prompts_store:
        raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
    
    prompt = prompts_store[prompt_id]
    
    # Update fields that are provided
    update_data = prompt_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "messages" and value:
            prompt[field] = [msg.dict() if hasattr(msg, 'dict') else msg for msg in value]
        else:
            prompt[field] = value
    
    prompt["updated_at"] = datetime.utcnow().isoformat()
    
    logger.info("Prompt updated", user_id=current_user.id, prompt_id=prompt_id)
    return prompt

@app.delete("/api/v1/prompts/{prompt_id}", status_code=204, tags=["Prompts"])
async def delete_prompt(
    prompt_id: str,
    current_user = Depends(get_current_user)
):
    """Delete prompt"""
    logger.info("Deleting prompt", user_id=current_user.id, prompt_id=prompt_id)
    
    if prompt_id not in prompts_store:
        raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
    
    del prompts_store[prompt_id]
    logger.info("Prompt deleted", user_id=current_user.id, prompt_id=prompt_id)

@app.post("/api/v1/prompts/{prompt_id}/test", response_model=TestResultResponse, tags=["Prompts"])
async def test_prompt(
    prompt_id: str,
    test_data: TestPromptRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Test prompt execution"""
    logger.info("Testing prompt", user_id=current_user.id, prompt_id=prompt_id)
    
    if prompt_id not in prompts_store:
        raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
    
    # Mock test result
    result = {
        "id": str(uuid.uuid4()),
        "output": f"Mock output for prompt {prompt_id} with variables: {test_data.input_variables}",
        "execution_time": 1.23,
        "cost": 0.001,
        "success": True,
        "error_message": None,
        "tokens_used": 150,
        "created_at": datetime.utcnow().isoformat()
    }
    
    return result

# Settings endpoints
@app.get("/api/v1/settings", response_model=SettingsResponse, tags=["Settings"])
async def get_settings(current_user = Depends(get_current_user)):
    """Get all settings"""
    return settings_store

@app.put("/api/v1/settings", response_model=SettingsResponse, tags=["Settings"])
async def update_settings(
    settings_data: dict,
    current_user = Depends(get_current_user)
):
    """Update settings"""
    settings_store.update(settings_data)
    return settings_store

# Settings sub-endpoints
@app.get("/api/v1/settings/theme", tags=["Settings"])
async def get_theme_settings(current_user = Depends(get_current_user)):
    """Get theme settings"""
    return settings_store["theme"]

@app.put("/api/v1/settings/theme", tags=["Settings"])
async def update_theme_settings(
    theme_data: dict,
    current_user = Depends(get_current_user)
):
    """Update theme settings"""
    settings_store["theme"].update(theme_data)
    return settings_store["theme"]

@app.get("/api/v1/settings/api-keys", tags=["Settings"])
async def get_api_keys(current_user = Depends(get_current_user)):
    """Get API keys"""
    return settings_store["api_keys"]

@app.get("/api/v1/settings/integrations", tags=["Settings"])
async def get_integrations(current_user = Depends(get_current_user)):
    """Get integrations"""
    return settings_store["integrations"]

@app.get("/api/v1/settings/providers/llm", tags=["Settings"])
async def get_llm_providers(current_user = Depends(get_current_user)):
    """Get LLM providers"""
    return [
        {"id": "openai", "display_name": "OpenAI", "supported_models": ["gpt-4", "gpt-3.5-turbo"]},
        {"id": "anthropic", "display_name": "Anthropic", "supported_models": ["claude-3", "claude-2"]},
        {"id": "gemini", "display_name": "Google Gemini", "supported_models": ["gemini-pro", "gemini-ultra"]}
    ]

# Analytics endpoints (mock data)
@app.get("/api/v1/analytics/usage", tags=["Analytics"])
async def get_usage_metrics(
    time_range: str = Query("week"),
    current_user = Depends(get_current_user)
):
    """Get usage metrics"""
    return {
        "total_prompts": len(prompts_store),
        "total_executions": 150,
        "total_users": 5,
        "execution_trend": [
            {"date": "2024-01-01", "executions": 20},
            {"date": "2024-01-02", "executions": 35},
            {"date": "2024-01-03", "executions": 45},
        ]
    }

@app.get("/api/v1/analytics/performance", tags=["Analytics"])
async def get_performance_metrics(current_user = Depends(get_current_user)):
    """Get performance metrics"""
    return {
        "avg_response_time": 1.2,
        "success_rate": 98.5,
        "error_rate": 1.5,
        "throughput": 120
    }

@app.get("/api/v1/analytics/costs", tags=["Analytics"])
async def get_cost_analysis(current_user = Depends(get_current_user)):
    """Get cost analysis"""
    return {
        "total_cost": 45.67,
        "cost_by_provider": {
            "openai": 30.45,
            "anthropic": 15.22
        },
        "cost_trend": [
            {"date": "2024-01-01", "cost": 12.34},
            {"date": "2024-01-02", "cost": 15.67},
            {"date": "2024-01-03", "cost": 17.66},
        ]
    }

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting PromptPilot API", version="1.0.0")
    
    # Initialize database
    init_db()
    
    # Add some sample data
    sample_prompt_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    prompts_store[sample_prompt_id] = {
        "id": sample_prompt_id,
        "name": "Sample Prompt",
        "description": "A sample prompt for testing",
        "task_type": "text-generation",
        "tags": ["sample", "test"],
        "developer_notes": "This is a sample prompt",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant", "priority": 1},
            {"role": "user", "content": "Hello, how are you?", "priority": 2}
        ],
        "input_variables": {"user_name": "string"},
        "model_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "parameters": {"temperature": 0.7, "max_tokens": 150},
        "status": "published",
        "version": "1.0.0",
        "owner_id": "dev-user-123",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 25,
        "avg_execution_time": 1.45,
        "success_rate": 96.0,
        "total_cost": 2.34
    }
    
    logger.info("PromptPilot API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down PromptPilot API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)