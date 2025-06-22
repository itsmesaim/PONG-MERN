# 🎾 Multiplayer Pong (MERN + Vite)

A real-time, cross-continent Pong game built with a Node/Express + Socket.IO backend and a Vite/React frontend.  
Play against a simple AI, or versus a friend by sharing a Room ID. Mobile-friendly with touch controls.

---

## 🚀 Features

- **Play vs. AI** with a 3-second countdown, dynamic ball physics, and first-to-10 point limit.  
- **Play vs. Friend** over the Internet (or LAN) via Socket.IO:  
  1. Create or join a Room ID  
  2. Both players click **Ready**  
  3. 3→2→1 countdown → start  
- **Mobile support** (mouse + touch).  
- **Minimal, zero-login** experience—just enter your name in the lobby.  
- **Sleek UI** built with React & CSS, bundled by Vite.

---

## 📦 Repository Structure

```
pong-mern/
├── pong-server/          ← Node.js + Socket.IO backend
│   ├── package.json
│   └── server.js
└── pong-client/          ← Vite + React frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx
        └── components/
            ├── Lobby.jsx
            └── Game.jsx
```

---

## 🔧 Prerequisites

- **Node.js** (v16+ recommended) & **npm**  

---

## 🏁 Getting Started (Development)

Clone the repo:
```bash
git clone https://github.com/itsmesaim/PONG-MERN.git
cd PONG-MERN
```

### 1. Run the Server

```bash
cd pong-server
npm install
npm start
```
Your Socket.IO server will listen on **http://localhost:4000**.

### 2. Run the Client

```bash
cd ../pong-client
npm install --legacy-peer-deps
npm run dev
```
Open **http://localhost:3000** in your browser (or on mobile).

---


## 💻 Usage

1. Open the lobby URL in two browsers (or devices).  
2. **Enter your name**.  
3. Click **Play vs. AI** or **Create Room** (share the generated Room ID).  
4. On the second device, **Enter Room ID** and click **Join Room**.  
5. Both click **Ready**, watch the 3-2-1 countdown, and play!

---

## 🤝 Contributing

1. Fork the repo  
2. Create a feature branch (`git checkout -b feature/foo`)  
3. Commit your changes (`git commit -am 'Add foo'`)  
4. Push to branch (`git push origin feature/foo`)  
5. Open a Pull Request

---


Enjoy your cross-continent Pong! 🎉