# secrets.py
# Secrets management for PromptPilot

import os
import json
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
import base64
from api.config import settings

class SecretsManager:
    def __init__(self, key: Optional[bytes] = None):
        """
        Initialize the secrets manager.
        
        Args:
            key: Encryption key. If None, will generate or load from environment.
        """
        if key is None:
            # Try to get key from environment or generate a new one
            key_str = os.getenv("SECRETS_ENCRYPTION_KEY")
            if key_str:
                self.key = base64.urlsafe_b64decode(key_str)
            else:
                # Generate a new key (WARNING: This will not persist between restarts)
                self.key = Fernet.generate_key()
                print("WARNING: Generated new encryption key. Secrets will not persist!")
        else:
            self.key = key
        
        self.cipher = Fernet(self.key)
        self.secrets_file = "./data/secrets.json"
        
        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(self.secrets_file), exist_ok=True)
        
        # Create secrets file if it doesn't exist
        if not os.path.exists(self.secrets_file):
            with open(self.secrets_file, "w") as f:
                json.dump({}, f)
    
    def encrypt(self, value: str) -> str:
        """Encrypt a value."""
        return self.cipher.encrypt(value.encode()).decode()
    
    def decrypt(self, encrypted_value: str) -> str:
        """Decrypt a value."""
        return self.cipher.decrypt(encrypted_value.encode()).decode()
    
    def store_secret(self, key: str, value: str, encrypt: bool = True) -> None:
        """
        Store a secret value.
        
        Args:
            key: The key to store the secret under
            value: The secret value to store
            encrypt: Whether to encrypt the value (default: True)
        """
        # Load existing secrets
        secrets = self._load_secrets()
        
        # Encrypt if requested
        if encrypt:
            value = self.encrypt(value)
            secrets[key] = {"value": value, "encrypted": True}
        else:
            secrets[key] = {"value": value, "encrypted": False}
        
        # Save secrets
        self._save_secrets(secrets)
    
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Retrieve a secret value.
        
        Args:
            key: The key of the secret to retrieve
            default: Default value if key not found
            
        Returns:
            The decrypted secret value, or default if not found
        """
        secrets = self._load_secrets()
        
        if key not in secrets:
            return default
        
        secret_data = secrets[key]
        value = secret_data["value"]
        
        # Decrypt if it was encrypted
        if secret_data.get("encrypted", False):
            try:
                value = self.decrypt(value)
            except Exception as e:
                print(f"Error decrypting secret {key}: {e}")
                return default
        
        return value
    
    def delete_secret(self, key: str) -> bool:
        """
        Delete a secret.
        
        Args:
            key: The key of the secret to delete
            
        Returns:
            True if secret was deleted, False if it didn't exist
        """
        secrets = self._load_secrets()
        
        if key in secrets:
            del secrets[key]
            self._save_secrets(secrets)
            return True
        return False
    
    def list_secrets(self) -> Dict[str, bool]:
        """
        List all secret keys and their encryption status.
        
        Returns:
            Dictionary mapping secret keys to whether they are encrypted
        """
        secrets = self._load_secrets()
        return {key: data.get("encrypted", False) for key, data in secrets.items()}
    
    def _load_secrets(self) -> Dict[str, Dict[str, Any]]:
        """Load secrets from file."""
        try:
            with open(self.secrets_file, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
        except json.JSONDecodeError:
            print(f"Warning: Could not decode secrets file {self.secrets_file}")
            return {}
    
    def _save_secrets(self, secrets: Dict[str, Dict[str, Any]]) -> None:
        """Save secrets to file."""
        with open(self.secrets_file, "w") as f:
            json.dump(secrets, f, indent=2)

# Global secrets manager instance
secrets_manager = SecretsManager()

# Convenience functions
def store_secret(key: str, value: str, encrypt: bool = True) -> None:
    """Store a secret value."""
    secrets_manager.store_secret(key, value, encrypt)

def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """Retrieve a secret value."""
    return secrets_manager.get_secret(key, default)

def delete_secret(key: str) -> bool:
    """Delete a secret."""
    return secrets_manager.delete_secret(key)

def list_secrets() -> Dict[str, bool]:
    """List all secret keys and their encryption status."""
    return secrets_manager.list_secrets()

# Function to migrate environment variables to secrets
def migrate_env_to_secrets() -> None:
    """Migrate sensitive environment variables to secrets storage."""
    env_vars_to_migrate = [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY", 
        "GOOGLE_API_KEY",
        "SECRET_KEY"
    ]
    
    for var_name in env_vars_to_migrate:
        var_value = os.getenv(var_name)
        if var_value:
            store_secret(var_name, var_value)
            print(f"Migrated {var_name} to secrets storage")

if __name__ == "__main__":
    # Example usage
    print("PromptPilot Secrets Manager")
    print("---------------------------")
    
    # Store a secret
    store_secret("test_key", "test_value")
    print("Stored secret: test_key")
    
    # Retrieve a secret
    value = get_secret("test_key")
    print(f"Retrieved secret: {value}")
    
    # List secrets
    secrets = list_secrets()
    print(f"Stored secrets: {list(secrets.keys())}")