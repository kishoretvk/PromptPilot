# WebSocket Manager for Real-time Features
# Handles WebSocket connections, broadcasting, and real-time updates

import asyncio
import json
import uuid
from typing import Dict, List, Set, Optional, Any, Callable
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
import structlog

logger = structlog.get_logger()

class ConnectionManager:
    """Manages WebSocket connections and broadcasting."""
    
    def __init__(self):
        # Active connections by connection ID
        self.active_connections: Dict[str, WebSocket] = {}
        
        # User ID to connection mapping
        self.user_connections: Dict[str, Set[str]] = {}
        
        # Room-based connections (for pipeline execution monitoring)
        self.room_connections: Dict[str, Set[str]] = {}
        
        # Connection metadata
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
        
        self.logger = structlog.get_logger()
    
    async def connect(self, websocket: WebSocket, user_id: str = None, room: str = None) -> str:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        # Generate unique connection ID
        connection_id = str(uuid.uuid4())
        
        # Store connection
        self.active_connections[connection_id] = websocket
        
        # Store metadata
        self.connection_metadata[connection_id] = {
            "user_id": user_id,
            "room": room,
            "connected_at": datetime.now(timezone.utc),
            "last_ping": datetime.now(timezone.utc)
        }
        
        # Add to user connections
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(connection_id)
        
        # Add to room connections
        if room:
            if room not in self.room_connections:
                self.room_connections[room] = set()
            self.room_connections[room].add(connection_id)
        
        self.logger.info(
            "WebSocket connection established",
            connection_id=connection_id,
            user_id=user_id,
            room=room,
            total_connections=len(self.active_connections)
        )
        
        # Send connection confirmation
        await self.send_to_connection(connection_id, {
            "type": "connection_established",
            "connection_id": connection_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return connection_id
    
    def disconnect(self, connection_id: str):
        """Remove a WebSocket connection."""
        if connection_id not in self.active_connections:
            return
        
        metadata = self.connection_metadata.get(connection_id, {})
        user_id = metadata.get("user_id")
        room = metadata.get("room")
        
        # Remove from active connections
        del self.active_connections[connection_id]
        del self.connection_metadata[connection_id]
        
        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from room connections
        if room and room in self.room_connections:
            self.room_connections[room].discard(connection_id)
            if not self.room_connections[room]:
                del self.room_connections[room]
        
        self.logger.info(
            "WebSocket connection closed",
            connection_id=connection_id,
            user_id=user_id,
            room=room,
            total_connections=len(self.active_connections)
        )
    
    async def send_to_connection(self, connection_id: str, message: Dict[str, Any]):
        """Send message to a specific connection."""
        if connection_id not in self.active_connections:
            return False
        
        try:
            websocket = self.active_connections[connection_id]
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_text(json.dumps(message, default=str))
                return True
        except Exception as e:
            self.logger.error(
                "Failed to send message to connection",
                connection_id=connection_id,
                error=str(e)
            )
            # Remove broken connection
            self.disconnect(connection_id)
        
        return False
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all connections for a user."""
        if user_id not in self.user_connections:
            return 0
        
        sent_count = 0
        connection_ids = list(self.user_connections[user_id])
        
        for connection_id in connection_ids:
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    async def send_to_room(self, room: str, message: Dict[str, Any], exclude_connection: str = None):
        """Send message to all connections in a room."""
        if room not in self.room_connections:
            return 0
        
        sent_count = 0
        connection_ids = list(self.room_connections[room])
        
        for connection_id in connection_ids:
            if connection_id != exclude_connection:
                if await self.send_to_connection(connection_id, message):
                    sent_count += 1
        
        return sent_count
    
    async def broadcast(self, message: Dict[str, Any], exclude_connection: str = None):
        """Broadcast message to all active connections."""
        sent_count = 0
        connection_ids = list(self.active_connections.keys())
        
        for connection_id in connection_ids:
            if connection_id != exclude_connection:
                if await self.send_to_connection(connection_id, message):
                    sent_count += 1
        
        return sent_count
    
    async def handle_message(self, connection_id: str, message: Dict[str, Any]):
        """Handle incoming WebSocket message."""
        message_type = message.get("type")
        
        if message_type == "ping":
            await self.handle_ping(connection_id)
        elif message_type == "join_room":
            await self.handle_join_room(connection_id, message.get("room"))
        elif message_type == "leave_room":
            await self.handle_leave_room(connection_id, message.get("room"))
        elif message_type == "pipeline_subscribe":
            await self.handle_pipeline_subscribe(connection_id, message.get("pipeline_id"))
        else:
            self.logger.warning(
                "Unknown WebSocket message type",
                connection_id=connection_id,
                message_type=message_type
            )
    
    async def handle_ping(self, connection_id: str):
        """Handle ping message and respond with pong."""
        if connection_id in self.connection_metadata:
            self.connection_metadata[connection_id]["last_ping"] = datetime.now(timezone.utc)
        
        await self.send_to_connection(connection_id, {
            "type": "pong",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    async def handle_join_room(self, connection_id: str, room: str):
        """Handle room join request."""
        if not room:
            return
        
        if room not in self.room_connections:
            self.room_connections[room] = set()
        
        self.room_connections[room].add(connection_id)
        
        # Update metadata
        if connection_id in self.connection_metadata:
            self.connection_metadata[connection_id]["room"] = room
        
        await self.send_to_connection(connection_id, {
            "type": "room_joined",
            "room": room,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        self.logger.info(
            "Connection joined room",
            connection_id=connection_id,
            room=room
        )
    
    async def handle_leave_room(self, connection_id: str, room: str):
        """Handle room leave request."""
        if room in self.room_connections:
            self.room_connections[room].discard(connection_id)
            if not self.room_connections[room]:
                del self.room_connections[room]
        
        # Update metadata
        if connection_id in self.connection_metadata:
            self.connection_metadata[connection_id]["room"] = None
        
        await self.send_to_connection(connection_id, {
            "type": "room_left",
            "room": room,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        self.logger.info(
            "Connection left room",
            connection_id=connection_id,
            room=room
        )
    
    async def handle_pipeline_subscribe(self, connection_id: str, pipeline_id: str):
        """Handle pipeline execution subscription."""
        if not pipeline_id:
            return
        
        room = f"pipeline_{pipeline_id}"
        await self.handle_join_room(connection_id, room)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics."""
        return {
            "total_connections": len(self.active_connections),
            "user_connections": len(self.user_connections),
            "rooms": len(self.room_connections),
            "room_details": {
                room: len(connections) 
                for room, connections in self.room_connections.items()
            }
        }
    
    async def cleanup_stale_connections(self):
        """Remove stale connections (no ping in last 60 seconds)."""
        current_time = datetime.now(timezone.utc)
        stale_connections = []
        
        for connection_id, metadata in self.connection_metadata.items():
            last_ping = metadata.get("last_ping", metadata.get("connected_at"))
            if (current_time - last_ping).total_seconds() > 60:
                stale_connections.append(connection_id)
        
        for connection_id in stale_connections:
            self.disconnect(connection_id)
        
        if stale_connections:
            self.logger.info(f"Cleaned up {len(stale_connections)} stale connections")

# Global connection manager instance
connection_manager = ConnectionManager()

class PipelineExecutionBroadcaster:
    """Handles real-time pipeline execution updates."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.logger = structlog.get_logger()
    
    async def pipeline_started(self, pipeline_id: str, execution_id: str, user_id: str):
        """Broadcast pipeline execution start."""
        message = {
            "type": "pipeline_started",
            "pipeline_id": pipeline_id,
            "execution_id": execution_id,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        room = f"pipeline_{pipeline_id}"
        await self.connection_manager.send_to_room(room, message)
        await self.connection_manager.send_to_user(user_id, message)
        
        self.logger.info(
            "Pipeline execution started broadcast",
            pipeline_id=pipeline_id,
            execution_id=execution_id
        )
    
    async def step_started(self, pipeline_id: str, execution_id: str, 
                          step_id: str, step_name: str):
        """Broadcast step execution start."""
        message = {
            "type": "step_started",
            "pipeline_id": pipeline_id,
            "execution_id": execution_id,
            "step_id": step_id,
            "step_name": step_name,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        room = f"pipeline_{pipeline_id}"
        await self.connection_manager.send_to_room(room, message)
    
    async def step_completed(self, pipeline_id: str, execution_id: str,
                           step_id: str, step_name: str, result: Dict[str, Any]):
        """Broadcast step execution completion."""
        message = {
            "type": "step_completed",
            "pipeline_id": pipeline_id,
            "execution_id": execution_id,
            "step_id": step_id,
            "step_name": step_name,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        room = f"pipeline_{pipeline_id}"
        await self.connection_manager.send_to_room(room, message)
    
    async def step_failed(self, pipeline_id: str, execution_id: str,
                         step_id: str, step_name: str, error: str):
        """Broadcast step execution failure."""
        message = {
            "type": "step_failed",
            "pipeline_id": pipeline_id,
            "execution_id": execution_id,
            "step_id": step_id,
            "step_name": step_name,
            "error": error,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        room = f"pipeline_{pipeline_id}"
        await self.connection_manager.send_to_room(room, message)
    
    async def pipeline_completed(self, pipeline_id: str, execution_id: str,
                               status: str, result: Dict[str, Any]):
        """Broadcast pipeline execution completion."""
        message = {
            "type": "pipeline_completed",
            "pipeline_id": pipeline_id,
            "execution_id": execution_id,
            "status": status,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        room = f"pipeline_{pipeline_id}"
        await self.connection_manager.send_to_room(room, message)
        
        self.logger.info(
            "Pipeline execution completed broadcast",
            pipeline_id=pipeline_id,
            execution_id=execution_id,
            status=status
        )
    
    async def progress_update(self, pipeline_id: str, execution_id: str,
                            current_step: int, total_steps: int, 
                            progress_percentage: float):
        """Broadcast progress update."""
        message = {
            "type": "progress_update",
            "pipeline_id": pipeline_id,
            "execution_id": execution_id,
            "current_step": current_step,
            "total_steps": total_steps,
            "progress_percentage": progress_percentage,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        room = f"pipeline_{pipeline_id}"
        await self.connection_manager.send_to_room(room, message)

class SystemNotificationBroadcaster:
    """Handles real-time system notifications."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.logger = structlog.get_logger()
    
    async def user_notification(self, user_id: str, notification_type: str, 
                              title: str, message: str, data: Dict[str, Any] = None):
        """Send notification to a specific user."""
        notification = {
            "type": "notification",
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "data": data or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.send_to_user(user_id, notification)
        
        self.logger.info(
            "User notification sent",
            user_id=user_id,
            notification_type=notification_type,
            title=title
        )
    
    async def system_announcement(self, message: str, severity: str = "info"):
        """Broadcast system-wide announcement."""
        announcement = {
            "type": "system_announcement",
            "message": message,
            "severity": severity,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.broadcast(announcement)
        
        self.logger.info(
            "System announcement broadcast",
            message=message,
            severity=severity
        )
    
    async def maintenance_notification(self, start_time: datetime, 
                                     duration_minutes: int, message: str):
        """Broadcast maintenance notification."""
        notification = {
            "type": "maintenance_notification",
            "start_time": start_time.isoformat(),
            "duration_minutes": duration_minutes,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.broadcast(notification)
        
        self.logger.info(
            "Maintenance notification broadcast",
            start_time=start_time,
            duration_minutes=duration_minutes
        )

# Global broadcaster instances
pipeline_broadcaster = PipelineExecutionBroadcaster(connection_manager)
notification_broadcaster = SystemNotificationBroadcaster(connection_manager)

# Periodic cleanup task
async def cleanup_task():
    """Periodic task to clean up stale connections."""
    while True:
        await asyncio.sleep(60)  # Run every minute
        await connection_manager.cleanup_stale_connections()