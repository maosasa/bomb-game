# bomb-game (ボムバスターズ風 Webアプリ)

『ボムバスターズ（Bomb Busters）』風のリアルタイム協力型推理ゲームのプロトタイプです。
WebSocket (Socket.io) を用いて、複数人で手札の解体・指名・状態同期を行えます。

---

## 🚀 特徴 (Features)

1. **リアルタイム同期**: Socket.ioを活用した即時状態更新（手札公開・失敗カウント・ヒント更新）。
2. **自動ソート機能**: ボムバスターズのコア要素である「手札（ワイヤー）の昇順ソート」をサーバー側で自動計算。
3. **情報表示**: 自分の手札は表向き、他人の手札は裏向きで表示。間違えた場合は宣言数字がヒントとしてカード上に記録されます。

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
│   │   ├── App.tsx         # メイン画面コンポーネント
│   │   ├── App.css         # スタイル定義
│   │   └── main.tsx        # エントリーポイント
│   └── package.json
├── server/                 # バックエンド (FastAPI + WebSocket)
│   ├── main.py             # サーバー処理・ゲームロジック
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
3. **ゲーム開始**:
   - 全員の参加が完了したら「ゲームを開始する」を押します。
   - 手札が自動でソートされて配られます（自分には数値が見え、他人からはワイヤー番号だけ見えます）。
4. **ワイヤーの指名 (解体)**:
   - 画面上部で「宣言する数字 (1〜12)」を選択します。
   - 他のプレイヤーのワイヤーボタンをクリックして切断を試みます。
   - **正解**: ワイヤーが解除され、数字が表向きになります。
   - **不正解**: 爆発カウント（起爆ダイヤル）が1進み、そのワイヤーに試した数字が「ヒント」として記録されます。
5. **勝利・敗北条件**:
   - **勝利**: 爆発する前に全ての隠されたワイヤーを解除する。
   - **敗北**: ミスカウントが上限（デフォルト: 3回）に達する。

---

## ⚖️ 免責事項・ライセンス (Disclaimer)

- 本プロジェクトは個人利用・学習・友達との試遊目的で制作されたファンメイドのファンプロトタイプです。
- 製品版『ボムバスターズ (Bomb Busters)』の公式画像、商標、ミッションテキスト等の無断転載・商業利用はお控えください。