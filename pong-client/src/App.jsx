import React, { useState } from 'react';
import Lobby from './components/Lobby';
import Game  from './components/Game';

export default function App() {
  // config: { mode:'ai', username } or { mode:'friend', username, roomId }
  const [config, setConfig] = useState(null);

  return config
    ? <Game  config={config} onExit={() => setConfig(null)} />
    : <Lobby onStart={setConfig} />;
}
