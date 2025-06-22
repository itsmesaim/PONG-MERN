import React, { useEffect, useState } from 'react';

export default function Lobby({ onStart }) {
  const [username, setUsername] = useState('');
  const [roomId,   setRoomId]   = useState('');

  useEffect(() => {
    // generate a random room ID once
    const id = crypto.randomUUID?.() || Math.random().toString(36).substr(2,9);
    setRoomId(id);
  }, []);

  return (
    <div className="lobby">
      <h1>🎾 Multiplayer Pong</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      {!username && <p style={{color:'#f55'}}>Your name is required.</p>}
      {username && (
        <>
          <button onClick={() => onStart({ mode:'ai', username })}>
            Play vs. AI
          </button>

          <hr />

          <button onClick={() => onStart({ mode:'friend', username, roomId })}>
            Create Room ({roomId})
          </button>
          <p>— OR —</p>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
          />
          <button onClick={() => onStart({ mode:'friend', username, roomId })}>
            Join Room
          </button>
          <p style={{ marginTop:'12px', fontSize:'0.9rem' }}>
            Share this Room ID with a friend!
          </p>
        </>
      )}
    </div>
  );
}
