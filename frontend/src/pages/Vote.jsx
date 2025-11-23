import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import Button from '../components/Button';
import { Star } from 'lucide-react';

const Vote = () => {
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [voted, setVoted] = useState(false);

    useEffect(() => {
        if (!socket.connected) { navigate('/'); return; }

        socket.on('room_update', (data) => {
            setRoomData(data);
            // Check if voting finished -> Result
            // Logic: If all submissions have enough votes?
            // Or backend sends status 'FINISHED' or 'ROUND_END'
        });

        socket.on('round_result', () => {
            navigate('/result');
        });

        return () => {
            socket.off('room_update');
            socket.off('round_result');
        };
    }, [navigate]);

    if (!roomData) return <div className="text-white text-center mt-20">Yükleniyor...</div>;

    const roundNum = roomData.current_round;
    const submissions = roomData.round_data[roundNum] || [];
    const myId = socket.id;

    // Filter submissions to vote on (exclude mine? TDD says "Kendi meme'in gelirse yıldızlar görünmez")
    // We show all, but disable voting for own.

    const currentSubmission = submissions[currentIndex];

    const handleVote = (stars) => {
        if (voted) return;

        socket.emit('submit_vote', {
            target_creator_id: currentSubmission.creator_id,
            stars: stars
        });

        setVoted(true);

        // Auto advance after short delay
        setTimeout(() => {
            if (currentIndex < submissions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setVoted(false);
            } else {
                // Waiting for others
            }
        }, 1000);
    };

    if (!currentSubmission) return <div className="text-white text-center mt-20">Oylama tamamlandı, diğerleri bekleniyor...</div>;

    const isMine = currentSubmission.creator_id === myId;
    // Mock image if null (since AI might not be running)
    const displayImage = currentSubmission.generated_image || "https://placehold.co/512x512?text=AI+Generating...";

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-900 p-4">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">OYLAMA ZAMANI ({currentIndex + 1}/{submissions.length})</h2>

            <div className="w-full max-w-md bg-black rounded-xl overflow-hidden mb-8 border-2 border-slate-700">
                <img src={displayImage} alt="Meme" className="w-full h-auto" />
                <div className="p-4 bg-white text-black text-center font-bold text-xl font-mono">
                    {currentSubmission.caption}
                </div>
            </div>

            {isMine ? (
                <div className="text-slate-400 font-bold text-lg">Bu senin şaheserin! (Oy veremezsin)</div>
            ) : (
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleVote(star)}
                            disabled={voted}
                            className={`transition-transform hover:scale-110 ${voted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Star
                                size={48}
                                className={`${voted ? 'text-yellow-600' : 'text-slate-600 hover:text-yellow-400 fill-current'}`}
                                fill={voted ? "currentColor" : "none"}
                            />
                        </button>
                    ))}
                </div>
            )}

            {isMine && !voted && (
                <Button onClick={() => {
                    setVoted(true);
                    setTimeout(() => {
                        if (currentIndex < submissions.length - 1) {
                            setCurrentIndex(prev => prev + 1);
                            setVoted(false);
                        }
                    }, 1000);
                }} variant="blue" className="mt-4">
                    SIRADAKİ
                </Button>
            )}
        </div>
    );
};

export default Vote;
