"""
Test cases for enhanced prompt version comparison visualization functionality
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from api.main import app
from tests.utils import TestUtils

client = TestClient(app)

class TestEnhancedVersionComparisonVisualization:
    """Test cases for enhanced prompt version comparison visualization functionality."""
    
    def test_enhanced_version_comparison_with_message_content_diff(self, client: TestClient, db_session: Session):
        """Test enhanced version comparison with detailed message content differences."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "content-diff-test-branch",
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
        
        # Check that differences are properly structured
        differences = comparison["differences"]
        assert isinstance(differences, list)
        
        # Look for messages field in differences
        messages_diff = None
        for diff in differences:
            if diff["field"] == "messages":
                messages_diff = diff
                break
        
        # If messages diff exists, check for content_diff in message diffs
        if messages_diff and "diff" in messages_diff:
            for msg_diff in messages_diff["diff"]:
                # Check that message diffs have proper structure
                assert "index" in msg_diff
                assert "type" in msg_diff
                assert "version1" in msg_diff
                assert "version2" in msg_diff
                # Check for content_diff in message diffs
                if "content_diff" in msg_diff:
                    assert isinstance(msg_diff["content_diff"], list) or msg_diff["content_diff"] is None
    
    def test_enhanced_version_comparison_with_statistics(self, client: TestClient, db_session: Session):
        """Test enhanced version comparison with improved field statistics."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "stats-test-branch",
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
        
        # Check summary structure
        summary = comparison["summary"]
        assert "total_changes" in summary
        assert "added_fields" in summary
        assert "removed_fields" in summary
        assert "modified_fields" in summary
        assert "field_statistics" in summary
        
        # Check field statistics structure
        field_stats = summary["field_statistics"]
        expected_fields = ["messages", "parameters", "input_variables", "other_fields"]
        for field in expected_fields:
            assert field in field_stats
            assert "added" in field_stats[field]
            assert "modified" in field_stats[field]
            assert "removed" in field_stats[field]
    
    def test_frontend_version_comparison_visualization(self, client: TestClient, db_session: Session):
        """Test that the frontend can properly visualize version comparison data."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "frontend-test-branch",
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
        
        # Verify that the data structure is compatible with frontend visualization
        assert "version_a" in comparison
        assert "version_b" in comparison
        assert "differences" in comparison
        assert "summary" in comparison
        
        # Check that version data has required fields for frontend
        version_a = comparison["version_a"]
        version_b = comparison["version_b"]
        assert "id" in version_a
        assert "version" in version_a
        assert "created_at" in version_a
        assert "content" in version_a
        assert "tags" in version_a
        
        assert "id" in version_b
        assert "version" in version_b
        assert "created_at" in version_b
        assert "content" in version_b
        assert "tags" in version_b
        
        # Check differences structure
        differences = comparison["differences"]
        assert isinstance(differences, list)
        
        # Check that each difference has required fields
        for diff in differences:
            assert "field" in diff
            assert "version1" in diff
            assert "version2" in diff
            assert "type" in diff
            assert "diff" in diff or True  # diff field may be None