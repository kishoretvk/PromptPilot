from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from prompt.core import Prompt
from prompt.storage.file_backend import FileStorage

app = FastAPI()
storage = FileStorage()

class PromptIn(BaseModel):
    id: str
    name: str
    description: str
    task_type: str
    tags: List[str]
    model_provider: str
    model_name: str

@app.post("/prompts/", response_model=Dict[str, Any])
def create_prompt(prompt: PromptIn):
    p = Prompt(
        id=prompt.id,
        name=prompt.name,
        description=prompt.description,
        task_type=prompt.task_type,
        tags=prompt.tags,
        developer_notes=None,
        version_info=None,
        messages=[],
        input_variables={},
        final_prompt_structure=None,
        model_provider=prompt.model_provider,
        model_name=prompt.model_name,
        parameters={},
    )
    storage.save_prompt(p)
    return {"message": f"Prompt '{prompt.id}' created."}

@app.get("/prompts/", response_model=List[str])
def list_prompts():
    return storage.list_prompts()

@app.delete("/prompts/{prompt_id}", response_model=Dict[str, Any])
def delete_prompt(prompt_id: str):
    storage.delete_prompt(prompt_id)
    return {"message": f"Prompt '{prompt_id}' deleted."}
