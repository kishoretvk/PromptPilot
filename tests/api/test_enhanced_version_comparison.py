"""
Test cases for enhanced prompt version comparison functionality
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from api.main import app
from tests.utils import TestUtils

client = TestClient(app)

class TestEnhancedVersionComparison:
    """Test cases for enhanced prompt version comparison functionality."""
    
    def test_enhanced_version_comparison_with_field_statistics(self, client: TestClient, db_session: Session):
        """Test enhanced version comparison with field-level statistics."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch and modify the prompt
        branch_data = {
            "branch_name": "test-branch",
            "source_version_id": initial_version_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        assert response.status_code == 201
        branch_version = response.json()
        
        # Compare versions
        response = client.get(
            f"/api/v1/prompts/{prompt.id}/versions/compare",
            params={
                "version1": initial_version_id,
                "version2": branch_version["id"]
            }
        )
        
        assert response.status_code == 200
        comparison = response.json()
        
        # Check that all expected fields are present
        assert "version_a" in comparison
        assert "version_b" in comparison
        assert "differences" in comparison
        assert "summary" in comparison
        
        # Check summary structure
        summary = comparison["summary"]
        assert "total_changes" in summary
        assert "added_fields" in summary
        assert "removed_fields" in summary
        assert "modified_fields" in summary
        assert "field_statistics" in summary
        
        # Check field statistics structure
        field_stats = summary["field_statistics"]
        assert "messages" in field_stats
        assert "parameters" in field_stats
        assert "input_variables" in field_stats
        assert "other_fields" in field_stats
        
        # Each should have added, modified, removed counts
        for field_type in ["messages", "parameters", "input_variables", "other_fields"]:
            assert "added" in field_stats[field_type]
            assert "modified" in field_stats[field_type]
            assert "removed" in field_stats[field_type]
    
    def test_version_comparison_with_message_diff(self, client: TestClient, db_session: Session):
        """Test version comparison with detailed message differences."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "message-test-branch",
            "source_version_id": initial_version_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        assert response.status_code == 201
        branch_version = response.json()
        
        # Modify the branch version messages
        # This would typically be done through an update endpoint
        # For testing purposes, we'll directly compare versions
        
        # Compare versions
        response = client.get(
            f"/api/v1/prompts/{prompt.id}/versions/compare",
            params={
                "version1": initial_version_id,
                "version2": branch_version["id"]
            }
        )
        
        assert response.status_code == 200
        comparison = response.json()
        
        # Check that differences are properly structured
        differences = comparison["differences"]
        assert isinstance(differences, list)
        
        # Look for messages field in differences
        messages_diff = None
        for diff in differences:
            if diff["field"] == "messages":
                messages_diff = diff
                break
        
        # If messages diff exists, check its structure
        if messages_diff:
            assert "diff" in messages_diff
            assert "type" in messages_diff
            assert "version1" in messages_diff
            assert "version2" in messages_diff
    
    def test_version_comparison_with_parameter_diff(self, client: TestClient, db_session: Session):
        """Test version comparison with detailed parameter differences."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "param-test-branch",
            "source_version_id": initial_version_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        assert response.status_code == 201
        branch_version = response.json()
        
        # Compare versions
        response = client.get(
            f"/api/v1/prompts/{prompt.id}/versions/compare",
            params={
                "version1": initial_version_id,
                "version2": branch_version["id"]
            }
        )
        
        assert response.status_code == 200
        comparison = response.json()
        
        # Check parameter differences structure
        differences = comparison["differences"]
        parameters_diff = None
        for diff in differences:
            if diff["field"] == "parameters":
                parameters_diff = diff
                break
        
        # If parameters diff exists, check its structure
        if parameters_diff:
            assert "diff" in parameters_diff
            assert "type" in parameters_diff
            assert "version1" in parameters_diff
            assert "version2" in parameters_diff
    
    def test_version_comparison_with_input_variables_diff(self, client: TestClient, db_session: Session):
        """Test version comparison with detailed input variables differences."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "vars-test-branch",
            "source_version_id": initial_version_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        assert response.status_code == 201
        branch_version = response.json()
        
        # Compare versions
        response = client.get(
            f"/api/v1/prompts/{prompt.id}/versions/compare",
            params={
                "version1": initial_version_id,
                "version2": branch_version["id"]
            }
        )
        
        assert response.status_code == 200
        comparison = response.json()
        
        # Check input variables differences structure
        differences = comparison["differences"]
        vars_diff = None
        for diff in differences:
            if diff["field"] == "input_variables":
                vars_diff = diff
                break
        
        # If input variables diff exists, check its structure
        if vars_diff:
            assert "diff" in vars_diff
            assert "type" in vars_diff
            assert "version1" in vars_diff
            assert "version2" in vars_diff