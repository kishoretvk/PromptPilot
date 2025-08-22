# WebSocket Routes and Endpoints
# FastAPI WebSocket routes for real-time features

import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.security import HTTPBearer
import structlog

from .manager import connection_manager, pipeline_broadcaster, notification_broadcaster
from ..security.auth import verify_websocket_token, get_current_user_websocket

logger = structlog.get_logger()
security = HTTPBearer()

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    room: Optional[str] = Query(None)
):
    """Main WebSocket endpoint for real-time connections."""
    
    # Verify authentication if token provided
    user_id = None
    if token:
        try:
            user_data = await verify_websocket_token(token)
            user_id = user_data.get("user_id") if user_data else None
        except Exception as e:
            logger.warning("WebSocket authentication failed", error=str(e))
            await websocket.close(code=4001, reason="Authentication failed")
            return
    
    # Establish connection
    connection_id = await connection_manager.connect(websocket, user_id, room)
    
    try:
        while True:
            # Receive message from client
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle the message
                await connection_manager.handle_message(connection_id, message)
                
            except json.JSONDecodeError:
                await connection_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                logger.error(
                    "Error handling WebSocket message",
                    connection_id=connection_id,
                    error=str(e)
                )
                await connection_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "message": "Internal server error"
                })
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected", connection_id=connection_id)
    except Exception as e:
        logger.error("WebSocket error", connection_id=connection_id, error=str(e))
    finally:
        connection_manager.disconnect(connection_id)

@router.websocket("/pipeline/{pipeline_id}")
async def pipeline_websocket(
    websocket: WebSocket,
    pipeline_id: str,
    token: Optional[str] = Query(None)
):
    """WebSocket endpoint for pipeline execution monitoring."""
    
    # Verify authentication
    user_id = None
    if token:
        try:
            user_data = await verify_websocket_token(token)
            user_id = user_data.get("user_id") if user_data else None
        except Exception as e:
            logger.warning("Pipeline WebSocket authentication failed", error=str(e))
            await websocket.close(code=4001, reason="Authentication failed")
            return
    
    # Connect to pipeline room
    room = f"pipeline_{pipeline_id}"
    connection_id = await connection_manager.connect(websocket, user_id, room)
    
    try:
        # Send initial pipeline status
        await connection_manager.send_to_connection(connection_id, {
            "type": "pipeline_subscribed",
            "pipeline_id": pipeline_id,
            "message": f"Subscribed to pipeline {pipeline_id} updates"
        })
        
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle pipeline-specific messages
                await handle_pipeline_message(connection_id, pipeline_id, message)
                
            except json.JSONDecodeError:
                await connection_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                logger.error(
                    "Error handling pipeline WebSocket message",
                    connection_id=connection_id,
                    pipeline_id=pipeline_id,
                    error=str(e)
                )
    
    except WebSocketDisconnect:
        logger.info("Pipeline WebSocket disconnected", 
                   connection_id=connection_id, pipeline_id=pipeline_id)
    except Exception as e:
        logger.error("Pipeline WebSocket error", 
                    connection_id=connection_id, pipeline_id=pipeline_id, error=str(e))
    finally:
        connection_manager.disconnect(connection_id)

async def handle_pipeline_message(connection_id: str, pipeline_id: str, message: dict):
    """Handle pipeline-specific WebSocket messages."""
    message_type = message.get("type")
    
    if message_type == "get_status":
        # TODO: Get current pipeline execution status
        await connection_manager.send_to_connection(connection_id, {
            "type": "pipeline_status",
            "pipeline_id": pipeline_id,
            "status": "idle",  # This would come from actual pipeline status
            "message": "Pipeline is idle"
        })
    
    elif message_type == "cancel_execution":
        execution_id = message.get("execution_id")
        if execution_id:
            # TODO: Cancel pipeline execution
            await connection_manager.send_to_connection(connection_id, {
                "type": "execution_cancelled",
                "pipeline_id": pipeline_id,
                "execution_id": execution_id,
                "message": "Execution cancellation requested"
            })
    
    else:
        await connection_manager.handle_message(connection_id, message)

# HTTP endpoints for WebSocket management
@router.get("/stats")
async def get_connection_stats():
    """Get WebSocket connection statistics."""
    return connection_manager.get_connection_stats()

@router.post("/broadcast/system")
async def broadcast_system_message(
    message: str,
    severity: str = "info",
    current_user = Depends(get_current_user_websocket)
):
    """Broadcast system message to all connections (admin only)."""
    
    # Check if user is admin
    if current_user.get("role") != "ADMIN":
        return {"error": "Admin access required"}
    
    await notification_broadcaster.system_announcement(message, severity)
    
    return {
        "message": "System message broadcast successfully",
        "recipients": len(connection_manager.active_connections)
    }

@router.post("/notify/user/{user_id}")
async def send_user_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    data: dict = None,
    current_user = Depends(get_current_user_websocket)
):
    """Send notification to a specific user."""
    
    await notification_broadcaster.user_notification(
        user_id, notification_type, title, message, data
    )
    
    user_connections = connection_manager.user_connections.get(user_id, set())
    
    return {
        "message": "Notification sent successfully",
        "user_id": user_id,
        "active_connections": len(user_connections)
    }

@router.post("/room/{room}/message")
async def send_room_message(
    room: str,
    message: dict,
    current_user = Depends(get_current_user_websocket)
):
    """Send message to all connections in a room."""
    
    sent_count = await connection_manager.send_to_room(room, message)
    
    return {
        "message": "Room message sent successfully",
        "room": room,
        "recipients": sent_count
    }

# WebSocket event handlers for integration with other services
class WebSocketEventHandler:
    """Event handler for integrating WebSocket with other services."""
    
    @staticmethod
    async def on_pipeline_execution_started(pipeline_id: str, execution_id: str, user_id: str):
        """Handle pipeline execution start event."""
        await pipeline_broadcaster.pipeline_started(pipeline_id, execution_id, user_id)
    
    @staticmethod
    async def on_pipeline_step_started(pipeline_id: str, execution_id: str, 
                                     step_id: str, step_name: str):
        """Handle pipeline step start event."""
        await pipeline_broadcaster.step_started(pipeline_id, execution_id, step_id, step_name)
    
    @staticmethod
    async def on_pipeline_step_completed(pipeline_id: str, execution_id: str,
                                       step_id: str, step_name: str, result: dict):
        """Handle pipeline step completion event."""
        await pipeline_broadcaster.step_completed(pipeline_id, execution_id, 
                                                 step_id, step_name, result)
    
    @staticmethod
    async def on_pipeline_step_failed(pipeline_id: str, execution_id: str,
                                    step_id: str, step_name: str, error: str):
        """Handle pipeline step failure event."""
        await pipeline_broadcaster.step_failed(pipeline_id, execution_id, 
                                             step_id, step_name, error)
    
    @staticmethod
    async def on_pipeline_execution_completed(pipeline_id: str, execution_id: str,
                                            status: str, result: dict):
        """Handle pipeline execution completion event."""
        await pipeline_broadcaster.pipeline_completed(pipeline_id, execution_id, status, result)
    
    @staticmethod
    async def on_progress_update(pipeline_id: str, execution_id: str,
                               current_step: int, total_steps: int, progress_percentage: float):
        """Handle progress update event."""
        await pipeline_broadcaster.progress_update(pipeline_id, execution_id,
                                                  current_step, total_steps, progress_percentage)
    
    @staticmethod
    async def on_user_notification(user_id: str, notification_type: str, 
                                 title: str, message: str, data: dict = None):
        """Handle user notification event."""
        await notification_broadcaster.user_notification(user_id, notification_type, 
                                                        title, message, data)

# Global event handler instance
websocket_events = WebSocketEventHandler()