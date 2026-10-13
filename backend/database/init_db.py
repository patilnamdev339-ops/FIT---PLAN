import sys
from pathlib import Path

# Ensure workspace root is in sys.path when executed directly
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pymysql
from backend.config import Config


def test_and_init_mysql(create_schema: bool = True) -> tuple[bool, str]:
    """
    Tests connectivity to the configured MySQL server, creates the database
    if missing, and optionally executes schema.sql.
    """
    try:
        conn = pymysql.connect(
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            charset="utf8mb4",
            connect_timeout=4,
            autocommit=True,
        )
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DATABASE}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
            cursor.execute(f"USE `{Config.MYSQL_DATABASE}`;")

            if create_schema:
                schema_path = Path(__file__).resolve().parent / "schema.sql"
                if schema_path.exists():
                    sql_script = schema_path.read_text(encoding="utf-8")
                    # Execute individual statements safely
                    for statement in sql_script.split(";"):
                        stmt = statement.strip()
                        if stmt and not stmt.upper().startswith("CREATE DATABASE") and not stmt.upper().startswith("USE "):
                            cursor.execute(stmt)
        conn.close()
        return (
            True,
            f"Connected to MySQL at {Config.MYSQL_HOST}:{Config.MYSQL_PORT}/{Config.MYSQL_DATABASE}",
        )
    except Exception as exc:
        return (
            False,
            f"MySQL connection failed ({Config.MYSQL_HOST}:{Config.MYSQL_PORT} as '{Config.MYSQL_USER}'): {exc}",
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
