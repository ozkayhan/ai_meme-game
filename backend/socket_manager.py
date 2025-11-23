import socketio
from game_logic import (
    create_room, join_room, toggle_ready, start_game, 
    submit_turn, submit_vote, update_generated_image, next_round, get_room
)
import os
import requests
import threading

# Initialize Socket.IO Server
# cors_allowed_origins="*" is crucial for Vercel deployment
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")

# Map socket_id to room_code for quick lookup
socket_room_map = {}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Optional: Handle player drop (remove from room or mark offline)
    if sid in socket_room_map:
        del socket_room_map[sid]

@sio.event
async def create_room_event(sid, data):
    # data: { "nick": "...", "avatar_url": "..." }
    import uuid
    room_code = str(uuid.uuid4())[:4].upper() # Simple 4-char code
    
    room_data = create_room(room_code, sid, data.get("nick"), data.get("avatar_url"))
    socket_room_map[sid] = room_code
    
    await sio.enter_room(sid, room_code)
    await sio.emit('room_created', {"room_code": room_code}, room=sid)
    await sio.emit('room_update', room_data, room=room_code)

@sio.event
async def join_room_event(sid, data):
    # data: { "room_code": "...", "nick": "...", "avatar_url": "..." }
    room_code = data.get("room_code")
    nick = data.get("nick")
    avatar_url = data.get("avatar_url")
    
    room_data, error = join_room(room_code, sid, nick, avatar_url)
    if error:
        await sio.emit('error', {"message": error}, room=sid)
        return
        
    socket_room_map[sid] = room_code
    await sio.enter_room(sid, room_code)
    await sio.emit('room_update', room_data, room=room_code)

@sio.event
async def toggle_ready_event(sid, data):
    room_code = socket_room_map.get(sid)
    if not room_code: return
    
    room_data = toggle_ready(room_code, sid)
    if room_data:
        await sio.emit('room_update', room_data, room=room_code)

@sio.event
async def start_game_event(sid, data):
    room_code = socket_room_map.get(sid)
    if not room_code: return
    
    room_data, error = start_game(room_code, sid)
    if error:
        await sio.emit('error', {"message": error}, room=sid)
        return
        
    await sio.emit('game_started', room_data, room=room_code)

@sio.event
async def submit_turn_event(sid, data):
    # data: { "caption": "...", "target_id": "...", "template_id": "..." }
    room_code = socket_room_map.get(sid)
    if not room_code: return
    
    room_data = submit_turn(room_code, sid, data)
    if not room_data: return
    
    # Check if all players submitted
    round_num = str(room_data["current_round"])
    submissions = room_data["round_data"][round_num]
    total_players = len(room_data["players"])
    
    if len(submissions) >= total_players:
        await sio.emit('processing_start', {"message": "AI is cooking..."}, room=room_code)
        # Trigger AI Worker for each submission
        # This should ideally be a background task
        for sub in submissions:
            # Mock AI generation for prototype
            # In production, this would be an async task or callback
            threading.Thread(target=mock_ai_process, args=(room_code, sub)).start()
            
    else:
        # Notify that a player has submitted (optional)
        pass

def mock_ai_process(room_code, submission):
    import time
    time.sleep(5) # Simulate processing time
    
    # Mock result
    mock_url = f"https://placehold.co/600x600?text={submission['caption'].replace(' ', '+')}"
    update_generated_image(room_code, submission["creator_id"], mock_url)
    
    # Check if all images are ready
    room_data = get_room(room_code)
    round_num = str(room_data["current_round"])
    all_ready = all(s.get("generated_image") for s in room_data["round_data"][round_num])
    
    if all_ready:
        # Notify clients to move to voting
        # We can reuse room_update, but maybe a specific event is better
        # Or just update status to VOTING (if we had that status)
        # For now, let's emit 'round_ready_for_vote' or just 'room_update' 
        # and let frontend check if images exist.
        # But frontend logic in Game.jsx was: socket.on('room_update', ...)
        # Let's emit a specific event to be safe.
        sio.emit('room_update', room_data, room=room_code)
        sio.emit('vote_start', room_data, room=room_code) # New event


@sio.event
async def submit_vote_event(sid, data):
    # data: { "target_creator_id": "...", "stars": 5 }
    room_code = socket_room_map.get(sid)
    if not room_code: return
    
    room_data = submit_vote(room_code, sid, data.get("target_creator_id"), data.get("stars"))
    if not room_data: return
    
    # Check if voting is complete for this round
    # Logic: If everyone voted for everyone (except themselves)
    # Simplified: If total votes count reaches expected number.
    # Expected votes = (Num Players) * (Num Players - 1)
    
    total_players = len(room_data["players"])
    round_num = str(room_data["current_round"])
    submissions = room_data["round_data"][round_num]
    
    total_votes_cast = sum(len(sub.get("voters", [])) for sub in submissions)
    expected_votes = total_players * (total_players - 1)
    
    # For testing with fewer players, this logic might block.
    # Let's just check if every submission has (total_players - 1) votes.
    
    round_complete = all(len(sub.get("voters", [])) >= (total_players - 1) for sub in submissions)
    
    if round_complete:
        await sio.emit('round_result', room_data, room=room_code)
    else:
        await sio.emit('vote_update', room_data, room=room_code)

# Helper to trigger AI (Mock for now, will implement integration later)
async def trigger_ai_generation(room_code, submission):
    # Call HF Space API
    pass
