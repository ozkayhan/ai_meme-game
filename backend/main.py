from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from socket_manager import sio
import socketio
import uvicorn
import os

app = FastAPI()

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO
# socketio_app = socketio.ASGIApp(sio, app) # This is the standard way
# But we need to wrap the FastAPI app with Socket.IO
app = socketio.ASGIApp(sio, app)

# Note: Since we wrapped app with ASGIApp, the FastAPI routes are now under the ASGI app.
# However, to define routes we still use the original `app` object (FastAPI instance).
# Wait, `app = socketio.ASGIApp(sio, app)` makes `app` the SocketIO app.
# We need to keep a reference to the FastAPI app to add routes.

fastapi_app = FastAPI()
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@fastapi_app.get("/")
async def root():
    return {"status": "active", "service": "meme-wars-backend"}

@fastapi_app.post("/api/upload-temp")
async def upload_temp(file: UploadFile = File(...)):
    # In a real app, upload to Supabase Storage here.
    # For MVP/Prototype, we might just return a mock URL or handle it if we have credentials.
    # The TDD says: "Supabase Storage'a yükle."
    
    # TODO: Implement Supabase upload
    # For now, return a dummy URL to unblock frontend dev if credentials aren't set.
    return {"url": "https://placehold.co/512x512?text=Uploaded+Image"}

# Final App Assembly
app = socketio.ASGIApp(sio, fastapi_app)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
