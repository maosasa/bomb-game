import { useEffect, useRef, useState } from "react";
import "./App.css";

type Card = { id: string; value: number };
type Player = { name: string; hand: Card[] };
type GameState = { players: Record<string, Player> };
type StateMessage = { type: "stateUpdate"; state: GameState; playerId?: string };
const websocketUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000/ws`;

export default function App() {
  const socket = useRef<WebSocket | null>(null);
  const pendingMessages = useRef<string[]>([]);
  const [name, setName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState<GameState>({ players: {} });

  useEffect(() => {
    const connection = new WebSocket(websocketUrl);
    socket.current = connection;
    connection.onopen = () => {
      pendingMessages.current.forEach((message) => connection.send(message));
      pendingMessages.current = [];
    };
    connection.onmessage = (event) => {
      const message = JSON.parse(event.data) as StateMessage;
      if (message.type === "stateUpdate") {
        setGameState(message.state);
        if (message.playerId) setPlayerId(message.playerId);
      }
    };
    return () => connection.close();
  }, []);

  const send = (type: string, payload: Record<string, unknown> = {}) => {
    const message = JSON.stringify({ type, ...payload });
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(message);
    else pendingMessages.current.push(message);
  };

  const handleJoin = () => {
    if (!name.trim()) return;
    send("joinGame", { name: name.trim() });
    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="container center">
        <h1>💣 bomb-game</h1>
        <div className="join-box">
          <input
            type="text"
            placeholder="プレイヤー名を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={handleJoin}>ゲームに参加</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>bomb-game</h1>
        <p>接続中のプレイヤー: {Object.keys(gameState.players).length}人</p>
      </header>

      <main className="game-board">
        <section className="hand-section">
          <h2>プレイヤーの手札</h2>
          {Object.entries(gameState.players).map(([id, player]) => (
            <div key={id} className="player-row">
              <h3>{player.name}{id === playerId ? "（自分）" : ""}</h3>
              <div className="card-list">
                {player.hand.map((card) => (
                  <div key={card.id} className="card my-card">
                    <span className="card-value">{card.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}