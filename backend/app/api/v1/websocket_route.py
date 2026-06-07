"""
WebSocket Endpoints
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.realtime.ws_manager import ws_manager

router = APIRouter()

@router.websocket("/{route_id}")
async def websocket_route_endpoint(websocket: WebSocket, route_id: str):
    await ws_manager.connect(websocket, route_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, route_id)
