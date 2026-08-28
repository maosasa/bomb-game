import asyncio
import json
import random
import uuid
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="bomb-game server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

players: dict[str, dict[str, Any]] = {}
connections: dict[str, WebSocket] = {}
state_lock = asyncio.Lock()
game_state = {"players": players, "detonationDial": 0, "maxMistakes": 3, "gameStarted": False}


async def broadcast() -> None:
    message = json.dumps({"type": "stateUpdate", "state": game_state})
    for connection in list(connections.values()):
        await connection.send_text(message)


async def send_state(connection: WebSocket, player_id: str) -> None:
    await connection.send_text(json.dumps({"type": "stateUpdate", "state": game_state, "playerId": player_id}))


def start_game() -> None:
    deck = list(range(1, 13)) * 2
    random.shuffle(deck)
    player_ids = list(players)
    cards_per_player = len(deck) // len(player_ids)
    for index, player_id in enumerate(player_ids):
        hand = sorted(deck[index * cards_per_player:(index + 1) * cards_per_player])
        players[player_id]["hand"] = [{"id": f"{player_id}-{card_index}", "value": value, "isCut": False} for card_index, value in enumerate(hand)]
    game_state["detonationDial"] = 0
    game_state["gameStarted"] = True


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
                    players[player_id] = {"name": (message.get("name") or f"Player-{player_id[:4]}").strip(), "hand": []}
                elif message_type == "startGame" and players:
                    start_game()
                elif message_type == "declareCut" and game_state["gameStarted"]:
                    target_id = message.get("targetId")
                    card_index = message.get("cardIndex")
                    target_card = players.get(target_id, {}).get("hand", [])[card_index] if isinstance(card_index, int) and card_index >= 0 and card_index < len(players.get(target_id, {}).get("hand", [])) else None
                    if target_card and not target_card["isCut"]:
                        if target_card["value"] == int(message.get("declaredNumber", 0)):
                            target_card["isCut"] = True
                        else:
                            game_state["detonationDial"] += 1
                else:
                    continue
                await broadcast()
    except (WebSocketDisconnect, json.JSONDecodeError, ValueError, TypeError):
        connections.pop(player_id, None)
        async with state_lock:
            players.pop(player_id, None)
            if not players:
                game_state["gameStarted"] = False
            await broadcast()