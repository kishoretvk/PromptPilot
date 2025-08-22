# Test Configuration and Fixtures
# Provides common test utilities, fixtures, and configuration

import os
import asyncio
import pytest
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import your application
from api.rest import app
from api.database.config import get_db
from api.database.models import Base
from api.services.storage_service import StorageService

# Test database URL (using SQLite for tests)
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine with in-memory SQLite
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def storage_service(db_session):
    """Create a storage service instance for testing."""
    # Mock the database session in storage service if needed
    return StorageService()

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "testpassword123",
        "role": "USER"
    }

@pytest.fixture
def sample_prompt_data():
    """Sample prompt data for testing."""
    return {
        "name": "Test Prompt",
        "description": "A test prompt for unit testing",
        "task_type": "text_generation",
        "tags": ["test", "automation"],
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant.",
                "priority": 1
            },
            {
                "role": "user", 
                "content": "Generate a test response for {topic}.",
                "priority": 2
            }
        ],
        "input_variables": {
            "topic": {
                "type": "string",
                "description": "The topic to generate content about",
                "required": True
            }
        },
        "model_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100
        },
        "test_cases": [
            {
                "name": "Basic Test",
                "input_data": {"topic": "artificial intelligence"},
                "expected_output_contains": ["AI", "intelligence"],
                "evaluation_criteria": ["accuracy", "relevance"]
            }
        ]
    }

@pytest.fixture
def sample_pipeline_data():
    """Sample pipeline data for testing."""
    return {
        "name": "Test Pipeline",
        "description": "A test pipeline for unit testing",
        "steps": [
            {
                "name": "Step 1",
                "type": "prompt",
                "configuration": {
                    "temperature": 0.5
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "name": "Step 2", 
                "type": "aggregator",
                "configuration": {
                    "format": "json"
                },
                "position": {"x": 300, "y": 100}
            }
        ],
        "error_strategy": "fail_fast"
    }

@pytest.fixture
def auth_headers():
    """Create authorization headers for testing."""
    # In a real test, you'd create a JWT token
    return {"Authorization": "Bearer test-token"}

# Test utilities
class TestUtils:
    """Utility functions for testing."""
    
    @staticmethod
    def create_test_user(session, user_data=None):
        """Create a test user in the database."""
        from api.database.models import User
        
        if user_data is None:
            user_data = {
                "username": "testuser",
                "email": "test@example.com",
                "full_name": "Test User",
                "hashed_password": "hashed_password",
                "role": "USER"
            }
        
        user = User(**user_data)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    
    @staticmethod
    def create_test_prompt(session, prompt_data=None, creator_id=None):
        """Create a test prompt in the database."""
        from api.database.models import Prompt
        
        if prompt_data is None:
            prompt_data = {
                "name": "Test Prompt",
                "description": "Test prompt description",
                "task_type": "text_generation",
                "tags": ["test"],
                "messages": [],
                "input_variables": {},
                "model_name": "gpt-3.5-turbo",
                "parameters": {},
                "creator_id": creator_id
            }
        
        prompt = Prompt(**prompt_data)
        session.add(prompt)
        session.commit()
        session.refresh(prompt)
        return prompt
    
    @staticmethod
    def create_test_pipeline(session, pipeline_data=None, creator_id=None):
        """Create a test pipeline in the database."""
        from api.database.models import Pipeline
        
        if pipeline_data is None:
            pipeline_data = {
                "name": "Test Pipeline",
                "description": "Test pipeline description",
                "error_strategy": "fail_fast",
                "creator_id": creator_id
            }
        
        pipeline = Pipeline(**pipeline_data)
        session.add(pipeline)
        session.commit()
        session.refresh(pipeline)
        return pipeline

# Mock configurations for testing
TEST_CONFIG = {
    "DATABASE_URL": TEST_DATABASE_URL,
    "SECRET_KEY": "test-secret-key",
    "JWT_SECRET_KEY": "test-jwt-secret",
    "TESTING": True,
    "LOG_LEVEL": "DEBUG"
}

# Apply test configuration
for key, value in TEST_CONFIG.items():
    os.environ[key] = str(value)