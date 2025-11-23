# AI MEME WARS

A real-time multiplayer meme game where players use their own faces to create memes.

## Project Structure
- `/backend`: FastAPI + Socket.IO server (Game Logic, Redis)
- `/frontend`: React + Vite + Tailwind (UI)
- `/ai-worker`: Python + Gradio + InsightFace (Face Swap AI)

## Setup & Run

### Prerequisites
- Python 3.9+
- Node.js 16+
- Redis (Upstash or Local)

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
# Set environment variables in .env (copy from .env.example)
export UPSTASH_REDIS_URL="your_redis_url"
python main.py
```
Server runs on `http://localhost:8000`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`

### 3. AI Worker (Optional for local dev, mocked by default)
```bash
cd ai-worker
pip install -r requirements.txt
python app.py
```

## Deployment
- **Backend**: Deploy to Render.com (Web Service, Python)
- **Frontend**: Deploy to Vercel (Vite)
- **AI Worker**: Deploy to Hugging Face Spaces (Gradio)

## Environment Variables
See `backend/.env.example` for required variables.
