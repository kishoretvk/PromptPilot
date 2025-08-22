# Default Data Initialization
# This module contains default prompts, LLM providers, and configurations
# that are loaded when the application starts for the first time

from datetime import datetime, timezone
from typing import List, Dict, Any
import uuid
import json
import structlog

logger = structlog.get_logger()

# Default LLM Provider Configurations
DEFAULT_LLM_PROVIDERS = [
    {
        "id": str(uuid.uuid4()),
        "name": "OpenAI",
        "provider_type": "openai",
        "base_url": "https://api.openai.com/v1",
        "api_key": None,  # User needs to configure
        "models": [
            {
                "name": "gpt-3.5-turbo",
                "display_name": "GPT-3.5 Turbo",
                "description": "Fast, cost-effective model for most tasks",
                "max_tokens": 4096,
                "context_window": 16385,
                "cost_per_1k_tokens": {"input": 0.0015, "output": 0.002},
                "capabilities": ["text", "chat", "function_calling"]
            },
            {
                "name": "gpt-4",
                "display_name": "GPT-4",
                "description": "More capable model for complex tasks",
                "max_tokens": 8192,
                "context_window": 8192,
                "cost_per_1k_tokens": {"input": 0.03, "output": 0.06},
                "capabilities": ["text", "chat", "function_calling"]
            },
            {
                "name": "gpt-4-turbo",
                "display_name": "GPT-4 Turbo",
                "description": "Latest GPT-4 model with improved performance",
                "max_tokens": 4096,
                "context_window": 128000,
                "cost_per_1k_tokens": {"input": 0.01, "output": 0.03},
                "capabilities": ["text", "chat", "function_calling", "vision"]
            }
        ],
        "configuration": {
            "timeout": 30,
            "retry_attempts": 3,
            "temperature_range": [0.0, 2.0],
            "max_tokens_range": [1, 4096],
            "supports_streaming": True,
            "supports_function_calling": True
        },
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Anthropic",
        "provider_type": "anthropic",
        "base_url": "https://api.anthropic.com",
        "api_key": None,  # User needs to configure
        "models": [
            {
                "name": "claude-3-sonnet-20240229",
                "display_name": "Claude 3 Sonnet",
                "description": "Balanced model for most tasks",
                "max_tokens": 4096,
                "context_window": 200000,
                "cost_per_1k_tokens": {"input": 0.003, "output": 0.015},
                "capabilities": ["text", "chat", "vision"]
            },
            {
                "name": "claude-3-opus-20240229",
                "display_name": "Claude 3 Opus",
                "description": "Most capable model for complex tasks",
                "max_tokens": 4096,
                "context_window": 200000,
                "cost_per_1k_tokens": {"input": 0.015, "output": 0.075},
                "capabilities": ["text", "chat", "vision"]
            },
            {
                "name": "claude-3-haiku-20240307",
                "display_name": "Claude 3 Haiku",
                "description": "Fastest and most cost-effective model",
                "max_tokens": 4096,
                "context_window": 200000,
                "cost_per_1k_tokens": {"input": 0.00025, "output": 0.00125},
                "capabilities": ["text", "chat", "vision"]
            }
        ],
        "configuration": {
            "timeout": 30,
            "retry_attempts": 3,
            "temperature_range": [0.0, 1.0],
            "max_tokens_range": [1, 4096],
            "supports_streaming": True,
            "supports_function_calling": False
        },
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Local Ollama",
        "provider_type": "ollama",
        "base_url": "http://localhost:11434",
        "api_key": None,  # Not required for local models
        "models": [
            {
                "name": "llama2",
                "display_name": "Llama 2",
                "description": "Open source model running locally",
                "max_tokens": 4096,
                "context_window": 4096,
                "cost_per_1k_tokens": {"input": 0.0, "output": 0.0},
                "capabilities": ["text", "chat"]
            },
            {
                "name": "codellama",
                "display_name": "Code Llama",
                "description": "Specialized for code generation and analysis",
                "max_tokens": 4096,
                "context_window": 16384,
                "cost_per_1k_tokens": {"input": 0.0, "output": 0.0},
                "capabilities": ["text", "chat", "code"]
            },
            {
                "name": "mistral",
                "display_name": "Mistral 7B",
                "description": "Efficient open source model",
                "max_tokens": 4096,
                "context_window": 8192,
                "cost_per_1k_tokens": {"input": 0.0, "output": 0.0},
                "capabilities": ["text", "chat"]
            }
        ],
        "configuration": {
            "timeout": 60,
            "retry_attempts": 2,
            "temperature_range": [0.0, 1.0],
            "max_tokens_range": [1, 4096],
            "supports_streaming": True,
            "supports_function_calling": False
        },
        "is_active": False,  # Disabled by default as it requires local setup
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]

# Default Prompt Templates
DEFAULT_PROMPTS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Text Summarization",
        "description": "Summarize long text content into concise key points",
        "task_type": "text_generation",
        "tags": ["summarization", "content", "analysis"],
        "developer_notes": "Adjust the summary length based on your needs. Works well with articles, documents, and reports.",
        "version_info": {
            "version": "1.0.0",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system",
            "is_active": True,
            "status": "ACTIVE",
            "author": "PromptPilot Team"
        },
        "messages": [
            {
                "role": "system",
                "content": "You are an expert text summarizer. Your task is to create clear, concise summaries that capture the essential information from any given text.",
                "priority": 1
            },
            {
                "role": "user",
                "content": "Please summarize the following text in {summary_length} sentences, focusing on the main points and key takeaways:\n\n{text_content}",
                "priority": 2
            }
        ],
        "input_variables": {
            "text_content": {
                "type": "string",
                "description": "The text content to be summarized",
                "required": True
            },
            "summary_length": {
                "type": "string",
                "description": "Number of sentences for the summary (e.g., '3-4', '5')",
                "required": False,
                "default": "3-5"
            }
        },
        "model_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "parameters": {
            "temperature": 0.3,
            "max_tokens": 500,
            "top_p": 0.9
        },
        "test_cases": [
            {
                "name": "Article Summary Test",
                "input_data": {
                    "text_content": "Artificial intelligence (AI) is rapidly transforming industries across the globe. From healthcare to finance, AI applications are improving efficiency and creating new opportunities. However, this technological advancement also brings challenges including job displacement, privacy concerns, and the need for new regulatory frameworks. Companies are investing heavily in AI research and development, while governments are working to establish guidelines for ethical AI use.",
                    "summary_length": "2-3"
                },
                "expected_output_contains": ["AI transforming industries", "challenges", "opportunities"],
                "evaluation_criteria": ["accuracy", "conciseness", "completeness"]
            }
        ],
        "evaluation_metrics": {
            "quality_score": 0.0,
            "avg_response_time": 0.0,
            "success_rate": 0.0,
            "cost_per_execution": 0.0
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Code Generation Assistant",
        "description": "Generate clean, well-documented code in various programming languages",
        "task_type": "code_generation",
        "tags": ["programming", "code", "development"],
        "developer_notes": "Specify the programming language and provide clear requirements for best results.",
        "version_info": {
            "version": "1.0.0",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system",
            "is_active": True,
            "status": "ACTIVE",
            "author": "PromptPilot Team"
        },
        "messages": [
            {
                "role": "system",
                "content": "You are an expert software developer with extensive knowledge of programming languages, best practices, and clean code principles. You write efficient, readable, and well-documented code.",
                "priority": 1
            },
            {
                "role": "user",
                "content": "Generate {language} code for the following requirement:\n\n{requirement}\n\nPlease include:\n- Clear variable names and structure\n- Appropriate comments\n- Error handling where applicable\n- Following {language} best practices",
                "priority": 2
            }
        ],
        "input_variables": {
            "requirement": {
                "type": "string",
                "description": "Detailed description of what the code should do",
                "required": True
            },
            "language": {
                "type": "string",
                "description": "Programming language (e.g., Python, JavaScript, Java)",
                "required": True
            }
        },
        "model_provider": "openai",
        "model_name": "gpt-4",
        "parameters": {
            "temperature": 0.2,
            "max_tokens": 1500,
            "top_p": 0.95
        },
        "test_cases": [
            {
                "name": "Python Function Test",
                "input_data": {
                    "requirement": "Create a function that calculates the factorial of a number",
                    "language": "Python"
                },
                "expected_output_contains": ["def", "factorial", "return"],
                "evaluation_criteria": ["correctness", "readability", "best_practices"]
            }
        ],
        "evaluation_metrics": {
            "quality_score": 0.0,
            "avg_response_time": 0.0,
            "success_rate": 0.0,
            "cost_per_execution": 0.0
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Creative Writing Assistant",
        "description": "Generate creative content including stories, marketing copy, and creative descriptions",
        "task_type": "creative_writing",
        "tags": ["creative", "writing", "content", "storytelling"],
        "developer_notes": "Adjust tone and style parameters based on your target audience and content goals.",
        "version_info": {
            "version": "1.0.0",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system",
            "is_active": True,
            "status": "ACTIVE",
            "author": "PromptPilot Team"
        },
        "messages": [
            {
                "role": "system",
                "content": "You are a creative writing expert with a talent for crafting engaging, original content. You adapt your writing style to match the desired tone and audience while maintaining creativity and authenticity.",
                "priority": 1
            },
            {
                "role": "user",
                "content": "Create {content_type} with the following specifications:\n\nTopic: {topic}\nTone: {tone}\nTarget Audience: {audience}\nLength: {length}\n\nAdditional requirements: {additional_requirements}",
                "priority": 2
            }
        ],
        "input_variables": {
            "content_type": {
                "type": "string",
                "description": "Type of content (e.g., short story, blog post, product description)",
                "required": True
            },
            "topic": {
                "type": "string",
                "description": "Main topic or theme for the content",
                "required": True
            },
            "tone": {
                "type": "string",
                "description": "Desired tone (e.g., professional, casual, humorous, dramatic)",
                "required": False,
                "default": "engaging"
            },
            "audience": {
                "type": "string",
                "description": "Target audience description",
                "required": False,
                "default": "general audience"
            },
            "length": {
                "type": "string",
                "description": "Desired length (e.g., 200 words, 3 paragraphs)",
                "required": False,
                "default": "medium length"
            },
            "additional_requirements": {
                "type": "string",
                "description": "Any specific requirements or constraints",
                "required": False,
                "default": "none"
            }
        },
        "model_provider": "openai",
        "model_name": "gpt-4",
        "parameters": {
            "temperature": 0.8,
            "max_tokens": 1000,
            "top_p": 0.9
        },
        "test_cases": [
            {
                "name": "Product Description Test",
                "input_data": {
                    "content_type": "product description",
                    "topic": "eco-friendly water bottle",
                    "tone": "professional yet friendly",
                    "audience": "environmentally conscious consumers",
                    "length": "150 words"
                },
                "expected_output_contains": ["eco-friendly", "water bottle", "environment"],
                "evaluation_criteria": ["creativity", "tone_matching", "audience_appropriateness"]
            }
        ],
        "evaluation_metrics": {
            "quality_score": 0.0,
            "avg_response_time": 0.0,
            "success_rate": 0.0,
            "cost_per_execution": 0.0
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Data Analysis Interpreter",
        "description": "Analyze data patterns and provide insights with clear explanations",
        "task_type": "data_analysis",
        "tags": ["data", "analysis", "insights", "interpretation"],
        "developer_notes": "Provide data in structured format (CSV, JSON) for best analysis results.",
        "version_info": {
            "version": "1.0.0",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system",
            "is_active": True,
            "status": "ACTIVE",
            "author": "PromptPilot Team"
        },
        "messages": [
            {
                "role": "system",
                "content": "You are a data analysis expert skilled in identifying patterns, trends, and insights from various types of data. You provide clear, actionable insights with supporting evidence and recommendations.",
                "priority": 1
            },
            {
                "role": "user",
                "content": "Analyze the following data and provide insights:\n\nData: {data}\nAnalysis Focus: {focus_area}\n\nPlease provide:\n1. Key patterns and trends\n2. Notable insights\n3. Potential implications\n4. Recommended actions (if applicable)\n\nPresent findings in a clear, structured format.",
                "priority": 2
            }
        ],
        "input_variables": {
            "data": {
                "type": "string",
                "description": "Data to be analyzed (can be CSV, JSON, or structured text)",
                "required": True
            },
            "focus_area": {
                "type": "string",
                "description": "Specific aspect to focus on (e.g., sales trends, user behavior, performance metrics)",
                "required": False,
                "default": "general analysis"
            }
        },
        "model_provider": "openai",
        "model_name": "gpt-4",
        "parameters": {
            "temperature": 0.1,
            "max_tokens": 1200,
            "top_p": 0.9
        },
        "test_cases": [
            {
                "name": "Sales Data Analysis Test",
                "input_data": {
                    "data": "Month,Sales,Customers\nJan,10000,150\nFeb,12000,180\nMar,15000,220\nApr,13000,200",
                    "focus_area": "sales trends"
                },
                "expected_output_contains": ["trend", "growth", "customers"],
                "evaluation_criteria": ["accuracy", "insight_quality", "actionability"]
            }
        ],
        "evaluation_metrics": {
            "quality_score": 0.0,
            "avg_response_time": 0.0,
            "success_rate": 0.0,
            "cost_per_execution": 0.0
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Language Translation",
        "description": "Translate text between languages while preserving context and nuance",
        "task_type": "translation",
        "tags": ["translation", "languages", "localization"],
        "developer_notes": "Specify both source and target languages for optimal results. Works well with context-aware translations.",
        "version_info": {
            "version": "1.0.0",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system",
            "is_active": True,
            "status": "ACTIVE",
            "author": "PromptPilot Team"
        },
        "messages": [
            {
                "role": "system",
                "content": "You are an expert translator fluent in multiple languages. You provide accurate translations that preserve the original meaning, tone, and cultural context while ensuring natural flow in the target language.",
                "priority": 1
            },
            {
                "role": "user",
                "content": "Translate the following text from {source_language} to {target_language}:\n\n{text_to_translate}\n\nPlease ensure the translation:\n- Maintains the original meaning and tone\n- Sounds natural in {target_language}\n- Preserves any cultural context\n- Uses appropriate formality level",
                "priority": 2
            }
        ],
        "input_variables": {
            "text_to_translate": {
                "type": "string",
                "description": "Text to be translated",
                "required": True
            },
            "source_language": {
                "type": "string",
                "description": "Source language (e.g., English, Spanish, French)",
                "required": True
            },
            "target_language": {
                "type": "string",
                "description": "Target language for translation",
                "required": True
            }
        },
        "model_provider": "openai",
        "model_name": "gpt-4",
        "parameters": {
            "temperature": 0.2,
            "max_tokens": 800,
            "top_p": 0.95
        },
        "test_cases": [
            {
                "name": "English to Spanish Test",
                "input_data": {
                    "text_to_translate": "Thank you for your excellent customer service. We appreciate your prompt response.",
                    "source_language": "English",
                    "target_language": "Spanish"
                },
                "expected_output_contains": ["gracias", "servicio", "cliente"],
                "evaluation_criteria": ["accuracy", "naturalness", "tone_preservation"]
            }
        ],
        "evaluation_metrics": {
            "quality_score": 0.0,
            "avg_response_time": 0.0,
            "success_rate": 0.0,
            "cost_per_execution": 0.0
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]

# Default System Settings
DEFAULT_SETTINGS = {
    "general": {
        "app_name": "PromptPilot",
        "version": "1.0.0",
        "theme": "light",
        "language": "en",
        "timezone": "UTC",
        "auto_save": True,
        "max_concurrent_requests": 10
    },
    "security": {
        "session_timeout": 3600,  # 1 hour
        "max_login_attempts": 5,
        "password_min_length": 8,
        "require_2fa": False,
        "allowed_domains": [],
        "cors_origins": ["http://localhost:3000"],
        "rate_limit_per_minute": 100
    },
    "api": {
        "default_timeout": 30,
        "max_retries": 3,
        "retry_delay": 1,
        "enable_caching": True,
        "cache_ttl": 300,  # 5 minutes
        "log_requests": True
    },
    "ui": {
        "items_per_page": 20,
        "auto_refresh_interval": 30,
        "show_advanced_options": False,
        "enable_dark_mode": True,
        "sidebar_collapsed": False,
        "show_performance_metrics": True
    },
    "notifications": {
        "email_enabled": False,
        "smtp_server": "",
        "smtp_port": 587,
        "smtp_username": "",
        "smtp_password": "",
        "webhook_url": "",
        "slack_webhook": ""
    },
    "monitoring": {
        "enable_metrics": True,
        "enable_tracing": False,
        "log_level": "INFO",
        "retention_days": 30,
        "alert_thresholds": {
            "error_rate": 0.05,
            "response_time": 5000,  # milliseconds
            "memory_usage": 0.85
        }
    }
}

# Default Pipeline Templates
DEFAULT_PIPELINES = [
    {
        "id": str(uuid.uuid4()),
        "name": "Content Processing Pipeline",
        "description": "Multi-step pipeline for processing and analyzing content",
        "steps": [
            {
                "id": str(uuid.uuid4()),
                "name": "Content Extraction",
                "type": "prompt",
                "prompt_id": None,  # Will be set to text summarization prompt
                "configuration": {
                    "temperature": 0.3,
                    "max_tokens": 500
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Sentiment Analysis",
                "type": "prompt",
                "prompt_id": None,  # Will be set to data analysis prompt
                "configuration": {
                    "temperature": 0.1,
                    "max_tokens": 300
                },
                "position": {"x": 300, "y": 100}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Final Report",
                "type": "aggregator",
                "configuration": {
                    "format": "json",
                    "include_metadata": True
                },
                "position": {"x": 500, "y": 100}
            }
        ],
        "connections": [
            {
                "source": "step_1",
                "target": "step_2",
                "type": "data_flow"
            },
            {
                "source": "step_2",
                "target": "step_3",
                "type": "data_flow"
            }
        ],
        "error_strategy": "fail_fast",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]

class DefaultDataInitializer:
    """Handles initialization of default data for new installations."""
    
    def __init__(self, storage_service):
        self.storage = storage_service
        self.logger = structlog.get_logger()
    
    async def initialize_default_data(self) -> Dict[str, bool]:
        """Initialize all default data if not already present."""
        results = {}
        
        try:
            # Initialize LLM providers
            results["providers"] = await self._initialize_providers()
            
            # Initialize prompts
            results["prompts"] = await self._initialize_prompts()
            
            # Initialize settings
            results["settings"] = await self._initialize_settings()
            
            # Initialize pipelines
            results["pipelines"] = await self._initialize_pipelines()
            
            self.logger.info(
                "Default data initialization completed",
                results=results
            )
            
            return results
            
        except Exception as e:
            self.logger.error(
                "Failed to initialize default data",
                error=str(e)
            )
            raise
    
    async def _initialize_providers(self) -> bool:
        """Initialize default LLM providers."""
        try:
            # Check if providers already exist
            existing_providers = await self.storage.list_llm_providers()
            if existing_providers:
                self.logger.info("LLM providers already exist, skipping initialization")
                return False
            
            # Create default providers
            for provider_data in DEFAULT_LLM_PROVIDERS:
                await self.storage.create_llm_provider(provider_data)
            
            self.logger.info(f"Initialized {len(DEFAULT_LLM_PROVIDERS)} default LLM providers")
            return True
            
        except Exception as e:
            self.logger.error("Failed to initialize LLM providers", error=str(e))
            return False
    
    async def _initialize_prompts(self) -> bool:
        """Initialize default prompts."""
        try:
            # Check if prompts already exist
            existing_prompts = await self.storage.list_prompts(limit=1)
            if existing_prompts and len(existing_prompts) > 0:
                self.logger.info("Prompts already exist, skipping initialization")
                return False
            
            # Create default prompts
            for prompt_data in DEFAULT_PROMPTS:
                await self.storage.create_prompt(prompt_data)
            
            self.logger.info(f"Initialized {len(DEFAULT_PROMPTS)} default prompts")
            return True
            
        except Exception as e:
            self.logger.error("Failed to initialize prompts", error=str(e))
            return False
    
    async def _initialize_settings(self) -> bool:
        """Initialize default settings."""
        try:
            # Check if settings already exist
            existing_settings = await self.storage.get_settings()
            if existing_settings:
                self.logger.info("Settings already exist, skipping initialization")
                return False
            
            # Create default settings
            await self.storage.update_settings(DEFAULT_SETTINGS)
            
            self.logger.info("Initialized default settings")
            return True
            
        except Exception as e:
            self.logger.error("Failed to initialize settings", error=str(e))
            return False
    
    async def _initialize_pipelines(self) -> bool:
        """Initialize default pipelines."""
        try:
            # Check if pipelines already exist
            existing_pipelines = await self.storage.list_pipelines()
            if existing_pipelines:
                self.logger.info("Pipelines already exist, skipping initialization")
                return False
            
            # Create default pipelines
            for pipeline_data in DEFAULT_PIPELINES:
                await self.storage.create_pipeline(pipeline_data)
            
            self.logger.info(f"Initialized {len(DEFAULT_PIPELINES)} default pipelines")
            return True
            
        except Exception as e:
            self.logger.error("Failed to initialize pipelines", error=str(e))
            return False
    
    async def check_initialization_status(self) -> Dict[str, bool]:
        """Check which default data has been initialized."""
        status = {}
        
        try:
            # Check providers
            providers = await self.storage.list_llm_providers()
            status["providers"] = len(providers) > 0
            
            # Check prompts
            prompts = await self.storage.list_prompts(limit=1)
            status["prompts"] = len(prompts) > 0
            
            # Check settings
            settings = await self.storage.get_settings()
            status["settings"] = settings is not None
            
            # Check pipelines
            pipelines = await self.storage.list_pipelines()
            status["pipelines"] = len(pipelines) > 0
            
        except Exception as e:
            self.logger.error("Failed to check initialization status", error=str(e))
            status = {"error": str(e)}
        
        return status

# Utility function to get sample data for development/testing
def get_sample_data() -> Dict[str, Any]:
    """Get sample data for development and testing purposes."""
    return {
        "providers": DEFAULT_LLM_PROVIDERS,
        "prompts": DEFAULT_PROMPTS,
        "settings": DEFAULT_SETTINGS,
        "pipelines": DEFAULT_PIPELINES
    }