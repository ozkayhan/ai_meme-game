import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamCapture from '../components/WebcamCapture';
import Button from '../components/Button';
import { uploadTempImage, wakeUpServer } from '../services/api';
import { socket } from '../services/socket';

const Home = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Nick, 2: Photo, 3: Menu
    const [nick, setNick] = useState("");
    const [avatarBlob, setAvatarBlob] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [roomInput, setRoomInput] = useState("");
    const [showJoinInput, setShowJoinInput] = useState(false);

    useEffect(() => {
        wakeUpServer();
    }, []);

    const handleNickSubmit = () => {
        if (nick.trim().length > 0) setStep(2);
    };

    const handlePhotoCapture = (blob, previewUrl) => {
        setAvatarBlob(blob);
        // Automatically upload
        handleUpload(blob);
    };

    const handleUpload = async (blob) => {
        setIsUploading(true);
        try {
            const res = await uploadTempImage(blob);
            setAvatarUrl(res.url);
            setStep(3);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Fotoğraf yüklenemedi. Sunucu uyuyor olabilir, tekrar dene.");
        } finally {
            setIsUploading(false);
        }
    };

    const connectAndAction = (action, data = {}) => {
        socket.connect();

        const handleConnect = () => {
            if (action === 'create') {
                socket.emit('create_room', { nick, avatar_url: avatarUrl });
            } else if (action === 'join') {
                socket.emit('join_room', { room_code: data.roomCode, nick, avatar_url: avatarUrl });
            }
        };

        if (socket.connected) {
            handleConnect();
        } else {
            socket.once('connect', handleConnect);
        }

        // Listen for success events
        socket.once('room_created', ({ room_code }) => {
            navigate(`/lobby/${room_code}`);
        });

        socket.once('room_update', (roomData) => {
            // If we joined successfully, we get room_update
            // We need to check if we are in the player list to confirm join
            // But for now assume success if we get update and redirect
            // The socket_manager emits room_update to the room.
            // We should check if we are actually in the room? 
            // socket.id is needed.
            navigate(`/lobby/${roomData.room_code || data.roomCode}`); // room_code might not be in roomData root if strict schema
        });

        socket.once('error', ({ message }) => {
            alert(message);
            socket.disconnect();
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
            <h1 className="text-4xl font-bold text-yellow-400 mb-8 tracking-wider">MEME WARS AI</h1>

            {step === 1 && (
                <div className="flex flex-col gap-4 items-center animate-fade-in">
                    <input
                        type="text"
                        placeholder="Takma Adın (max 10 harf)"
                        maxLength={10}
                        value={nick}
                        onChange={(e) => setNick(e.target.value)}
                        className="w-64 p-3 rounded-lg bg-slate-800 text-white border-2 border-slate-700 focus:border-yellow-400 outline-none text-center text-xl"
                    />
                    <Button onClick={handleNickSubmit} disabled={!nick.trim()} variant="primary">
                        DEVAM ET
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col gap-4 items-center animate-fade-in">
                    <h2 className="text-xl text-slate-300 mb-4">Meme Yüzünü Seç</h2>
                    {isUploading ? (
                        <div className="text-yellow-400 animate-pulse">Yükleniyor...</div>
                    ) : (
                        <WebcamCapture onCapture={handlePhotoCapture} />
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col gap-4 items-center animate-fade-in">
                    <div className="flex items-center gap-2 mb-6">
                        <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-yellow-400" />
                        <span className="text-xl font-bold">{nick}</span>
                    </div>

                    <Button onClick={() => connectAndAction('create')} variant="green">
                        ODA KUR
                    </Button>

                    {!showJoinInput ? (
                        <Button onClick={() => setShowJoinInput(true)} variant="blue">
                            ODAYA KATIL
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2 animate-fade-in">
                            <input
                                type="text"
                                placeholder="ODA KODU"
                                value={roomInput}
                                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                                className="w-64 p-3 rounded-lg bg-slate-800 text-white border-2 border-slate-700 text-center tracking-widest font-mono text-xl"
                            />
                            <Button
                                onClick={() => connectAndAction('join', { roomCode: roomInput })}
                                disabled={!roomInput}
                                variant="blue"
                            >
                                GİRİŞ YAP
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;
