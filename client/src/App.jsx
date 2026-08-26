// App.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState({ players: {}, detonationDial: 0, gameStarted: false });
  const [selectedDeclaredNum, setSelectedDeclaredNum] = useState(1);

  useEffect(() => {
    socket.on("stateUpdate", (state) => {
      setGameState(state);
    });
    return () => socket.off("stateUpdate");
  }, []);

  const handleJoin = () => {
    if (!name) return;
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
      <div style={{ padding: 20 }}>
        <h2>ボムバスターズ風プロトタイプ</h2>
        <input placeholder="名前を入力" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={handleJoin}>参加する</button>
      </div>
    );
  }

  const myHand = gameState.players[socket.id]?.hand || [];

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>爆弾解体ボード</h1>
      <h3>ミス（起爆カウント）: {gameState.detonationDial} / 3</h3>

      {!gameState.gameStarted && (
        <button onClick={() => socket.emit("startGame")}>ゲームを開始する</button>
      )}

      {/* 宣言する数字の選択 */}
      <div style={{ margin: "20px 0" }}>
        <label>宣言する数字: </label>
        <select value={selectedDeclaredNum} onChange={(e) => setSelectedDeclaredNum(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <hr />

      {/* 自分の手札表示 */}
      <h2>自分の手札 (番号順)</h2>
      <div style={{ display: "flex", gap: 10 }}>
        {myHand.map((card, idx) => (
          <div key={idx} style={{ padding: 15, border: "2px solid #333", background: card.isCut ? "#ccc" : "#e0f7fa" }}>
            <div>{card.value}</div>
            <small>{card.isCut ? "解除済" : "裏向き"}</small>
          </div>
        ))}
      </div>

      <hr />

      {/* 他プレイヤーの手札表示 */}
      <h2>他プレイヤーのボード</h2>
      {Object.entries(gameState.players).map(([pId, player]) => {
        if (pId === socket.id) return null;
        return (
          <div key={pId} style={{ marginBottom: 20 }}>
            <h3>{player.name}</h3>
            <div style={{ display: "flex", gap: 10 }}>
              {player.hand.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCut(pId, idx)}
                  disabled={card.isCut}
                  style={{ padding: 15, cursor: card.isCut ? "default" : "pointer" }}
                >
                  {card.isCut ? card.value : `ワイヤー ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}