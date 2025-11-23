import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import Button from '../components/Button';
import { Copy, User } from 'lucide-react';

const Lobby = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [myId, setMyId] = useState(socket.id);

    useEffect(() => {
        if (!socket.connected) {
            // If user refreshes, we lose socket state. Redirect to home.
            navigate('/');
            return;
        }
        setMyId(socket.id);

        const onRoomUpdate = (data) => {
            setRoomData(data);
            // Check if game started
            if (data.status === 'PLAYING') {
                navigate('/game');
            }
        };

        const onGameStarted = () => {
            navigate('/game');
        };

        socket.on('room_update', onRoomUpdate);
        socket.on('game_started', onGameStarted);

        // Initial fetch if needed? No, server sends update on join.
        // But if we are just rendering, we might wait for first update.

        return () => {
            socket.off('room_update', onRoomUpdate);
            socket.off('game_started', onGameStarted);
        };
    }, [navigate, roomId]);

    const toggleReady = () => {
        socket.emit('toggle_ready');
    };

    const startGame = () => {
        socket.emit('start_game');
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        alert("Oda kodu kopyalandı!");
    };

    if (!roomData) return <div className="text-white text-center mt-20">Lobi yükleniyor...</div>;

    const players = Object.entries(roomData.players || {});
    const isHost = roomData.host_id === myId;
    const allReady = players.length > 0 && players.every(([_, p]) => p.is_ready);
    const me = roomData.players[myId];

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-900 p-4">
            <div
                onClick={copyRoomCode}
                className="mt-8 mb-12 px-6 py-3 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-3 cursor-pointer hover:bg-slate-700 transition-colors"
            >
                <span className="text-slate-400">ODA KODU:</span>
                <span className="text-2xl font-mono font-bold text-yellow-400 tracking-widest">{roomId}</span>
                <Copy size={18} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-12 w-full max-w-2xl">
                {[0, 1, 2, 3].map((i) => {
                    const playerEntry = players[i];
                    const player = playerEntry ? playerEntry[1] : null;
                    const playerId = playerEntry ? playerEntry[0] : null;
                    const isMe = playerId === myId;

                    return (
                        <div
                            key={i}
                            className={`
                aspect-square rounded-2xl bg-slate-800 flex flex-col items-center justify-center relative overflow-hidden transition-all
                ${player ? 'border-2' : 'border-2 border-dashed border-slate-700'}
                ${player?.is_ready ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-slate-700'}
              `}
                        >
                            {player ? (
                                <>
                                    <img src={player.avatar_url} alt={player.nick} className="w-full h-full object-cover absolute inset-0 opacity-60" />
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 text-center">
                                        <div className="font-bold text-lg truncate">{player.nick}</div>
                                        {player.is_ready && <div className="text-xs text-green-400 font-bold mt-1">HAZIR</div>}
                                    </div>
                                    {isMe && <div className="absolute top-2 right-2 bg-indigo-600 text-xs px-2 py-1 rounded">SEN</div>}
                                    {playerId === roomData.host_id && <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">HOST</div>}
                                </>
                            ) : (
                                <div className="text-slate-600 flex flex-col items-center">
                                    <User size={48} className="mb-2 opacity-50" />
                                    <span>Bekleniyor...</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="fixed bottom-8 w-full max-w-md px-4 flex flex-col gap-3">
                <Button
                    onClick={toggleReady}
                    variant={me?.is_ready ? "red" : "green"}
                    className="w-full"
                >
                    {me?.is_ready ? "HAZIR DEĞİLİM" : "HAZIRIM"}
                </Button>

                {isHost && (
                    <Button
                        onClick={startGame}
                        disabled={!allReady || players.length < 2} // Allow 2 players for testing, ideally 4
                        variant="primary"
                        className="w-full"
                    >
                        OYUNU BAŞLAT
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Lobby;
