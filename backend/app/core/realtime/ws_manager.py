"""
WebSocket Manager
"""
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, route_id: str):
        await websocket.accept()
        if route_id not in self.active_connections:
            self.active_connections[route_id] = []
        self.active_connections[route_id].append(websocket)

    def disconnect(self, websocket: WebSocket, route_id: str):
        if route_id in self.active_connections:
            self.active_connections[route_id].remove(websocket)

    async def broadcast_update(self, route_id: str, message: dict):
        if route_id in self.active_connections:
            for connection in self.active_connections[route_id]:
                await connection.send_json(message)

ws_manager = ConnectionManager()
