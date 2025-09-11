#!/usr/bin/env python3
"""
PromptPilot Real API Server

FastAPI application with real database integration and service layer.
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import structlog
import uuid
from datetime import datetime
import json

from .database import get_db, initialize_database
from .services import PromptService, AnalyticsService, SettingsService
from .schemas import (
    PaginatedResponse, PromptResponse, CreatePromptRequest, UpdatePromptRequest,
    TestPromptRequest, TestResultResponse, MessageResponse, SettingsResponse,
    PromptStatusEnum
)

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

# Dependency to get database session
def get_db_session():
    """Get database session"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

# Dependency to get services
def get_prompt_service(db=Depends(get_db_session)):
    """Get prompt service instance"""
    return PromptService(db)

def get_analytics_service(db=Depends(get_db_session)):
    """Get analytics service instance"""
    return AnalyticsService(db)

def get_settings_service(db=Depends(get_db_session)):
    """Get settings service instance"""
    return SettingsService(db)

# Mock user dependency for now
class MockUser:
    def __init__(self):
        self.id = "dev-user-123"
        self.username = "dev"
        self.email = "dev@promptpilot.com"

def get_current_user():
    """Mock user dependency - replace with real auth later"""
    return MockUser()

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
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "database": "connected"
    }

# Prompt Management Endpoints
@app.get("/api/v1/prompts", response_model=PaginatedResponse[PromptResponse], tags=["Prompts"])
async def get_prompts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    task_type: Optional[str] = None,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user = Depends(get_current_user)
):
    """Get paginated list of prompts with filtering"""
    logger.info("Fetching prompts", user_id=current_user.id, page=page, limit=limit)

    try:
        result = await prompt_service.get_prompts(
            page=page,
            limit=limit,
            search=search,
            tags=tags,
            task_type=task_type
        )
        return result
    except Exception as e:
        logger.error(f"Failed to fetch prompts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch prompts")

@app.get("/api/v1/prompts/{prompt_id}", response_model=PromptResponse, tags=["Prompts"])
async def get_prompt(
    prompt_id: str,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user = Depends(get_current_user)
):
    """Get specific prompt by ID"""
    logger.info("Fetching prompt", user_id=current_user.id, prompt_id=prompt_id)

    try:
        prompt = await prompt_service.get_prompt(prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
        return prompt
    except Exception as e:
        logger.error(f"Failed to fetch prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch prompt")

@app.post("/api/v1/prompts", response_model=PromptResponse, status_code=201, tags=["Prompts"])
async def create_prompt(
    prompt_data: CreatePromptRequest,
    background_tasks: BackgroundTasks,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user = Depends(get_current_user)
):
    """Create a new prompt"""
    logger.info("Creating prompt", user_id=current_user.id, prompt_name=prompt_data.name)

    try:
        result = await prompt_service.create_prompt(prompt_data, current_user.id)
        return result
    except Exception as e:
        logger.error(f"Failed to create prompt: {e}")
        raise HTTPException(status_code=500, detail="Failed to create prompt")

@app.put("/api/v1/prompts/{prompt_id}", response_model=PromptResponse, tags=["Prompts"])
async def update_prompt(
    prompt_id: str,
    prompt_data: UpdatePromptRequest,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user = Depends(get_current_user)
):
    """Update existing prompt"""
    logger.info("Updating prompt", user_id=current_user.id, prompt_id=prompt_id)

    try:
        result = await prompt_service.update_prompt(prompt_id, prompt_data, current_user.id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
        return result
    except Exception as e:
        logger.error(f"Failed to update prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update prompt")

@app.delete("/api/v1/prompts/{prompt_id}", status_code=204, tags=["Prompts"])
async def delete_prompt(
    prompt_id: str,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user = Depends(get_current_user)
):
    """Delete prompt"""
    logger.info("Deleting prompt", user_id=current_user.id, prompt_id=prompt_id)

    try:
        success = await prompt_service.delete_prompt(prompt_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
    except Exception as e:
        logger.error(f"Failed to delete prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete prompt")

@app.post("/api/v1/prompts/{prompt_id}/test", response_model=TestResultResponse, tags=["Prompts"])
async def test_prompt(
    prompt_id: str,
    test_data: TestPromptRequest,
    background_tasks: BackgroundTasks,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user = Depends(get_current_user)
):
    """Test prompt execution"""
    logger.info("Testing prompt", user_id=current_user.id, prompt_id=prompt_id)

    try:
        # For now, create a mock LLM service
        from .services import LLMService
        llm_service = LLMService()

        result = await prompt_service.test_prompt(prompt_id, test_data, llm_service)
        return result
    except Exception as e:
        logger.error(f"Failed to test prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to test prompt")

# Analytics endpoints
@app.get("/api/v1/analytics/usage", tags=["Analytics"])
async def get_usage_metrics(
    time_range: str = Query("week"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    current_user = Depends(get_current_user)
):
    """Get usage metrics"""
    logger.info("Fetching usage metrics", user_id=current_user.id, time_range=time_range)

    try:
        filters = {"time_range": time_range}
        result = await analytics_service.get_usage_metrics(filters)
        return result
    except Exception as e:
        logger.error(f"Failed to fetch usage metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch usage metrics")

# Settings endpoints
@app.get("/api/v1/settings", response_model=SettingsResponse, tags=["Settings"])
async def get_settings(
    settings_service: SettingsService = Depends(get_settings_service),
    current_user = Depends(get_current_user)
):
    """Get all settings"""
    logger.info("Fetching settings", user_id=current_user.id)

    try:
        # For now, return mock settings
        return {
            "theme": {"mode": "light", "primary_color": "#1976d2"},
            "notifications": {"email_notifications": True},
            "security": {"require_api_key": False},
            "api_keys": [],
            "integrations": []
        }
    except Exception as e:
        logger.error(f"Failed to fetch settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

@app.put("/api/v1/settings", response_model=SettingsResponse, tags=["Settings"])
async def update_settings(
    settings_data: dict,
    settings_service: SettingsService = Depends(get_settings_service),
    current_user = Depends(get_current_user)
):
    """Update settings"""
    logger.info("Updating settings", user_id=current_user.id)

    try:
        # For now, just return the data
        return settings_data
    except Exception as e:
        logger.error(f"Failed to update settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting PromptPilot API", version="1.0.0")

    # Initialize database
    success = initialize_database()
    if not success:
        logger.error("Failed to initialize database")
        raise Exception("Database initialization failed")

    logger.info("PromptPilot API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down PromptPilot API")

if __name__ == "__main__":
    import uvicorn
