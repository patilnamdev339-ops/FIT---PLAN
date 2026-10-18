import os
import re
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "backend" / ".env")


def get_ssl_ca_path() -> str | None:
    """
    Returns the resolved path to the MySQL SSL CA certificate file, if available.
    Supports configuration via MYSQL_SSL_CA environment variable with fallbacks
    to standard project locations.
    """
    env_ca = os.getenv("MYSQL_SSL_CA", "").strip()
    candidates: list[Path] = []
    if env_ca:
        p = Path(env_ca)
        if p.is_absolute():
            candidates.append(p)
        else:
            candidates.append(BASE_DIR / p)
            candidates.append(Path.cwd() / p)

    # Standard project fallbacks
    candidates.extend(
        [
            BASE_DIR / "backend" / "certs" / "ca.pem",
            BASE_DIR / "certs" / "ca.pem",
            Path.cwd() / "backend" / "certs" / "ca.pem",
            Path.cwd() / "certs" / "ca.pem",
        ]
    )

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return str(candidate.resolve())
    return None


def build_mysql_uri() -> str:
    """Constructs a safe SQLAlchemy PyMySQL connection URI from environment variables."""
    ca_path = get_ssl_ca_path()
    explicit_url = os.getenv("DATABASE_URL", "").strip()
    if explicit_url:
        # Normalize mysql:// to mysql+pymysql:// for SQLAlchemy
        if explicit_url.startswith("mysql://"):
            explicit_url = explicit_url.replace("mysql://", "mysql+pymysql://", 1)
        # Strip ssl-mode or ssl_mode query parameter as PyMySQL does not take it as a kwarg
        explicit_url = re.sub(r"([?&])ssl[-_]mode=[^&]*", "", explicit_url)
        explicit_url = re.sub(r"\?&", "?", explicit_url)
        explicit_url = re.sub(r"&&+", "&", explicit_url)
        explicit_url = re.sub(r"[?&]$", "", explicit_url)

        # If CA certificate is available and not already in URI, append ssl_ca
        if ca_path and "ssl_ca=" not in explicit_url:
            sep = "&" if "?" in explicit_url else "?"
            explicit_url = f"{explicit_url}{sep}ssl_ca={quote_plus(ca_path)}"
        return explicit_url

    host = os.getenv(
        "MYSQL_HOST", "fitplan-mysql-patilnamdev339-ba47.d.aivencloud.com"
    ).strip()
    port = os.getenv("MYSQL_PORT", "14873").strip()
    user = os.getenv("MYSQL_USER", "avnadmin").strip()
    password = os.getenv("MYSQL_PASSWORD", "")
    database = os.getenv("MYSQL_DATABASE", "defaultdb").strip()

    encoded_user = quote_plus(user)
    encoded_pass = quote_plus(password)
    auth_part = f"{encoded_user}:{encoded_pass}" if password else encoded_user

    ssl_flag = ""
    if ca_path:
        ssl_flag = f"&ssl_ca={quote_plus(ca_path)}"
    elif (
        os.getenv("MYSQL_SSL", "").lower() in ("1", "true", "required")
        or "aivencloud.com" in host.lower()
    ):
        ssl_flag = "&ssl_disabled=0"

    return f"mysql+pymysql://{auth_part}@{host}:{port}/{database}?charset=utf8mb4{ssl_flag}"


class Config:
    """Base application configuration."""

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "fitplan-dev-secret-key-change-in-production-9f8e7d6c5b4a3210",
    )
    DB_ENGINE = os.getenv("DB_ENGINE", "mysql").strip().lower()
    MYSQL_HOST = os.getenv(
        "MYSQL_HOST", "fitplan-mysql-patilnamdev339-ba47.d.aivencloud.com"
    ).strip()
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", "14873"))
    MYSQL_USER = os.getenv("MYSQL_USER", "avnadmin").strip()
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "defaultdb").strip()
    MYSQL_SSL_CA = os.getenv(
        "MYSQL_SSL_CA", str(BASE_DIR / "backend" / "certs" / "ca.pem")
    ).strip()
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
        "https://fitplan-frontend.onrender.com,http://localhost:8443,http://127.0.0.1:8443,http://localhost:5173,http://127.0.0.1:5173",
    )
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB max upload payload

