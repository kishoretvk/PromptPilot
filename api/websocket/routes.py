from fastapi import WebSocket

from api.main import app

@app.websocket("/ws/progress")
async def progress_ws(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"status": "analyzing"})
