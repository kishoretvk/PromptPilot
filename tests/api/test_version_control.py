"""
Test cases for prompt version control functionality
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from api.main import app
from tests.utils import TestUtils

client = TestClient(app)

class TestVersionControl:
    """Test cases for prompt version control functionality."""
    
    def test_create_prompt_branch(self, client: TestClient, db_session: Session):
        """Test creating a new branch from a prompt version."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "feature-branch",
            "source_version_id": initial_version_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "branch-feature-branch" in data["version"]
        assert data["parent_version_id"] == initial_version_id
        assert data["is_active"] is False  # Branches are not active by default
    
    def test_merge_prompt_versions(self, client: TestClient, db_session: Session):
        """Test merging one prompt version into another."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        initial_version_id = versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "feature-branch",
            "source_version_id": initial_version_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        assert response.status_code == 201
        branch_version = response.json()
        
        # Merge the branch back to main
        merge_data = {
            "merge_message": "Merged feature branch"
        }
        
        response = client.post(
            f"/api/v1/prompts/{prompt.id}/versions/{branch_version['id']}/merge/{initial_version_id}",
            json=merge_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_merge"] is True
        assert data["merged_from_version_id"] == branch_version["id"]
        assert data["parent_version_id"] == initial_version_id
    
    def test_tag_prompt_version(self, client: TestClient, db_session: Session):
        """Test adding a tag to a prompt version."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        version_id = versions[0]["id"]
        
        # Add a tag
        tag_data = {
            "tag": "stable"
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/{version_id}/tag", json=tag_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "stable" in data["tags"]
    
    def test_get_prompt_versions_with_branches(self, client: TestClient, db_session: Session):
        """Test getting prompt versions with branch filtering."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        initial_versions = response.json()
        initial_version_id = initial_versions[0]["id"]
        
        # Create a branch
        branch_data = {
            "branch_name": "feature-branch",
            "source_version_id": initial_version_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        assert response.status_code == 201
        
        # Get all versions including branches
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions?include_branches=true")
        assert response.status_code == 200
        all_versions = response.json()
        assert len(all_versions) == len(initial_versions) + 1
        
        # Get only main branch versions
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions?include_branches=false")
        assert response.status_code == 200
        main_versions = response.json()
        assert len(main_versions) == len(initial_versions)
    
    def test_advanced_version_comparison(self, client: TestClient, db_session: Session):
        """Test advanced version comparison with diff capabilities."""
        user = TestUtils.create_test_user(db_session)
        prompt = TestUtils.create_test_prompt(db_session, creator_id=user.id)
        
        # Get the initial version
        response = client.get(f"/api/v1/prompts/{prompt.id}/versions")
        assert response.status_code == 200
        versions = response.json()
        version1_id = versions[0]["id"]
        
        # Create a branch and modify the prompt
        branch_data = {
            "branch_name": "test-branch",
            "source_version_id": version1_id
        }
        
        response = client.post(f"/api/v1/prompts/{prompt.id}/versions/branch", json=branch_data)
        assert response.status_code == 201
        branch_version = response.json()
        
        # Compare versions
        response = client.get(
            f"/api/v1/prompts/{prompt.id}/versions/compare",
            params={
                "version1": version1_id,
                "version2": branch_version["id"]
            }
        )
        
        assert response.status_code == 200
        comparison = response.json()
        assert "version_a" in comparison
        assert "version_b" in comparison
        assert "differences" in comparison
        assert "summary" in comparison