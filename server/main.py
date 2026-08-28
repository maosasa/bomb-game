import asyncio
import json
import uuid
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="bomb-game server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

players: dict[str, dict[str, Any]] = {}
connections: dict[str, WebSocket] = {}
state_lock = asyncio.Lock()
game_state = {"players": players}


async def broadcast() -> None:
    message = json.dumps({"type": "stateUpdate", "state": game_state})
    for connection in list(connections.values()):
        await connection.send_text(message)


async def send_state(connection: WebSocket, player_id: str) -> None:
    await connection.send_text(json.dumps({"type": "stateUpdate", "state": game_state, "playerId": player_id}))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    player_id = str(uuid.uuid4())
    connections[player_id] = websocket
    await send_state(websocket, player_id)
    try:
        while True:
            message = json.loads(await websocket.receive_text())
            message_type = message.get("type")
            async with state_lock:
                if message_type == "joinGame":
                    players[player_id] = {
                        "name": (message.get("name") or f"Player-{player_id[:4]}").strip(),
                        "hand": [
                            {"id": f"{player_id}-{card_index}", "value": card_index + 1}
                            for card_index in range(6)
                        ],
                    }
                else:
                    continue
                await broadcast()
    except (WebSocketDisconnect, json.JSONDecodeError, ValueError, TypeError):
        connections.pop(player_id, None)
        async with state_lock:
            players.pop(player_id, None)
            await broadcast()