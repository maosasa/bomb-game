import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

// バックエンドのサーバーアドレスに接続
const socket = io("http://localhost:4000");

export default function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState({
    players: {},
    detonationDial: 0,
    maxMistakes: 3,
    gameStarted: false,
  });
  const [selectedDeclaredNum, setSelectedDeclaredNum] = useState(1);

  useEffect(() => {
    // サーバーからの状態更新を受信
    socket.on("stateUpdate", (state) => {
      setGameState(state);
    });

    return () => socket.off("stateUpdate");
  }, []);

  const handleJoin = () => {
    if (!name.trim()) return;
    socket.emit("joinGame", name);
    setJoined(true);
  };

  const handleCut = (targetId, cardIndex) => {
    socket.emit("declareCut", {
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

  const myHand = gameState.players[socket.id]?.hand || [];

  return (
    <div className="container">
      <header>
        <h1>💣 bomb-game</h1>
        <div className="status-bar">
          <div>起爆カウント: <strong>{gameState.detonationDial} / {gameState.maxMistakes}</strong></div>
        </div>
      </header>

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