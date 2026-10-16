import os
import ssl
import sys
import urllib.parse
from pathlib import Path

# Ensure workspace root is in sys.path when executed directly
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pymysql
from backend.config import Config, get_ssl_ca_path


def test_and_init_mysql(create_schema: bool = True) -> tuple[bool, str]:
    """
    Tests connectivity to the configured MySQL server (local or remote/Aiven),
    creates the database if missing and permitted, and executes schema.sql.
    """
    db_url = os.getenv("DATABASE_URL", "").strip()
    host = Config.MYSQL_HOST
    port = Config.MYSQL_PORT
    user = Config.MYSQL_USER
    password = Config.MYSQL_PASSWORD
    database = Config.MYSQL_DATABASE
    ca_path = get_ssl_ca_path()
    use_ssl = bool(ca_path)

    if db_url:
        try:
            clean_url = db_url.replace("mysql+pymysql://", "mysql://", 1)
            parsed = urllib.parse.urlparse(clean_url)
            if parsed.hostname:
                host = parsed.hostname
            if parsed.port:
                port = int(parsed.port)
            if parsed.username:
                user = urllib.parse.unquote(parsed.username)
            if parsed.password:
                password = urllib.parse.unquote(parsed.password)
            path_db = (parsed.path or "").lstrip("/")
            if path_db:
                database = path_db
            if "ssl" in parsed.query.lower() or "aiven" in host.lower():
                use_ssl = True
        except Exception:
            pass

    if "aiven" in host.lower() or os.getenv("MYSQL_SSL", "").lower() in ("1", "true", "required"):
        use_ssl = True

    try:
        connect_kwargs = {
            "host": host,
            "port": int(port),
            "user": user,
            "password": password,
            "charset": "utf8mb4",
            "connect_timeout": 6,
            "autocommit": True,
        }
        if use_ssl or ca_path:
            if ca_path:
                ssl_ctx = ssl.create_default_context(cafile=ca_path)
                ssl_ctx.check_hostname = True
                ssl_ctx.verify_mode = ssl.CERT_REQUIRED
                connect_kwargs["ssl"] = ssl_ctx
            else:
                connect_kwargs["ssl"] = ssl.create_default_context()

        # Try connecting directly to the specified database first
        conn = None
        try:
            conn = pymysql.connect(**connect_kwargs, database=database)
        except pymysql.err.OperationalError as op_err:
            # If database doesn't exist (Error 1049), connect without db and create it
            if op_err.args and op_err.args[0] == 1049:
                conn = pymysql.connect(**connect_kwargs)
                with conn.cursor() as cursor:
                    cursor.execute(
                        f"CREATE DATABASE IF NOT EXISTS `{database}` "
                        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
                    )
                    cursor.execute(f"USE `{database}`;")
            else:
                raise

        with conn.cursor() as cursor:
            if create_schema:
                schema_path = Path(__file__).resolve().parent / "schema.sql"
                if schema_path.exists():
                    sql_script = schema_path.read_text(encoding="utf-8")
                    for statement in sql_script.split(";"):
                        stmt = statement.strip()
                        if (
                            stmt
                            and not stmt.upper().startswith("CREATE DATABASE")
                            and not stmt.upper().startswith("USE ")
                        ):
                            cursor.execute(stmt)
        conn.close()
        return (
            True,
            f"Connected to MySQL at {host}:{port}/{database}",
        )
    except Exception as exc:
        return (
            False,
            f"MySQL connection failed ({host}:{port} as '{user}'): {exc}",
        )


if __name__ == "__main__":
    ok, message = test_and_init_mysql(create_schema=True)
    if ok:
        print(f"[SUCCESS] {message}")
        sys.exit(0)
    else:
        print(f"[ERROR] {message}", file=sys.stderr)
        print(
            "\nTroubleshooting tips:\n"
            "1. Ensure MySQL Server is running on MYSQL_HOST:MYSQL_PORT (default 127.0.0.1:3306).\n"
            "2. Verify MYSQL_USER and MYSQL_PASSWORD in your .env file.\n"
            "3. Or import backend/database/schema.sql directly in MySQL Workbench.",
            file=sys.stderr,
        )
        sys.exit(1)
