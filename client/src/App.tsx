import { useEffect, useRef, useState } from "react";
import "./App.css";

type Card = { id: string; value: number; isCut: boolean };
type Player = { name: string; hand: Card[] };
type GameState = { players: Record<string, Player>; detonationDial: number; maxMistakes: number; gameStarted: boolean };
type StateMessage = { type: "stateUpdate"; state: GameState; playerId?: string };
const websocketUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000/ws`;

export default function App() {
  const socket = useRef<WebSocket | null>(null);
  const pendingMessages = useRef<string[]>([]);
  const [name, setName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    detonationDial: 0,
    maxMistakes: 3,
    gameStarted: false,
  });
  const [selectedDeclaredNum, setSelectedDeclaredNum] = useState(1);

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

  const handleCut = (targetId, cardIndex) => {
    send("declareCut", {
      targetId,
      cardIndex,
      declaredNumber: selectedDeclaredNum,
    });
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

  const myHand = gameState.players[playerId]?.hand || [];
  const allCards = Object.values(gameState.players).flatMap((player) => player.hand);
  const numberStatuses = Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    const cards = allCards.filter((card) => card.value === number);

    return {
      number,
      isComplete: cards.length > 0 && cards.every((card) => card.isCut),
    };
  });

  return (
    <div className="container">
      <header>
        <h1>💣 bomb-game</h1>
        <div className="status-bar">
          <div>起爆カウント: <strong>{gameState.detonationDial} / {gameState.maxMistakes}</strong></div>
        </div>
      </header>

      <section className="number-board" aria-label="解除番号一覧">
        <div className="number-board-heading">
          <h2>解除番号</h2>
          <span>1 - 12</span>
        </div>
        <div className="number-list">
          {numberStatuses.map(({ number, isComplete }) => (
            <div
              key={number}
              className={`number-tile ${isComplete ? "complete" : ""}`}
              aria-label={`${number} ${isComplete ? "解除済み" : "未解除"}`}
            >
              <span className="number-value">{number}</span>
              <span className="number-mark" aria-hidden="true">{isComplete ? "✓" : ""}</span>
            </div>
          ))}
        </div>
      </section>

      {!gameState.gameStarted && (
        <div className="start-banner">
          <p>参加者: {Object.values(gameState.players).map((p) => p.name).join(", ")}</p>
          <button onClick={() => socket.emit("startGame")}>全員揃ったのでゲーム開始</button>
        </div>
      )}

      {/* 宣言する数字の選択パネル */}
      <div className="control-panel">
        <label>宣言する数字を選択: </label>
        <select
          value={selectedDeclaredNum}
          onChange={(e) => setSelectedDeclaredNum(e.target.value)}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <main className="game-board">
        {/* 自分の手札（自分には値が見える） */}
        <section className="hand-section">
          <h2>自分のワイヤー (小 ➔ 大)</h2>
          <div className="card-list">
            {myHand.map((card, idx) => (
              <div key={idx} className={`card ${card.isCut ? "cut" : "my-card"}`}>
                <span className="card-value">{card.value}</span>
                <span className="card-status">{card.isCut ? "解除済" : "裏向き"}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 他プレイヤーのボード */}
        <section className="hand-section">
          <h2>仲間たちのワイヤー (狙って解除)</h2>
          {Object.entries(gameState.players).map(([pId, player]) => {
            if (pId === socket.id) return null;
            return (
              <div key={pId} className="player-row">
                <h3>{player.name}</h3>
                <div className="card-list">
                  {player.hand.map((card, idx) => (
                    <button
                      key={idx}
                      className={`card opponent-card ${card.isCut ? "cut" : ""}`}
                      onClick={() => handleCut(pId, idx)}
                      disabled={card.isCut || !gameState.gameStarted}
                    >
                      {card.isCut ? (
                        <span className="card-value">{card.value}</span>
                      ) : (
                        <span>ワイヤー {idx + 1}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}