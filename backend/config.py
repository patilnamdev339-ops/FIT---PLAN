import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "backend" / ".env")


def build_mysql_uri() -> str:
    """Constructs a safe SQLAlchemy PyMySQL connection URI from environment variables."""
    explicit_url = os.getenv("DATABASE_URL", "").strip()
    if explicit_url:
        # Normalize mysql:// to mysql+pymysql:// for SQLAlchemy
        if explicit_url.startswith("mysql://"):
            explicit_url = explicit_url.replace("mysql://", "mysql+pymysql://", 1)
        # Normalize Aiven's ssl-mode parameter to ssl_mode for PyMySQL
        if "ssl-mode=" in explicit_url:
            explicit_url = explicit_url.replace("ssl-mode=", "ssl_mode=")
        return explicit_url

    host = os.getenv("MYSQL_HOST", "127.0.0.1").strip()
    port = os.getenv("MYSQL_PORT", "3306").strip()
    user = os.getenv("MYSQL_USER", "fitness_app").strip()
    password = os.getenv("MYSQL_PASSWORD", "")
    database = os.getenv("MYSQL_DATABASE", "fitness_planner_db").strip()

    encoded_user = quote_plus(user)
    encoded_pass = quote_plus(password)
    auth_part = f"{encoded_user}:{encoded_pass}" if password else encoded_user

    ssl_flag = ""
    if os.getenv("MYSQL_SSL", "").lower() in ("1", "true", "required") or "aivencloud.com" in host.lower():
        ssl_flag = "&ssl_mode=REQUIRED"

    return f"mysql+pymysql://{auth_part}@{host}:{port}/{database}?charset=utf8mb4{ssl_flag}"


class Config:
    """Base application configuration."""

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "fitplan-dev-secret-key-change-in-production-9f8e7d6c5b4a3210",
    )
    DB_ENGINE = os.getenv("DB_ENGINE", "mysql").strip().lower()
    MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1").strip()
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER = os.getenv("MYSQL_USER", "fitness_app").strip()
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Harsh@123")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "fitness_planner_db").strip()
    STRICT_MYSQL = os.getenv("STRICT_MYSQL", "false").lower() in ("1", "true", "yes")

    SQLITE_PATH = BASE_DIR / "backend" / "database" / "fitplan.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    # Session & Cookie Security
    SESSION_COOKIE_NAME = "fitplan_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() in (
        "1",
        "true",
        "yes",
    )
    PERMANENT_SESSION_LIFETIME = timedelta(
        hours=int(os.getenv("SESSION_LIFETIME_HOURS", "168"))
    )

    # CORS Origins
    FRONTEND_ORIGIN = os.getenv(
        "FRONTEND_ORIGIN",
        "http://localhost:8443,http://127.0.0.1:8443,http://localhost:5173,http://127.0.0.1:5173",
    )
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB max upload payload
