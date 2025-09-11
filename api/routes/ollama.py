from fastapi import APIRouter, HTTPException, Body
try:
    from api.ollama_client import (
        list_ollama_models,
        pull_ollama_model,
        generate_with_ollama,
        list_running_ollama_models,
        chat_with_ollama,
    )
except ImportError:
    # Fallback for relative imports
    from ..ollama_client import (
        list_ollama_models,
        pull_ollama_model,
        generate_with_ollama,
        list_running_ollama_models,
        chat_with_ollama,
    )

router = APIRouter(prefix="/api/v1/ollama", tags=["Ollama"])

@router.get("/models")
def get_ollama_models():
    try:
        return {"models": list_ollama_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pull/{model_name}")
def pull_model(model_name: str):
    try:
        return pull_ollama_model(model_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/running")
def get_running_models():
    try:
        return {"models": list_running_ollama_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
def generate(model: str = Body(...), prompt: str = Body(...), options: dict = Body(None)):
    try:
        return generate_with_ollama(model, prompt, options)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
def chat(model: str = Body(...), messages: list = Body(...), options: dict = Body(None)):
    try:
        return chat_with_ollama(model, messages, options)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
