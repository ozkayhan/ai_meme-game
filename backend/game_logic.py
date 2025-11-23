import random
from redis_client import get_room, set_room

# Game Constants
MAX_ROUNDS = 4
MAX_PLAYERS = 4

def create_room(room_code: str, host_id: str, host_nick: str, host_avatar: str):
    """Initialize a new room."""
    room_data = {
        "status": "LOBBY",
        "current_round": 1,
        "max_rounds": MAX_ROUNDS,
        "host_id": host_id,
        "players": {
            host_id: {
                "nick": host_nick,
                "score": 0,
                "avatar_url": host_avatar,
                "is_ready": False
            }
        },
        "round_data": {}
    }
    set_room(room_code, room_data)
    return room_data

def join_room(room_code: str, player_id: str, nick: str, avatar_url: str):
    """Add a player to an existing room."""
    room_data = get_room(room_code)
    if not room_data:
        return None, "Room not found"
    
    if room_data["status"] != "LOBBY":
        return None, "Game already started"
        
    if len(room_data["players"]) >= MAX_PLAYERS:
        return None, "Room is full"
        
    room_data["players"][player_id] = {
        "nick": nick,
        "score": 0,
        "avatar_url": avatar_url,
        "is_ready": False
    }
    set_room(room_code, room_data)
    return room_data, None

def toggle_ready(room_code: str, player_id: str):
    """Toggle player ready status."""
    room_data = get_room(room_code)
    if not room_data or player_id not in room_data["players"]:
        return None
        
    current_status = room_data["players"][player_id]["is_ready"]
    room_data["players"][player_id]["is_ready"] = not current_status
    set_room(room_code, room_data)
    return room_data

def start_game(room_code: str, requestor_id: str):
    """Start the game if requestor is host and all players are ready."""
    room_data = get_room(room_code)
    if not room_data:
        return None, "Room not found"
        
    if requestor_id != room_data["host_id"]:
        return None, "Only host can start game"
        
    # Check if all players are ready
    if not all(p["is_ready"] for p in room_data["players"].values()):
        return None, "Not all players are ready"
        
    room_data["status"] = "PLAYING"
    set_room(room_code, room_data)
    return room_data, None

def submit_turn(room_code: str, player_id: str, turn_data: dict):
    """
    Save player's turn data for the current round.
    turn_data: { "target_id": "...", "template_id": "...", "caption": "..." }
    """
    room_data = get_room(room_code)
    if not room_data:
        return None
        
    round_num = str(room_data["current_round"])
    if round_num not in room_data["round_data"]:
        room_data["round_data"][round_num] = []
        
    # Check if player already submitted
    existing = next((x for x in room_data["round_data"][round_num] if x["creator_id"] == player_id), None)
    if existing:
        return room_data # Already submitted
        
    submission = {
        "creator_id": player_id,
        "target_id": turn_data["target_id"],
        "template_id": turn_data["template_id"],
        "caption": turn_data["caption"],
        "generated_image": None, # Will be filled by AI worker
        "votes": 0,
        "voters": [] # Track who voted to prevent double voting
    }
    room_data["round_data"][round_num].append(submission)
    set_room(room_code, room_data)
    return room_data

def update_generated_image(room_code: str, creator_id: str, image_url: str):
    """Update the submission with the AI generated image URL."""
    room_data = get_room(room_code)
    if not room_data: return None
    
    round_num = str(room_data["current_round"])
    if round_num in room_data["round_data"]:
        for submission in room_data["round_data"][round_num]:
            if submission["creator_id"] == creator_id:
                submission["generated_image"] = image_url
                break
    
    set_room(room_code, room_data)
    return room_data

def submit_vote(room_code: str, voter_id: str, target_creator_id: str, stars: int):
    """Process a vote."""
    room_data = get_room(room_code)
    if not room_data: return None
    
    round_num = str(room_data["current_round"])
    if round_num in room_data["round_data"]:
        for submission in room_data["round_data"][round_num]:
            if submission["creator_id"] == target_creator_id:
                # Prevent self-voting or double voting if needed (logic can be added here)
                if voter_id in submission.get("voters", []):
                    return None # Already voted
                
                submission["votes"] += stars
                if "voters" not in submission: submission["voters"] = []
                submission["voters"].append(voter_id)
                
                # Update creator's total score
                if target_creator_id in room_data["players"]:
                    room_data["players"][target_creator_id]["score"] += stars
                break
                
    set_room(room_code, room_data)
    return room_data

def next_round(room_code: str):
    """Advance to next round or finish game."""
    room_data = get_room(room_code)
    if not room_data: return None
    
    if room_data["current_round"] >= room_data["max_rounds"]:
        room_data["status"] = "FINISHED"
    else:
        room_data["current_round"] += 1
        room_data["status"] = "PLAYING" # Reset to playing for next round
        
    set_room(room_code, room_data)
    return room_data
