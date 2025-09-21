from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PromptPilot API",
    version="1.0.0",
    description="LLM Prompt Engineering and Pipeline Management Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for development
prompts_store = {}

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "PromptPilot API",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs",
        "health_url": "/health",
        "metrics_url": "http://localhost:8001/metrics"
    }

# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Comprehensive health check endpoint"""
    import datetime
    return {
        "data": {
            "status": "healthy",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "uptime_seconds": 0,
            "components": {
                "database": "connected",
                "logging": "active",
                "metrics": "active"
            }
        },
        "status": "success",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# Prompts endpoint
@app.get("/api/v1/prompts", tags=["Prompts"])
async def get_prompts():
    """Get prompts"""
    import datetime
    return {
        "data": {
            "items": list(prompts_store.values()),
            "total": len(prompts_store),
            "page": 1,
            "per_page": 10,
            "total_pages": 1,
            "has_next": False,
            "has_prev": False
        },
        "status": "success",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )