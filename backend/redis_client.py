import os
import json
from upstash_redis import Redis

class MockRedis:
    def __init__(self):
        self.data = {}
        print("Using MOCK REDIS (In-Memory)")

    def get(self, key):
        return self.data.get(key)

    def set(self, key, value, ex=None):
        self.data[key] = value
        return True

    def delete(self, key):
        if key in self.data:
            del self.data[key]
        return True

# Initialize Redis client
# Expects UPSTASH_REDIS_URL to be set in environment variables
# Format: redis://default:password@endpoint:port
redis_url = os.getenv("UPSTASH_REDIS_URL")
if not redis_url:
    print("WARNING: UPSTASH_REDIS_URL not set. Using in-memory mock for verification.")
    redis = MockRedis()
else:
    redis = Redis.from_url(redis_url)

def get_room(room_code: str):
    """Retrieve room data from Redis."""
    if not redis: return None
    data = redis.get(f"room:{room_code}")
    # Mock redis stores the string/json directly or as string?
    # Upstash Redis .get() returns the object if it's JSON? Or string?
    # Upstash REST API returns data. If we use .set(json.dumps), .get might return string.
    # Let's assume string for consistency with real Redis usage in this app.
    if isinstance(data, dict): return data # Handle if mock stored dict
    return json.loads(data) if data else None

def set_room(room_code: str, data: dict, ttl: int = 3600):
    """Save room data to Redis with TTL (default 1 hour)."""
    if not redis: return
    # Store as JSON string to mimic real redis behavior
    redis.set(f"room:{room_code}", json.dumps(data), ex=ttl)

def delete_room(room_code: str):
    """Delete room data from Redis."""
    if not redis: return
    redis.delete(f"room:{room_code}")
