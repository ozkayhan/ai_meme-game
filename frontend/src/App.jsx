import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Vote from './pages/Vote';
import Result from './pages/Result';
import { wakeUpServer } from './services/api';

function App() {
  useEffect(() => {
    // Wake up Render server on app load
    wakeUpServer();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:roomId" element={<Lobby />} />
        <Route path="/game" element={<Game />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
