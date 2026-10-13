import time
from collections import defaultdict
from functools import wraps
import bcrypt
from flask import request, session, jsonify, current_app, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from backend.models import db, User


def hash_password(plain_password: str) -> str:
    """Hashes a plaintext password using bcrypt with a work factor of 12."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    if not plain_password or not password_hash:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def generate_auth_token(user_id: int) -> str:
    """Generates a cryptographically signed token with expiration."""
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    return serializer.dumps({"uid": user_id}, salt="fitplan-auth-v1")


def verify_auth_token(token: str, max_age_seconds: int = 7 * 24 * 3600) -> int | None:
    """Verifies a signed auth token and returns the user_id if valid."""
    if not token:
        return None
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    try:
        payload = serializer.loads(token, salt="fitplan-auth-v1", max_age=max_age_seconds)
        return int(payload.get("uid"))
    except (BadSignature, SignatureExpired, ValueError, TypeError):
        return None


def get_authenticated_user() -> User | None:
    """
    Resolves the currently authenticated user from either:
    1. Server-side Flask session cookie (session['user_id'])
    2. Signed Authorization Bearer token
    """
    user_id = session.get("user_id")
    if not user_id:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            user_id = verify_auth_token(token)

    if not user_id:
        return None

    user = db.session.get(User, int(user_id))
    if not user or not user.is_active:
        return None
    return user


def require_auth(fn):
    """Decorator that protects private API endpoints."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_authenticated_user()
        if not user:
            return (
                jsonify(
                    {
                        "error": "Authentication required. Please log in to continue.",
                        "code": "UNAUTHORIZED",
                    }
                ),
                401,
            )
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


class RateLimiter:
    """Sliding-window rate limiter to protect authentication endpoints from brute force."""

    def __init__(self):
        self._attempts: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds
        history = [ts for ts in self._attempts[key] if ts > cutoff]
        self._attempts[key] = history

        if len(history) >= max_requests:
            retry_after = max(1, int(window_seconds - (now - history[0])))
            return False, retry_after

        self._attempts[key].append(now)
        return True, 0

    def reset(self) -> None:
        self._attempts.clear()


auth_rate_limiter = RateLimiter()


def rate_limit(max_requests: int = 15, window_seconds: int = 60):
    """Rate-limiting decorator keyed by client IP and endpoint."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if current_app.config.get("TESTING"):
                if not current_app.config.get("ENABLE_RATE_LIMIT_IN_TESTS", False):
                    return fn(*args, **kwargs)

            client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
            key = f"{fn.__name__}:{client_ip}"
            allowed, retry_after = auth_rate_limiter.is_allowed(
                key, max_requests=max_requests, window_seconds=window_seconds
            )
            if not allowed:
                return (
                    jsonify(
                        {
                            "error": f"Too many attempts. Please wait {retry_after} seconds before trying again.",
                            "code": "RATE_LIMITED",
                            "retryAfter": retry_after,
                        }
                    ),
                    429,
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator
