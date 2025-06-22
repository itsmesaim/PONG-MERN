// src/components/Game.jsx
import React, { useRef, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function Game({ config, onExit }) {
  const canvasRef = useRef();
  const socketRef = useRef();

  const [game, setGame] = useState({
    ball:    { x: 350, y: 200, vx: 0, vy: 0 },
    paddles: { left: 160, right: 160 },
    scores:  { left: 0, right: 0 }
  });
  const [players,    setPlayers]    = useState([]);
  const [myId,       setMyId]       = useState(null);
  const [pointLimit, setPointLimit] = useState(10);
  const [readyFlags, setReadyFlags] = useState({});
  const [countdown,  setCountdown]  = useState(null);
  const [gameOver,   setGameOver]   = useState(null);

  // Serve the ball (center + random velocity)
  function serveBallClient() {
    const angle = (Math.random() * Math.PI/4) - Math.PI/8;
    const dir   = Math.random() < 0.5 ? 1 : -1;
    setGame(g => ({
      ...g,
      ball: {
        x: 350,
        y: 200,
        vx: 5 * dir * Math.cos(angle),
        vy: 4 * Math.sin(angle)
      }
    }));
  }

  // 3-second countdown
  function launchCountdown() {
    let c = 3;
    setCountdown(c);
    const iv = setInterval(() => {
      c -= 1;
      setCountdown(c >= 0 ? c : null);
      if (c < 0) {
        clearInterval(iv);
        if (config.mode === 'ai') serveBallClient();
      }
    }, 1000);
  }

  // ── Effect #1: Connect socket (friend) or start AI countdown ─────────
  useEffect(() => {
    if (config.mode === 'friend') {
      socketRef.current = io(import.meta.env.VITE_API_URL, {
        path: '/socket.io',
        transports: ['websocket']
      });

      socketRef.current.emit('joinRoom', {
        roomId:   config.roomId,
        username: config.username
      });

      socketRef.current.on('joinedRoom', ({ players, myId, pointLimit }) => {
        setPlayers(players);
        setMyId(myId);
        setPointLimit(pointLimit);
      });
      socketRef.current.on('playersJoined', ({ players }) => {
        setPlayers(players);
      });
      socketRef.current.on('playerReady', ({ id }) => {
        setReadyFlags(f => ({ ...f, [id]: true }));
      });
      socketRef.current.on('gameStart', () => launchCountdown());
      socketRef.current.on('gameState', data => setGame(data));
      socketRef.current.on('gameOver', data => setGameOver(data));
    } else {
      launchCountdown();
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [config]);

  // ── Effect #2: AI physics loop ────────────────────────────────────────
  useEffect(() => {
    if (config.mode !== 'ai') return;
    const iv = setInterval(() => {
      if (countdown !== null || gameOver) return;
      setGame(g => {
        const ng = { ...g };
        // move ball
        ng.ball.x += ng.ball.vx;
        ng.ball.y += ng.ball.vy;
        // bounce off top/bottom
        if (ng.ball.y <= 10 || ng.ball.y >= 390) ng.ball.vy *= -1;
        // AI paddle
        const target = ng.ball.y - 40;
        ng.paddles.right += (target - ng.paddles.right) * 0.1;
        // paddle collisions
        const hitL = ng.ball.x <= 32 &&
                     ng.ball.y >= ng.paddles.left &&
                     ng.ball.y <= ng.paddles.left + 80;
        const hitR = ng.ball.x >= 668 &&
                     ng.ball.y >= ng.paddles.right &&
                     ng.ball.y <= ng.paddles.right + 80;
        if (hitL || hitR) ng.ball.vx *= -1.05;
        // scoring & serve
        if (ng.ball.x < 0)  { ng.scores.right++; serveBallClient(); }
        if (ng.ball.x > 700){ ng.scores.left++;  serveBallClient(); }
        // win check
        if (ng.scores.left  >= pointLimit) setGameOver({ winner:'me' });
        if (ng.scores.right >= pointLimit) setGameOver({ winner:'ai' });
        return ng;
      });
    }, 1000/60);
    return () => clearInterval(iv);
  }, [config, countdown, gameOver, pointLimit]);

  // ── Effect #3: Drawing & input ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;               // guard early
    const ctx = canvas.getContext('2d');
    let anim;

    const draw = () => {
      // clear
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 700, 400);
      // net
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let y = 0; y < 400; y += 30) {
        ctx.fillRect(348, y, 4, 16);
      }
      // paddles
      ctx.fillStyle = '#0af';
      ctx.fillRect(20,  game.paddles.left, 12, 80);
      ctx.fillRect(668, game.paddles.right,12, 80);
      // ball
      ctx.beginPath();
      ctx.arc(game.ball.x, game.ball.y, 10, 0, 2*Math.PI);
      ctx.fillStyle = '#fa0';
      ctx.fill();
      // scores
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.fillText(game.scores.left,  300, 50);
      ctx.fillText(game.scores.right, 360, 50);
      // usernames in friend mode
      if (config.mode === 'friend' && players.length === 2) {
        ctx.font = '16px sans-serif';
        ctx.fillText(players[0].username, 50, 20);
        ctx.fillText(players[1].username, 600,20);
      }
      // countdown overlay
      if (countdown !== null) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,700,400);
        ctx.fillStyle = '#fff';
        ctx.font = '72px sans-serif';
        ctx.fillText(countdown > 0 ? countdown : 'Go!', 330, 220);
      }
      // gameOver overlay
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0,0,700,400);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        const winnerText = config.mode === 'friend'
          ? players.find(p => p.id === gameOver.winner)?.username + ' Wins!'
          : (gameOver.winner==='me'?'You Win!':'AI Wins!');
        ctx.fillText(winnerText, 220, 200);
      }
    };

    const loop = () => {
      draw();
      anim = requestAnimationFrame(loop);
    };
    loop();

    const handleMove = e => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = canvas.getBoundingClientRect();
      const y = Math.max(0, Math.min(320, clientY - rect.top - 40));
      setGame(g => ({
        ...g,
        paddles: { ...g.paddles, left: y }
      }));
      if (config.mode === 'friend') {
        socketRef.current.emit('movePaddle', y);
      }
    };

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove',  handleMove);

    return () => {
      cancelAnimationFrame(anim);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove',  handleMove);
    };
  }, [game, config, players, countdown, gameOver]);

  // ── Friend-mode Waiting/Ready screen ─────────────────────────────────
  if (config.mode === 'friend') {
    const readyCount = Object.keys(readyFlags).length;
    if (players.length < 2) {
      return (
        <div className="lobby">
          <h2>Waiting for friend to join (Room: {config.roomId})</h2>
          <button onClick={onExit}>← Back to Lobby</button>
        </div>
      );
    }
    if (countdown === null && !gameOver && game.ball.vx === 0 && game.ball.vy === 0) {
      return (
        <div className="lobby">
          <h2>Players:</h2>
          <ul>
            {players.map(p => <li key={p.id}>{p.username}</li>)}
          </ul>
          <button onClick={() => socketRef.current.emit('playerReady')}>
            {readyFlags[myId] ? '✅ Ready' : 'Click When Ready'}
          </button>
          <p>{readyCount}/2 Ready</p>
          <button onClick={onExit}>← Back to Lobby</button>
        </div>
      );
    }
  }

  // ── Default: the Canvas ───────────────────────────────────────────────
  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={700} height={400} />
      <button style={{ marginTop: '16px' }} onClick={onExit}>
        ← Back to Lobby
      </button>
    </div>
  );
}
