# Prompt API Endpoint Tests
# Tests for all prompt-related API endpoints

import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch
from tests.conftest import TestUtils

class TestPromptEndpoints:
    """Test cases for prompt API endpoints."""
    
    def test_create_prompt_success(self, client: TestClient, sample_prompt_data, db_session):
        """Test successful prompt creation."""
        # Create a test user first
        user = TestUtils.create_test_user(db_session)
        sample_prompt_data["creator_id"] = str(user.id)
        
        response = client.post("/api/prompts", json=sample_prompt_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_prompt_data["name"]
        assert data["description"] == sample_prompt_data["description"]
        assert data["task_type"] == sample_prompt_data["task_type"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_prompt_validation_error(self, client: TestClient):
        """Test prompt creation with validation errors."""
        invalid_data = {
            "name": "",  # Empty name should fail validation
            "task_type": "invalid_type"
        }
        
        response = client.post("/api/prompts", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
        assert "detail" in response.json()
    
    def test_get_prompts_list(self, client: TestClient, db_session):
        """Test getting list of prompts."""
        # Create test user and prompts
        user = TestUtils.create_test_user(db_session)
        
        for i in range(3):
            TestUtils.create_test_prompt(
                db_session, 
                {
                    "name": f"Test Prompt {i}",
                    "description": f"Description {i}",
                    "task_type": "text_generation",
                    "tags": ["test"],
                    "messages": [],
                    "input_variables": {},
                    "model_name": "gpt-3.5-turbo",
                    "parameters": {},
                    "creator_id": user.id
                }
            )
        
        response = client.get("/api/prompts")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["total"] == 3
        assert data["page"] == 1
        assert data["limit"] == 20
    
    def test_get_prompts_with_filters(self, client: TestClient, db_session):
        """Test getting prompts with filters."""
        user = TestUtils.create_test_user(db_session)
        
        # Create prompts with different task types
        TestUtils.create_test_prompt(
            db_session,
            {
                "name": "Text Prompt",
                "task_type": "text_generation",
                "tags": ["text"],
                "messages": [],
                "input_variables": {},
                "model_name": "gpt-3.5-turbo",
                "parameters": {},
                "creator_id": user.id
            }
        )
        
        TestUtils.create_test_prompt(
            db_session,
            {
                "name": "Code Prompt", 
                "task_type": "code_generation",
                "tags": ["code"],
                "messages": [],
                "input_variables": {},
                "model_name": "gpt-4",
                "parameters": {},
                "creator_id": user.id
            }
        )
        
        # Filter by task type
        response = client.get("/api/prompts?task_type=text_generation")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["task_type"] == "text_generation"
        
        # Filter by tags
        response = client.get("/api/prompts?tags=code")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert "code" in data["items"][0]["tags"]
    
    def test_get_prompt_by_id(self, client: TestClient, db_session):
        """Test getting a specific prompt by ID."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        response = client.get(f"/api/prompts/{prompt.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(prompt.id)
        assert data["name"] == prompt.name
        assert "version_info" in data
    
    def test_get_nonexistent_prompt(self, client: TestClient):
        """Test getting a non-existent prompt."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/prompts/{fake_id}")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_update_prompt(self, client: TestClient, db_session):
        """Test updating a prompt."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        update_data = {
            "name": "Updated Prompt Name",
            "description": "Updated description",
            "parameters": {"temperature": 0.8}
        }
        
        response = client.put(f"/api/prompts/{prompt.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["parameters"]["temperature"] == 0.8
    
    def test_delete_prompt(self, client: TestClient, db_session):
        """Test deleting a prompt (soft delete)."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        response = client.delete(f"/api/prompts/{prompt.id}")
        
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
        
        # Verify prompt is archived, not actually deleted
        response = client.get(f"/api/prompts/{prompt.id}")
        assert response.status_code == 200
        # In a real implementation, you might check status is "ARCHIVED"
    
    def test_prompt_pagination(self, client: TestClient, db_session):
        """Test prompt list pagination."""
        user = TestUtils.create_test_user(db_session)
        
        # Create 25 test prompts
        for i in range(25):
            TestUtils.create_test_prompt(
                db_session,
                {
                    "name": f"Prompt {i:02d}",
                    "task_type": "text_generation",
                    "tags": ["test"],
                    "messages": [],
                    "input_variables": {},
                    "model_name": "gpt-3.5-turbo",
                    "parameters": {},
                    "creator_id": user.id
                }
            )
        
        # Test first page
        response = client.get("/api/prompts?limit=10&page=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["page"] == 1
        assert data["total"] == 25
        
        # Test second page
        response = client.get("/api/prompts?limit=10&page=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["page"] == 2
        
        # Test last page
        response = client.get("/api/prompts?limit=10&page=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5  # Remaining items
        assert data["page"] == 3

class TestPromptExecution:
    """Test cases for prompt execution endpoints."""
    
    @patch('api.services.llm_service.LLMService.execute_prompt')
    def test_execute_prompt_success(self, mock_execute, client: TestClient, db_session):
        """Test successful prompt execution."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Mock the LLM service response
        mock_execute.return_value = {
            "response": "This is a test response",
            "tokens_used": 50,
            "cost": 0.001,
            "duration": 1.5
        }
        
        execution_data = {
            "input_variables": {"topic": "artificial intelligence"},
            "parameters": {"temperature": 0.7}
        }
        
        response = client.post(f"/api/prompts/{prompt.id}/execute", json=execution_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "tokens_used" in data
        assert "cost" in data
        assert data["response"] == "This is a test response"
    
    @patch('api.services.llm_service.LLMService.execute_prompt')
    def test_execute_prompt_with_missing_variables(self, mock_execute, client: TestClient, db_session):
        """Test prompt execution with missing required variables."""
        user = TestUtils.create_test_user(db_session)
        prompt_data = {
            "name": "Test Prompt",
            "task_type": "text_generation",
            "messages": [{"role": "user", "content": "Tell me about {topic}"}],
            "input_variables": {
                "topic": {"type": "string", "required": True}
            },
            "model_name": "gpt-3.5-turbo",
            "parameters": {},
            "creator_id": user.id
        }
        prompt = TestUtils.create_test_prompt(db_session, prompt_data)
        
        # Execute without required variable
        execution_data = {
            "input_variables": {},  # Missing 'topic'
            "parameters": {"temperature": 0.7}
        }
        
        response = client.post(f"/api/prompts/{prompt.id}/execute", json=execution_data)
        
        assert response.status_code == 422
        assert "topic" in response.json()["detail"]
    
    def test_get_prompt_execution_history(self, client: TestClient, db_session):
        """Test getting prompt execution history."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        response = client.get(f"/api/prompts/{prompt.id}/executions")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestPromptVersions:
    """Test cases for prompt version management."""
    
    def test_get_prompt_versions(self, client: TestClient, db_session):
        """Test getting prompt version history."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        response = client.get(f"/api/prompts/{prompt.id}/versions")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least one version (initial version)
        assert len(data) >= 1
    
    def test_create_prompt_version(self, client: TestClient, db_session):
        """Test creating a new prompt version."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        version_data = {
            "version": "1.1.0",
            "commit_message": "Updated parameters",
            "changes_summary": "Increased temperature for more creative responses"
        }
        
        response = client.post(f"/api/prompts/{prompt.id}/versions", json=version_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["version"] == version_data["version"]
        assert data["commit_message"] == version_data["commit_message"]
    
    def test_get_specific_version(self, client: TestClient, db_session):
        """Test getting a specific prompt version."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get versions to find a specific version ID
        response = client.get(f"/api/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        
        if versions:
            version_id = versions[0]["id"]
            response = client.get(f"/api/prompts/{prompt.id}/versions/{version_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == version_id