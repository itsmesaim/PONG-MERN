// pong-server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const games = {};

// Centers the ball and gives it a random velocity
function serveBall(g) {
  g.ball.x = 350;
  g.ball.y = 200;
  const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const speed = 5;
  g.ball.vx = speed * dir * Math.cos(angle);
  g.ball.vy = speed * Math.sin(angle);
}

io.on('connection', socket => {
  let roomId;

  socket.on('joinRoom', ({ roomId: id, username }) => {
    roomId = id;
    socket.join(roomId);

    if (!games[roomId]) {
      games[roomId] = {
        players: [],
        usernames: {},
        ready: {},
        isStarted: false,
        ball: { x: 350, y: 200, vx: 0, vy: 0 },
        paddles: { left: 160, right: 160 },
        scores: { left: 0, right: 0 },
        pointLimit: 10
      };
    }
    const g = games[roomId];

    g.usernames[socket.id] = username;
    if (!g.players.includes(socket.id) && g.players.length < 2) {
      g.players.push(socket.id);
    }

    socket.emit('joinedRoom', {
      players: g.players.map(i => ({ id: i, username: g.usernames[i] })),
      myId: socket.id,
      pointLimit: g.pointLimit
    });

    if (g.players.length === 2) {
      io.in(roomId).emit('playersJoined', {
        players: g.players.map(i => ({ id: i, username: g.usernames[i] }))
      });
    }
  });

  socket.on('playerReady', () => {
    const g = games[roomId];
    if (!g) return;
    g.ready[socket.id] = true;
    io.in(roomId).emit('playerReady', { id: socket.id });

    // When both are ready, start and serve
    if (g.players.length === 2 && g.players.every(id => g.ready[id])) {
      // Tell clients to begin the 3s countdown
      io.in(roomId).emit('gameStart');

      // Wait for 3 seconds (countdown), then actually start & serve
      setTimeout(() => {
        g.isStarted = true;
        serveBall(g);
      }, 3000);
    }
  });

  socket.on('movePaddle', posY => {
    const g = games[roomId];
    if (!g) return;
    const idx = g.players.indexOf(socket.id);
    if (idx === 0) g.paddles.left = posY;
    if (idx === 1) g.paddles.right = posY;
  });

  socket.on('disconnect', () => {
    const g = games[roomId];
    if (!g) return;
    delete g.ready[socket.id];
    delete g.usernames[socket.id];
    g.players = g.players.filter(i => i !== socket.id);
    if (g.players.length === 0) delete games[roomId];
  });
});

// Main physics loop
setInterval(() => {
  for (const [roomId, g] of Object.entries(games)) {
    if (!g.isStarted) continue;

    // Move
    g.ball.x += g.ball.vx;
    g.ball.y += g.ball.vy;

    // Bounce off top/bottom
    if (g.ball.y <= 10 || g.ball.y >= 390) g.ball.vy *= -1;

    // Paddle collisions
    const hitLeft = g.ball.x <= 32 &&
      g.ball.y >= g.paddles.left &&
      g.ball.y <= g.paddles.left + 80;
    const hitRight = g.ball.x >= 668 &&
      g.ball.y >= g.paddles.right &&
      g.ball.y <= g.paddles.right + 80;
    if (hitLeft || hitRight) g.ball.vx *= -1.05;

    // Scoring
    if (g.ball.x < 0) {
      g.scores.right++;
      serveBall(g);
    }
    if (g.ball.x > 700) {
      g.scores.left++;
      serveBall(g);
    }

    // Win check
    let winner = null;
    if (g.scores.left >= g.pointLimit) winner = g.players[0];
    if (g.scores.right >= g.pointLimit) winner = g.players[1];
    if (winner) {
      g.isStarted = false;
      io.in(roomId).emit('gameOver', { winner, scores: g.scores });
      continue;
    }

    // Broadcast state
    io.in(roomId).emit('gameState', {
      ball: g.ball,
      paddles: g.paddles,
      scores: g.scores
    });
  }
}, 1000 / 60);

server.listen(4000, () => console.log('🚀 Server on port 4000'));
