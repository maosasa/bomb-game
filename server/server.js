// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let gameState = {
  players: {}, // { socketId: { name, hand: [{ id, value, isCut }] } }
  detonationDial: 0,
  maxMistakes: 3,
  gameStarted: false,
};

// 山札を生成して配る関数
function startGame() {
  // 1〜12の数字をランダムに配置（簡易版）
  const deck = Array.from({ length: 24 }, (_, i) => (i % 12) + 1).sort(() => Math.random() - 0.5);
  const playerIds = Object.keys(gameState.players);
  
  if (playerIds.length === 0) return;

  const cardsPerPlayer = Math.floor(deck.length / playerIds.length);

  playerIds.forEach((id, index) => {
    // 手札を引いて、昇順（小さい順）に自動ソート
    const rawHand = deck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer);
    const sortedHand = rawHand.sort((a, b) => a - b).map((val, idx) => ({
      id: `${id}-${idx}`,
      value: val,
      isCut: false,
    }));

    gameState.players[id].hand = sortedHand;
  });

  gameState.detonationDial = 0;
  gameState.gameStarted = true;
  io.emit("stateUpdate", gameState);
}

io.on("connection", (socket) => {
  // プレイヤー参加
  socket.on("joinGame", (name) => {
    gameState.players[socket.id] = { name: name || `Player-${socket.id.slice(0, 4)}`, hand: [] };
    io.emit("stateUpdate", gameState);
  });

  // ゲーム開始コマンド
  socket.on("startGame", () => {
    startGame();
  });

  // ワイヤー切断の宣言 (ターゲットのID, カードのインデックス, 宣言した数字)
  socket.on("declareCut", ({ targetId, cardIndex, declaredNumber }) => {
    if (!gameState.gameStarted) return;

    const targetCard = gameState.players[targetId]?.hand[cardIndex];
    if (!targetCard || targetCard.isCut) return;

    if (targetCard.value === Number(declaredNumber)) {
      // 成功：カードを公開
      targetCard.isCut = true;
    } else {
      // 失敗：爆発カウント増加
      gameState.detonationDial += 1;
    }

    io.emit("stateUpdate", gameState);
  });

  // 接続切断
  socket.on("disconnect", () => {
    delete gameState.players[socket.id];
    if (Object.keys(gameState.players).length === 0) {
      gameState.gameStarted = false;
    }
    io.emit("stateUpdate", gameState);
  });
});

server.listen(4000, () => console.log("Server running on port 4000"));