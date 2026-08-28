# bomb-game (プレイヤーと手札を表示するWebアプリ)

複数人の接続状態と、各プレイヤーに割り当てられた手札を表示するシンプルなリアルタイムWebアプリです。
ブラウザ標準のWebSocketを用いて、プレイヤー一覧と手札を全クライアントへ同期します。

---

## 🚀 特徴 (Features)

1. **プレイヤー接続**: 名前を入力するとプレイヤー一覧に追加されます。
2. **手札の表示**: 参加時に6枚の手札が割り当てられ、全プレイヤーの画面に表示されます。
3. **リアルタイム同期**: プレイヤーの参加・切断が接続中のクライアントへ反映されます。

---

## 🛠️ 技術スタック (Tech Stack)

- **Frontend**: React, TypeScript, Vite
- **Backend**: Python, FastAPI
- **Communication**: WebSocket
- **Development**: Docker / Docker Compose

---

## 📦 ディレクトリ構造 (Directory Structure)

```text
bomb-game/
├── client/                 # フロントエンド (React)
│   ├── src/
│   │   ├── App.tsx         # 接続処理とプレイヤー・手札表示
│   │   ├── App.css         # スタイル定義
│   │   └── main.tsx        # エントリーポイント
│   └── package.json
├── server/                 # バックエンド (FastAPI + WebSocket)
│   ├── main.py             # 接続処理と手札の管理
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

---

## 🔧 セットアップと起動手順 (Getting Started)

### 前提条件
- Docker / Docker Compose

---

### Docker Composeで起動

```bash
# プロジェクトルートで実行
docker compose up --build
```
* フロントエンド: `http://localhost:5173`
* WebSocket: `ws://localhost:8000/ws`

---

### 個別に起動する場合

新しいターミナルを開いて実行します。

```bash
# バックエンド
python -m venv .venv && source .venv/bin/activate
pip install -r server/requirements.txt
uvicorn main:app --app-dir server --reload --port 8000

# 別ターミナルでフロントエンド
cd client && npm install && npm run dev
```
ブラウザで `http://localhost:5173` にアクセスします。

---

## 🎮 遊び方 (How to Play)

1. **友達を招待する**:
   - 複数のブラウザータブやシークレットウィンドウ、あるいは同じLAN内のデバイスからアクセスします。
2. **ゲーム参加**:
   - 名前を入力して「参加」ボタンを押します。
3. **手札を確認する**:
   - 接続中の全プレイヤーと、それぞれの6枚の手札が表示されます。
   - プレイヤーが切断すると、そのプレイヤーが一覧から消えます。

---

## ⚖️ 免責事項・ライセンス (Disclaimer)

- 本プロジェクトは個人利用・学習・友達との試遊目的で制作されたファンメイドのファンプロトタイプです。
- 製品版『ボムバスターズ (Bomb Busters)』の公式画像、商標、ミッションテキスト等の無断転載・商業利用はお控えください。