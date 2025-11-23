import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

// Mock Templates
const TEMPLATES = [
    { id: 'batman', url: 'https://i.imgflip.com/434i5j.png' },
    { id: 'drake', url: 'https://i.imgflip.com/30b1gx.jpg' },
    { id: 'disaster', url: 'https://i.imgflip.com/23ls.jpg' },
    { id: 'distracted', url: 'https://i.imgflip.com/1ur9b0.jpg' },
    { id: 'buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
];

const Game = () => {
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [caption, setCaption] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!socket.connected) { navigate('/'); return; }

        const onRoomUpdate = (data) => {
            setRoomData(data);
            // Check if we moved to voting
            // Logic: If round_data has generated_image for everyone, or status changed?
            // The backend logic for state change isn't fully automatic in my code yet.
            // But let's assume if we get a 'vote_start' or similar.
            // Or if status becomes VOTING (I need to add this state to backend if not present).
            // TDD says: "Herkes oy verince: round_result".
            // But when does it go to Vote page?
            // "submit_turn" -> "processing_start" -> (AI works) -> ?
            // We need an event when AI is done.
        };

        const onProcessingStart = () => {
            setIsProcessing(true);
        };

        const onVoteStart = () => {
            navigate('/vote');
        };

        // Custom event I should add to backend: 'round_ready_for_vote'
        // For now, let's listen for room_update and check if current round has images.

        socket.on('room_update', onRoomUpdate);
        socket.on('processing_start', onProcessingStart);
        socket.on('vote_start', onVoteStart);

        return () => {
            socket.off('room_update', onRoomUpdate);
            socket.off('processing_start', onProcessingStart);
            socket.off('vote_start', onVoteStart);
        };
    }, [navigate]);

    useEffect(() => {
        if (timeLeft > 0 && !isSubmitting && !isProcessing) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isSubmitting) {
            // Auto submit?
            // handleSubmit();
        }
    }, [timeLeft, isSubmitting, isProcessing]);

    const handleSubmit = () => {
        if (!selectedTarget || !caption) return;
        setIsSubmitting(true);
        socket.emit('submit_turn', {
            template_id: selectedTemplate,
            target_id: selectedTarget,
            caption: caption
        });
    };

    if (isProcessing) return <Loader message="Yapay Zeka Pişiriyor... (Bu işlem 30-60sn sürebilir)" />;
    if (!roomData) return <Loader message="Oyun Yükleniyor..." />;

    const players = Object.entries(roomData.players || {});
    const myId = socket.id;
    const opponents = players.filter(([id]) => id !== myId);

    return (
        <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
            {/* Timer Bar */}
            <div className="w-full h-2 bg-slate-800">
                <div
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {/* Template Carousel */}
                <h3 className="text-slate-400 mb-2 font-bold">1. ŞABLON SEÇ</h3>
                <div className="mb-6">
                    <Swiper
                        spaceBetween={10}
                        slidesPerView={1.5}
                        centeredSlides={true}
                        onSlideChange={(swiper) => setSelectedTemplate(TEMPLATES[swiper.activeIndex].id)}
                        className="w-full"
                    >
                        {TEMPLATES.map((t) => (
                            <SwiperSlide key={t.id}>
                                <div className={`
                  rounded-xl overflow-hidden border-4 transition-all
                  ${selectedTemplate === t.id ? 'border-yellow-400 scale-105' : 'border-transparent opacity-50'}
                `}>
                                    <img src={t.url} alt={t.id} className="w-full h-48 object-cover" />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Target Selector */}
                <h3 className="text-slate-400 mb-2 font-bold">2. KURBAN SEÇ</h3>
                <div className="flex justify-center gap-4 mb-6">
                    {opponents.map(([id, p]) => (
                        <div
                            key={id}
                            onClick={() => setSelectedTarget(id)}
                            className={`
                relative w-20 h-20 rounded-full overflow-hidden cursor-pointer transition-all
                ${selectedTarget === id ? 'ring-4 ring-yellow-400 scale-110' : 'opacity-70'}
              `}
                        >
                            <img src={p.avatar_url} alt={p.nick} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-center text-white py-1">
                                {p.nick}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Caption Input */}
                <h3 className="text-slate-400 mb-2 font-bold">3. ESPRİYİ PATLAT</h3>
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={100}
                    rows={2}
                    placeholder="Buraya komik bir şeyler yaz..."
                    className="w-full bg-slate-800 text-white p-4 rounded-xl border-2 border-slate-700 focus:border-yellow-400 outline-none text-lg mb-4"
                />
            </div>

            {/* Action Button */}
            <div className="fixed bottom-0 w-full p-4 bg-slate-900/90 backdrop-blur">
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedTarget || !caption || isSubmitting}
                    variant="primary"
                    className="w-full"
                >
                    {isSubmitting ? "GÖNDERİLDİ, BEKLENİYOR..." : "GÖNDER GELSİN"}
                </Button>
            </div>
        </div>
    );
};

export default Game;
