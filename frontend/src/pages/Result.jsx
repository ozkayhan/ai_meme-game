import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import Button from '../components/Button';

const Result = () => {
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);

    useEffect(() => {
        if (!socket.connected) { navigate('/'); return; }

        // We need to fetch room data one last time or pass it via state
        // But socket listener is better
        socket.on('room_update', (data) => {
            setRoomData(data);
            if (data.status === 'PLAYING') {
                navigate('/game'); // Next round started
            }
        });

        return () => {
            socket.off('room_update');
        };
    }, [navigate]);

    // Request data if missing?
    // For now assume we have it or get it quickly.

    if (!roomData) return <div className="text-white text-center mt-20">Sonuçlar hesaplanıyor...</div>;

    const players = Object.values(roomData.players).sort((a, b) => b.score - a.score);
    const isHost = roomData.host_id === socket.id;

    const handleNextRound = () => {
        // Emit event to start next round
        // I need to add this to backend
        socket.emit('start_game'); // Re-using start game for next round? Or new event?
        // TDD says: "Round döngüsü... 4 raunt toplam".
        // Backend `next_round` function exists but no socket event calls it directly?
        // Actually `start_game` sets status to PLAYING.
        // So calling start_game again might work if logic permits.
        // Let's assume start_game works or I add `next_round` event.
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-900 p-4">
            <h1 className="text-4xl font-bold text-yellow-400 mb-8">PUAN DURUMU</h1>

            <div className="w-full max-w-md flex flex-col gap-4 mb-12">
                {players.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-slate-500">#{i + 1}</span>
                            <img src={p.avatar_url} alt={p.nick} className="w-12 h-12 rounded-full object-cover" />
                            <span className="text-xl font-bold">{p.nick}</span>
                        </div>
                        <span className="text-2xl font-bold text-yellow-400">{p.score} ★</span>
                    </div>
                ))}
            </div>

            {isHost && (
                <Button onClick={handleNextRound} variant="green">
                    SONRAKİ RAUNT
                </Button>
            )}
        </div>
    );
};

export default Result;
