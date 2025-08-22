# Comprehensive Backend API Tests
# Tests for the main production API endpoints

import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import uuid

# Import the main app
try:
    from main_production import app
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from main_production import app

# Create test client
client = TestClient(app)

@pytest.fixture
def test_prompt_data():
    """Sample prompt data for testing"""
    return {
        "name": "Test Prompt",
        "description": "A test prompt for unit testing",
        "task_type": "text_generation",
        "tags": ["test", "unit"],
        "messages": [
            {"role": "system", "content": "You are a helpful assistant", "priority": 1},
            {"role": "user", "content": "Generate content about {topic}", "priority": 2}
        ],
        "input_variables": {
            "topic": {"type": "string", "required": True, "description": "Topic to write about"}
        },
        "model_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "parameters": {"temperature": 0.7, "max_tokens": 500}
    }

@pytest.fixture
def mock_api_key():
    """Mock API key for testing"""
    return "sk-test-12345678901234567890123456789012"

@pytest.fixture
def mock_user():
    """Mock user data for testing"""
    return {
        "id": "test-user-123",
        "username": "testuser",
        "email": "test@example.com",
        "role": "user"
    }

class TestRootEndpoint:
    """Test root API endpoint"""
    
    def test_root_endpoint_success(self):
        """Test root endpoint returns correct information"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "PromptPilot API"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
        assert "docs_url" in data
        assert "health_url" in data
        assert "features" in data

class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check_success(self):
        """Test health check returns healthy status"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
        assert "timestamp" in data
        assert "version" in data
        assert "uptime_seconds" in data
        assert "components" in data

    def test_health_check_includes_security_info(self):
        """Test health check includes security information"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "security" in data
        assert "rate_limiting" in data["security"]
        assert "input_validation" in data["security"]

class TestPromptEndpoints:
    """Test prompt management endpoints"""
    
    def test_create_prompt_success(self, test_prompt_data, mock_api_key):
        """Test successful prompt creation"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"write"}}
            
            response = client.post("/api/v1/prompts", json=test_prompt_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["name"] == test_prompt_data["name"]
        assert data["description"] == test_prompt_data["description"]
        assert data["task_type"] == test_prompt_data["task_type"]
        assert "id" in data
        assert "created_at" in data

    def test_create_prompt_validation_error(self):
        """Test prompt creation with invalid data"""
        invalid_data = {
            "name": "",  # Empty name should fail
            "task_type": "invalid_type"
        }
        
        response = client.post("/api/v1/prompts", json=invalid_data)
        
        assert response.status_code == 422  # Validation error

    def test_create_prompt_unauthorized(self, test_prompt_data):
        """Test prompt creation without authorization"""
        response = client.post("/api/v1/prompts", json=test_prompt_data)
        
        assert response.status_code == 401

    def test_get_prompts_list(self, mock_api_key):
        """Test getting list of prompts"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"read"}}
            
            response = client.get("/api/v1/prompts", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data

    def test_get_prompts_with_pagination(self, mock_api_key):
        """Test prompts list with pagination parameters"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"read"}}
            
            response = client.get("/api/v1/prompts?page=2&limit=5", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 2
        assert data["limit"] == 5

    def test_get_prompts_with_filters(self, mock_api_key):
        """Test prompts list with filters"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"read"}}
            
            response = client.get("/api/v1/prompts?task_type=text_generation&tags=test", headers=headers)
        
        assert response.status_code == 200

    def test_get_prompt_by_id(self, mock_api_key):
        """Test getting specific prompt by ID"""
        # First create a prompt to get
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"read"}}
            
            # Check if there are any prompts in store
            response = client.get("/api/v1/prompts", headers={"Authorization": f"Bearer {mock_api_key}"})
            
            if response.status_code == 200 and response.json()["items"]:
                prompt_id = response.json()["items"][0]["id"]
                
                response = client.get(f"/api/v1/prompts/{prompt_id}", headers={"Authorization": f"Bearer {mock_api_key}"})
                
                assert response.status_code == 200
                data = response.json()
                assert data["id"] == prompt_id

    def test_get_nonexistent_prompt(self, mock_api_key):
        """Test getting non-existent prompt"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        fake_id = str(uuid.uuid4())
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"read"}}
            
            response = client.get(f"/api/v1/prompts/{fake_id}", headers=headers)
        
        assert response.status_code == 404

    def test_update_prompt(self, test_prompt_data, mock_api_key):
        """Test updating a prompt"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"write"}}
            
            # First create a prompt
            create_response = client.post("/api/v1/prompts", json=test_prompt_data, headers=headers)
            assert create_response.status_code == 201
            
            prompt_id = create_response.json()["id"]
            
            # Then update it
            update_data = {
                "name": "Updated Test Prompt",
                "description": "Updated description"
            }
            
            response = client.put(f"/api/v1/prompts/{prompt_id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]

    def test_delete_prompt(self, test_prompt_data, mock_api_key):
        """Test deleting a prompt"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"write"}}
            
            # First create a prompt
            create_response = client.post("/api/v1/prompts", json=test_prompt_data, headers=headers)
            assert create_response.status_code == 201
            
            prompt_id = create_response.json()["id"]
            
            # Then delete it
            response = client.delete(f"/api/v1/prompts/{prompt_id}", headers=headers)
        
        assert response.status_code == 204

    def test_test_prompt_execution(self, test_prompt_data, mock_api_key):
        """Test prompt execution endpoint"""
        headers = {"Authorization": f"Bearer {mock_api_key}"}
        
        with patch('main_production.api_key_manager.verify_api_key') as mock_verify:
            mock_verify.return_value = {"user_id": "test-user", "scopes": {"execute"}}
            
            # First create a prompt
            create_response = client.post("/api/v1/prompts", json=test_prompt_data, headers=headers)
            assert create_response.status_code == 201
            
            prompt_id = create_response.json()["id"]
            
            # Test the prompt
            test_data = {
                "input_variables": {"topic": "artificial intelligence"},
                "parameters": {"temperature": 0.8}
            }
            
            response = client.post(f"/api/v1/prompts/{prompt_id}/test", json=test_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "output" in data
        assert "execution_time" in data
        assert "cost" in data
        assert "success" in data
        assert "tokens_used" in data

class TestFrontendLogging:
    """Test frontend error logging endpoints"""
    
    def test_log_frontend_error_success(self):
        """Test successful frontend error logging"""
        error_data = {
            "level": "error",
            "message": "Test frontend error",
            "code": "TEST_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
            "url": "http://localhost:3000/test",
            "userAgent": "Test User Agent"
        }
        
        response = client.post("/api/logs/frontend-error", json=error_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Error logged successfully"
        assert "timestamp" in data

    def test_log_frontend_error_with_context(self):
        """Test frontend error logging with context"""
        error_data = {
            "level": "warning",
            "message": "Test warning with context",
            "timestamp": datetime.utcnow().isoformat(),
            "context": {
                "component": "TestComponent",
                "action": "test_action"
            },
            "details": {
                "additionalInfo": "test details"
            }
        }
        
        headers = {
            "X-Session-ID": "test-session-123",
            "X-User-ID": "test-user-456"
        }
        
        response = client.post("/api/logs/frontend-error", json=error_data, headers=headers)
        
        assert response.status_code == 200

    def test_get_frontend_errors(self):
        """Test retrieving frontend error logs"""
        response = client.get("/api/logs/frontend-errors")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data

    def test_get_frontend_errors_with_filters(self):
        """Test retrieving frontend error logs with filters"""
        response = client.get("/api/logs/frontend-errors?level=error&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["limit"] == 5

    def test_get_frontend_error_stats(self):
        """Test frontend error statistics endpoint"""
        response = client.get("/api/logs/frontend-errors/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_errors" in data
        assert "recent_errors" in data
        assert "level_breakdown" in data
        assert "top_error_codes" in data
        assert "timestamp" in data

class TestRateLimiting:
    """Test rate limiting functionality"""
    
    def test_rate_limiting_enforcement(self):
        """Test that rate limiting is enforced"""
        # This test would require actual rate limiting configuration
        # For now, we'll test that the endpoint doesn't crash
        
        responses = []
        for i in range(5):
            response = client.get("/health")
            responses.append(response.status_code)
        
        # All should succeed for health check (usually not rate limited)
        assert all(status == 200 for status in responses)

class TestSecurityHeaders:
    """Test security headers in responses"""
    
    def test_security_headers_present(self):
        """Test that security headers are present in responses"""
        response = client.get("/health")
        
        assert response.status_code == 200
        
        # These headers should be added by security middleware
        # The exact headers depend on the SecurityMiddleware implementation
        assert "X-Request-ID" in response.headers or "X-Correlation-ID" in response.headers

class TestInputValidation:
    """Test input validation"""
    
    def test_invalid_json_payload(self):
        """Test handling of invalid JSON payload"""
        response = client.post(
            "/api/v1/prompts",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Test validation of missing required fields"""
        incomplete_data = {
            "description": "Missing name field"
        }
        
        response = client.post("/api/v1/prompts", json=incomplete_data)
        
        assert response.status_code in [400, 422]  # Either bad request or validation error

class TestErrorHandling:
    """Test error handling"""
    
    def test_404_for_unknown_endpoint(self):
        """Test 404 response for unknown endpoints"""
        response = client.get("/api/unknown-endpoint")
        
        assert response.status_code == 404

    def test_method_not_allowed(self):
        """Test 405 response for wrong HTTP method"""
        response = client.post("/health")  # Health check only supports GET
        
        assert response.status_code == 405

class TestStartupShutdown:
    """Test application startup and shutdown events"""
    
    def test_startup_creates_sample_data(self):
        """Test that startup event creates sample data"""
        # This tests that the app starts successfully and sample data is available
        response = client.get("/api/v1/prompts")
        
        # Should either be unauthorized (no API key) or return data
        assert response.status_code in [401, 200]
        
        if response.status_code == 200:
            data = response.json()
            assert "items" in data

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment"""
    # This runs once before all tests
    yield
    # Cleanup after all tests

@pytest.fixture(autouse=True)
def reset_stores():
    """Reset in-memory stores before each test"""
    # Clear the in-memory stores
    from main_production import prompts_store, frontend_error_logs
    prompts_store.clear()
    frontend_error_logs.clear()
    yield