"""
FitPlan Production WSGI Entry Point (Root Level).

Enables seamless deployment on Render, Railway, Heroku, or AWS whether
the start command is configured as:
    gunicorn app:app
or:
    gunicorn backend.app:app
"""

import os
from backend.app import app, create_app

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true")
    app.run(host="0.0.0.0", port=port, debug=debug)
