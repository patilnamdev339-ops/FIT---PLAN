import os
import sys
from pathlib import Path

# Ensure project root is in sys.path regardless of whether working directory is '.' or 'backend'
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import json
import logging
import re
import secrets
import urllib.request
import urllib.parse
import urllib.error
from datetime import date, datetime, timedelta, timezone
from flask import Flask, jsonify, request, session, g
from flask_cors import CORS
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from backend.config import Config, build_mysql_uri
from backend.database.init_db import test_and_init_mysql
from backend.models import (
    db,
    User,
    UserProfile,
    FitnessGoalModel,
    DietPlan,
    DietPlanMeal,
    DailyNutritionLog,
    WorkoutPlan,
    WorkoutSession,
    ProgressMeasurement,
    UserSettings,
)
from backend.recommendation import (
    calculate_metrics,
    generate_diet_plan,
    generate_workout_plan,
    FOODS,
    EXERCISES,
)
from backend.security import (
    hash_password,
    verify_password,
    generate_auth_token,
    require_auth,
    rate_limit,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("fitplan.backend")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

VALID_GOALS = {
    "fatLoss",
    "cutting",
    "muscleGain",
    "leanBulk",
    "recomposition",
    "maintenance",
    "generalFitness",
}
VALID_ACTIVITY_LEVELS = {"sedentary", "light", "moderate", "active", "veryActive"}
VALID_DIET_TYPES = {"vegetarian", "eggetarian", "nonVegetarian"}
VALID_LOCATIONS = {"home", "gym"}
VALID_EXPERIENCE = {"beginner", "intermediate", "advanced"}
VALID_AVATARS = {
    "male_athlete",
    "male_runner",
    "male_lifter",
    " male_yogi".strip(),
    "female_athlete",
    "female_runner",
    "female_lifter",
    "female_yogi",
}


def _configure_database(app: Flask, test_config: dict | None = None) -> None:
    """Configures SQLAlchemy to use MySQL (or SQLite in test/local fallback mode)."""
    if test_config and "SQLALCHEMY_DATABASE_URI" in test_config:
        app.config["SQLALCHEMY_DATABASE_URI"] = test_config["SQLALCHEMY_DATABASE_URI"]
        app.config["ACTIVE_DB_ENGINE"] = "sqlite_test"
        return

    if Config.DB_ENGINE == "sqlite":
        Config.SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{Config.SQLITE_PATH}"
        app.config["ACTIVE_DB_ENGINE"] = "sqlite"
        app.config["MYSQL_STATUS_MESSAGE"] = "Configured for local SQLite (DB_ENGINE=sqlite)"
        return

    # Test MySQL connection and auto-create database/schema if reachable
    mysql_ok, mysql_msg = test_and_init_mysql(create_schema=True)
    app.config["MYSQL_STATUS_MESSAGE"] = mysql_msg

    if mysql_ok:
        app.config["SQLALCHEMY_DATABASE_URI"] = build_mysql_uri()
        app.config["ACTIVE_DB_ENGINE"] = "mysql"
        logger.info("Database connected: %s", mysql_msg)
    else:
        if Config.STRICT_MYSQL:
            logger.error("STRICT_MYSQL is enabled and MySQL is unreachable: %s", mysql_msg)
            raise RuntimeError(mysql_msg)

        logger.warning(
            "%s — Falling back to local persistent SQLAlchemy database at %s so the app remains usable. "
            "Configure MySQL in .env to switch to MySQL Server.",
            mysql_msg,
            Config.SQLITE_PATH,
        )
        Config.SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{Config.SQLITE_PATH}"
        app.config["ACTIVE_DB_ENGINE"] = "sqlite_fallback"


def _save_diet_plan_meals(user_id: int, diet_type: str, metrics: dict, meals_data: list[dict]) -> None:
    """Replaces the active diet plan meals for the user."""
    active_plan = (
        DietPlan.query.filter_by(user_id=user_id, is_active=True)
        .order_by(DietPlan.id.desc())
        .first()
    )
    if not active_plan:
        active_plan = DietPlan(
            user_id=user_id,
            plan_name="Personalized Nutrition Plan",
            diet_type=diet_type,
            target_calories=int(metrics.get("calorieTarget", 2000)),
            target_protein_g=int(metrics.get("proteinTarget", 130)),
            target_carbs_g=int(metrics.get("carbTarget", 220)),
            target_fat_g=int(metrics.get("fatTarget", 60)),
            is_active=True,
        )
        db.session.add(active_plan)
        db.session.flush()
    else:
        active_plan.diet_type = diet_type
        active_plan.target_calories = int(metrics.get("calorieTarget", 2000))
        active_plan.target_protein_g = int(metrics.get("proteinTarget", 130))
        active_plan.target_carbs_g = int(metrics.get("carbTarget", 220))
        active_plan.target_fat_g = int(metrics.get("fatTarget", 60))
        DietPlanMeal.query.filter_by(diet_plan_id=active_plan.id).delete()
        db.session.flush()

    for idx, meal in enumerate(meals_data):
        foods_list = meal.get("foods", [])
        meal_row = DietPlanMeal(
            diet_plan_id=active_plan.id,
            meal_name=str(meal.get("mealName", f"Meal {idx + 1}"))[:100],
            meal_order=idx,
            foods_json=json.dumps(foods_list),
            total_calories=int(round(float(meal.get("totalCalories", 0)))),
            total_protein_g=round(float(meal.get("totalProtein", 0)), 1),
            total_carbs_g=round(float(meal.get("totalCarbs", 0)), 1),
            total_fat_g=round(float(meal.get("totalFat", 0)), 1),
        )
        db.session.add(meal_row)


def _save_workout_plan(user_id: int, location: str, days_per_week: int, duration_min: int, schedule: list[dict]) -> None:
    """Updates or creates the user's active workout plan."""
    plan = (
        WorkoutPlan.query.filter_by(user_id=user_id, is_active=True)
        .order_by(WorkoutPlan.id.desc())
        .first()
    )
    if not plan:
        plan = WorkoutPlan(
            user_id=user_id,
            plan_name="Personalized Training Split",
            workout_location=location,
            days_per_week=days_per_week,
            duration_min=duration_min,
            is_active=True,
        )
        plan.schedule = schedule
        db.session.add(plan)
    else:
        plan.workout_location = location
        plan.days_per_week = days_per_week
        plan.duration_min = duration_min
        plan.schedule = schedule


def build_user_bundle(user: User) -> dict:
    """Assembles the complete state bundle for an authenticated user."""
    profile = user.profile
    active_goal_row = (
        FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True)
        .order_by(FitnessGoalModel.id.desc())
        .first()
    )
    settings = user.settings
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.session.add(settings)
        db.session.commit()

    has_completed_assessment = bool(profile and profile.assessment_completed)
    goal_name = active_goal_row.fitness_goal if active_goal_row else "generalFitness"

    assessment_dict = (
        profile.to_assessment_dict(active_goal=goal_name)
        if has_completed_assessment
        else None
    )
    metrics_dict = (
        active_goal_row.to_metrics_dict()
        if (has_completed_assessment and active_goal_row)
        else None
    )

    active_diet = (
        DietPlan.query.filter_by(user_id=user.id, is_active=True)
        .order_by(DietPlan.id.desc())
        .first()
    )
    meals_list = [m.to_dict() for m in active_diet.meals] if active_diet else []

    active_workout = (
        WorkoutPlan.query.filter_by(user_id=user.id, is_active=True)
        .order_by(WorkoutPlan.id.desc())
        .first()
    )
    workout_schedule = active_workout.schedule if active_workout else []

    progress_rows = (
        ProgressMeasurement.query.filter_by(user_id=user.id)
        .order_by(ProgressMeasurement.recorded_date.asc(), ProgressMeasurement.id.asc())
        .all()
    )
    progress_list = [p.to_dict() for p in progress_rows]

    today_logs = (
        DailyNutritionLog.query.filter_by(user_id=user.id, log_date=date.today())
        .order_by(DailyNutritionLog.id.asc())
        .all()
    )
    nutrition_logs_list = [l.to_dict() for l in today_logs]

    workout_sessions_rows = (
        WorkoutSession.query.filter_by(user_id=user.id)
        .order_by(WorkoutSession.session_date.desc(), WorkoutSession.id.desc())
        .limit(50)
        .all()
    )
    workout_sessions_list = [ws.to_dict() for ws in workout_sessions_rows]

    return {
        "user": user.to_dict(),
        "initialGoal": goal_name,
        "assessment": assessment_dict,
        "metrics": metrics_dict,
        "meals": meals_list,
        "nutritionLogs": nutrition_logs_list,
        "workoutPlan": workout_schedule,
        "workoutSessions": workout_sessions_list,
        "progress": progress_list,
        "settings": settings.to_dict(),
    }


class ApiPrefixMiddleware:
    """WSGI middleware ensuring requests to standard endpoints with or without /api are handled."""

    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
        api_prefixes = (
            "/auth",
            "/health",
            "/assessment",
            "/recommendations",
            "/diet",
            "/workout",
            "/progress",
            "/profile",
            "/settings",
        )
        if any(path == p or path.startswith(f"{p}/") for p in api_prefixes):
            environ["PATH_INFO"] = f"/api{path}"
        return self.wsgi_app(environ, start_response)


def create_app(test_config: dict | None = None) -> Flask:
    """Application factory for the FitPlan Flask backend."""
    app = Flask(__name__)
    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    _configure_database(app, test_config)

    app.wsgi_app = ApiPrefixMiddleware(app.wsgi_app)

    configured_origins = [
        o.strip()
        for o in app.config.get("FRONTEND_ORIGIN", "").split(",")
        if o.strip()
    ]
    default_origins = [
        "https://fitplan-frontend.onrender.com",
        r"https://.*\.onrender\.com",
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    for d in default_origins:
        if d not in configured_origins:
            configured_origins.append(d)

    CORS(
        app,
        resources={r"/*": {"origins": configured_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    db.init_app(app)

    with app.app_context():
        db.create_all()

    # -------------------------------------------------------------------------
    # Global Error Handlers
    # -------------------------------------------------------------------------
    @app.errorhandler(400)
    def handle_400(err):
        return jsonify({"error": getattr(err, "description", "Bad request.")}), 400

    @app.errorhandler(404)
    def handle_404(_err):
        return jsonify({"error": "The requested API endpoint was not found."}), 404

    @app.errorhandler(413)
    def handle_413(_err):
        return jsonify({"error": "Uploaded payload is too large (max 10 MB)."}), 413

    @app.errorhandler(500)
    def handle_500(err):
        logger.exception("Unhandled server error: %s", err)
        db.session.rollback()
        return jsonify({"error": "An internal server error occurred. Please try again."}), 500

    # -------------------------------------------------------------------------
    # Health & Diagnostics Endpoint
    # -------------------------------------------------------------------------
    @app.get("/api/health")
    def health_check():
        db_connected = False
        try:
            db.session.execute(text("SELECT 1"))
            db_connected = True
        except Exception as exc:
            logger.error("Health check DB ping failed: %s", exc)

        return jsonify(
            {
                "status": "ok" if db_connected else "degraded",
                "service": "fitplan-backend",
                "database": {
                    "connected": db_connected,
                    "engine": app.config.get("ACTIVE_DB_ENGINE", "unknown"),
                    "mysqlHost": Config.MYSQL_HOST,
                    "mysqlDatabase": Config.MYSQL_DATABASE,
                    "statusMessage": app.config.get("MYSQL_STATUS_MESSAGE", ""),
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ), (200 if db_connected else 503)

    # -------------------------------------------------------------------------
    # Reference Catalog Endpoints
    # -------------------------------------------------------------------------
    @app.get("/api/catalog")
    def get_catalog():
        return jsonify({"foods": FOODS, "exercises": EXERCISES})

    # -------------------------------------------------------------------------
    # Authentication Endpoints
    # -------------------------------------------------------------------------
    @app.post("/api/auth/register")
    @rate_limit(max_requests=15, window_seconds=60)
    def register():
        data = request.get_json(silent=True) or {}
        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        confirm = str(data.get("confirm", data.get("confirmPassword", password)))
        initial_goal = str(data.get("initialGoal", "generalFitness")).strip()
        gender = str(data.get("gender", "male")).strip().lower()

        if not name or len(name) < 2 or len(name) > 120:
            return jsonify({"error": "Please enter your full name (2–120 characters)."}), 400
        if not email or not EMAIL_REGEX.match(email):
            return jsonify({"error": "Please enter a valid email address."}), 400
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long."}), 400
        if password != confirm:
            return jsonify({"error": "Passwords do not match."}), 400
        if initial_goal not in VALID_GOALS:
            initial_goal = "generalFitness"
        if gender not in ("male", "female"):
            gender = "male"

        existing = User.query.filter_by(email=email).first()
        if existing:
            return (
                jsonify(
                    {
                        "error": "An account with this email address already exists. Please log in instead.",
                        "code": "DUPLICATE_EMAIL",
                    }
                ),
                409,
            )

        try:
            pw_hash = hash_password(password)
            default_avatar = "female_athlete" if gender == "female" else "male_athlete"

            user = User(full_name=name, email=email, password_hash=pw_hash, is_active=True)
            db.session.add(user)
            db.session.flush()

            profile = UserProfile(
                user_id=user.id,
                gender=gender,
                avatar_id=default_avatar,
                assessment_completed=False,
            )
            goal = FitnessGoalModel(
                user_id=user.id,
                fitness_goal=initial_goal,
                is_active=True,
            )
            settings = UserSettings(user_id=user.id)

            db.session.add_all([profile, goal, settings])
            db.session.commit()

            session.clear()
            session["user_id"] = user.id
            session.permanent = True

            token = generate_auth_token(user.id)
            bundle = build_user_bundle(user)
            bundle["token"] = token
            return jsonify(bundle), 201

        except IntegrityError:
            db.session.rollback()
            return (
                jsonify({"error": "An account with this email address already exists."}),
                409,
            )
        except SQLAlchemyError as exc:
            db.session.rollback()
            logger.error("Database error during registration: %s", exc)
            return jsonify({"error": "Could not create account due to a database error."}), 500

    @app.post("/api/auth/login")
    @rate_limit(max_requests=15, window_seconds=60)
    def login():
        data = request.get_json(silent=True) or {}
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))

        if not email or not password:
            return jsonify({"error": "Please enter both email and password."}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return (
                jsonify(
                    {
                        "error": "Invalid email or password. Please check your credentials and try again.",
                        "code": "INVALID_CREDENTIALS",
                    }
                ),
                401,
            )

        if not user.is_active:
            return jsonify({"error": "This account has been deactivated."}), 403

        session.clear()
        session["user_id"] = user.id
        session.permanent = True

        token = generate_auth_token(user.id)
        bundle = build_user_bundle(user)
        bundle["token"] = token
        return jsonify(bundle), 200

    @app.post("/api/auth/firebase")
    @rate_limit(max_requests=25, window_seconds=60)
    def firebase_auth():
        data = request.get_json(silent=True) or {}
        id_token_str = str(data.get("idToken", "")).strip()
        client_name = str(data.get("name", "")).strip()
        client_email = str(data.get("email", "")).strip().lower()
        gender = str(data.get("gender", "male")).strip().lower()
        initial_goal = str(data.get("initialGoal", "generalFitness")).strip()

        if not id_token_str:
            return jsonify({"error": "Missing Firebase ID token."}), 400

        verified_email = None
        verified_name = None

        # Verify ID token with Google tokeninfo endpoint
        try:
            req_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(id_token_str)}"
            req = urllib.request.Request(req_url, headers={"User-Agent": "FitPlan-Server/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    token_info = json.loads(resp.read().decode("utf-8"))
                    verified_email = token_info.get("email")
                    verified_name = token_info.get("name") or token_info.get("email", "").split("@")[0]
        except Exception as exc:
            logger.warning("Google tokeninfo verification failed or offline: %s", exc)

        email = (verified_email or client_email).strip().lower()
        name = (verified_name or client_name or (email.split("@")[0] if email else "Athlete")).strip()

        if not email or not EMAIL_REGEX.match(email):
            return jsonify({"error": "A valid email address could not be verified from Firebase."}), 400

        goal_aliases = {
            "weightloss": "fatLoss",
            "weight_loss": "fatLoss",
            "musclegain": "muscleGain",
            "muscle_gain": "muscleGain",
            "leanbulk": "leanBulk",
            "lean_bulk": "leanBulk",
            "generalfitness": "generalFitness",
            "general_fitness": "generalFitness",
        }
        initial_goal = goal_aliases.get(initial_goal.lower(), initial_goal)
        if initial_goal not in VALID_GOALS:
            initial_goal = "generalFitness"
        if gender not in ("male", "female"):
            gender = "male"

        user = User.query.filter_by(email=email).first()
        if not user:
            # Create user account linked to Firebase identity
            random_pw = hash_password(secrets.token_urlsafe(32))
            default_avatar = "female_athlete" if gender == "female" else "male_athlete"

            user = User(
                full_name=name or "Athlete",
                email=email,
                password_hash=random_pw,
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()

            profile = UserProfile(
                user_id=user.id,
                gender=gender,
                avatar_id=default_avatar,
                assessment_completed=False,
            )
            goal = FitnessGoalModel(
                user_id=user.id,
                fitness_goal=initial_goal,
                is_active=True,
            )
            user_settings = UserSettings(user_id=user.id)

            db.session.add_all([profile, goal, user_settings])
            db.session.commit()
            logger.info("Created new user %d (%s) via Firebase authentication", user.id, user.email)
        else:
            if not user.is_active:
                return jsonify({"error": "This account has been deactivated."}), 403
            
            # Update name if previously empty
            if (not user.full_name or user.full_name == "Athlete") and name:
                user.full_name = name
                
            # Ensure related records exist
            if not user.profile:
                db.session.add(UserProfile(user_id=user.id, gender=gender, avatar_id="male_athlete"))
            active_goal = FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True).first()
            if not active_goal:
                db.session.add(FitnessGoalModel(user_id=user.id, fitness_goal=initial_goal, is_active=True))
            if not user.settings:
                db.session.add(UserSettings(user_id=user.id))
            db.session.commit()

        session.clear()
        session["user_id"] = user.id
        session.permanent = True

        token = generate_auth_token(user.id)
        bundle = build_user_bundle(user)
        bundle["token"] = token
        return jsonify(bundle), 200

    @app.post("/api/auth/logout")
    def logout():
        session.clear()
        response = jsonify({"message": "Logged out successfully."})
        response.delete_cookie(app.config.get("SESSION_COOKIE_NAME", "fitplan_session"))
        return response, 200

    @app.get("/api/auth/me")
    @require_auth
    def get_me():
        user: User = g.current_user
        return jsonify(build_user_bundle(user)), 200

    @app.put("/api/auth/password")
    @require_auth
    def update_password():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}
        current_pw = str(data.get("currentPassword", ""))
        new_pw = str(data.get("newPassword", ""))
        confirm_pw = str(data.get("confirmPassword", new_pw))

        if not verify_password(current_pw, user.password_hash):
            return jsonify({"error": "Your current password is incorrect."}), 400
        if len(new_pw) < 8:
            return jsonify({"error": "New password must be at least 8 characters long."}), 400
        if new_pw != confirm_pw:
            return jsonify({"error": "New passwords do not match."}), 400

        user.password_hash = hash_password(new_pw)
        db.session.commit()
        return jsonify({"message": "Password updated successfully."}), 200

    # -------------------------------------------------------------------------
    # Assessment & Profile Endpoints
    # -------------------------------------------------------------------------
    @app.post("/api/assessment")
    @require_auth
    def submit_assessment():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}

        try:
            age = int(data.get("age", 25))
            height = float(data.get("height", 170))
            weight = float(data.get("weight", 70))
            waist_raw = data.get("waist")
            waist = float(waist_raw) if waist_raw not in (None, "", 0) else None
            workout_days = int(data.get("workoutDaysPerWeek", 4))
            workout_duration = int(data.get("workoutDuration", 60))
            meals_per_day = int(data.get("mealsPerDay", 3))
        except (ValueError, TypeError):
            return jsonify({"error": "Numeric fields (age, height, weight) must be valid numbers."}), 400

        if not (15 <= age <= 100):
            return jsonify({"error": "Age must be between 15 and 100 years."}), 400
        if not (100 <= height <= 260):
            return jsonify({"error": "Height must be between 100 cm and 260 cm."}), 400
        if not (30 <= weight <= 350):
            return jsonify({"error": "Weight must be between 30 kg and 350 kg."}), 400
        if waist is not None and not (40 <= waist <= 220):
            return jsonify({"error": "Waist circumference must be between 40 cm and 220 cm."}), 400

        gender = str(data.get("gender", "male")).strip()
        if gender not in ("male", "female"):
            return jsonify({"error": "Gender must be 'male' or 'female'."}), 400

        activity_level = str(data.get("activityLevel", "moderate")).strip()
        if activity_level not in VALID_ACTIVITY_LEVELS:
            return jsonify({"error": "Invalid activity level."}), 400

        fitness_goal = str(data.get("fitnessGoal", "generalFitness")).strip()
        if fitness_goal not in VALID_GOALS:
            return jsonify({"error": "Invalid fitness goal."}), 400

        experience_level = str(data.get("experienceLevel", "beginner")).strip()
        if experience_level not in VALID_EXPERIENCE:
            experience_level = "beginner"

        workout_location = str(data.get("workoutLocation", "gym")).strip()
        if workout_location not in VALID_LOCATIONS:
            workout_location = "gym"

        diet_type = str(data.get("dietType", "nonVegetarian")).strip()
        if diet_type not in VALID_DIET_TYPES:
            diet_type = "nonVegetarian"

        workout_days = max(2, min(6, workout_days))
        workout_duration = max(15, min(180, workout_duration))
        meals_per_day = max(2, min(6, meals_per_day))

        equipment = data.get("equipment") if isinstance(data.get("equipment"), list) else []
        food_prefs = data.get("foodPreferences") if isinstance(data.get("foodPreferences"), list) else []
        avatar_id = str(data.get("avatarId", "")).strip()

        profile = user.profile
        if not profile:
            profile = UserProfile(user_id=user.id)
            db.session.add(profile)

        profile.age = age
        profile.gender = gender
        if avatar_id in VALID_AVATARS:
            profile.avatar_id = avatar_id
        elif not profile.avatar_id or (gender == "female" and profile.avatar_id.startswith("male_")) or (gender == "male" and profile.avatar_id.startswith("female_")):
            profile.avatar_id = "female_athlete" if gender == "female" else "male_athlete"

        profile.height_cm = height
        profile.weight_kg = weight
        profile.waist_cm = waist
        profile.activity_level = activity_level
        profile.experience_level = experience_level
        profile.workout_location = workout_location
        profile.equipment = [str(x) for x in equipment[:20]]
        profile.workout_days_per_week = workout_days
        profile.workout_duration_min = workout_duration
        profile.diet_type = diet_type
        profile.meals_per_day = meals_per_day
        profile.food_preferences = [str(x) for x in food_prefs[:30]]
        profile.assessment_completed = True

        assessment_payload = profile.to_assessment_dict(active_goal=fitness_goal)
        metrics = calculate_metrics(assessment_payload)

        active_goal = (
            FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True)
            .order_by(FitnessGoalModel.id.desc())
            .first()
        )
        if not active_goal:
            active_goal = FitnessGoalModel(user_id=user.id, is_active=True)
            db.session.add(active_goal)

        active_goal.fitness_goal = fitness_goal
        active_goal.bmi = metrics["bmi"]
        active_goal.bmi_category = metrics["bmiCategory"]
        active_goal.bmr = metrics["bmr"]
        active_goal.tdee = metrics["tdee"]
        active_goal.calorie_target = metrics["calorieTarget"]
        active_goal.protein_target_g = metrics["proteinTarget"]
        active_goal.carb_target_g = metrics["carbTarget"]
        active_goal.fat_target_g = metrics["fatTarget"]
        active_goal.is_custom_targets = False

        generated_meals = generate_diet_plan(assessment_payload, metrics)
        _save_diet_plan_meals(user.id, diet_type, metrics, generated_meals)

        generated_workout = generate_workout_plan(assessment_payload)
        _save_workout_plan(user.id, workout_location, workout_days, workout_duration, generated_workout)

        # Record baseline progress measurement if user has no entries yet
        existing_progress_count = ProgressMeasurement.query.filter_by(user_id=user.id).count()
        if existing_progress_count == 0:
            baseline = ProgressMeasurement(
                user_id=user.id,
                recorded_date=date.today(),
                weight_kg=weight,
                waist_cm=waist,
                workout_completed=False,
                notes="Initial assessment baseline",
            )
            db.session.add(baseline)

        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    @app.put("/api/profile")
    @require_auth
    def update_profile():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}

        if "name" in data:
            new_name = str(data["name"]).strip()
            if len(new_name) < 2 or len(new_name) > 120:
                return jsonify({"error": "Name must be between 2 and 120 characters."}), 400
            user.full_name = new_name

        profile = user.profile
        if not profile:
            profile = UserProfile(user_id=user.id, assessment_completed=True)
            db.session.add(profile)

        if "avatarId" in data and str(data["avatarId"]) in VALID_AVATARS:
            profile.avatar_id = str(data["avatarId"])
        if "gender" in data and data["gender"] in ("male", "female"):
            profile.gender = data["gender"]
        if "age" in data:
            age = int(data["age"])
            if not (15 <= age <= 100):
                return jsonify({"error": "Age must be between 15 and 100."}), 400
            profile.age = age
        if "height" in data:
            height = float(data["height"])
            if not (100 <= height <= 260):
                return jsonify({"error": "Height must be between 100 and 260 cm."}), 400
            profile.height_cm = height
        if "weight" in data:
            weight = float(data["weight"])
            if not (30 <= weight <= 350):
                return jsonify({"error": "Weight must be between 30 and 350 kg."}), 400
            profile.weight_kg = weight
        if "waist" in data:
            waist_val = data["waist"]
            profile.waist_cm = float(waist_val) if waist_val not in (None, "", 0) else None
        if "activityLevel" in data and data["activityLevel"] in VALID_ACTIVITY_LEVELS:
            profile.activity_level = data["activityLevel"]
        if "dietType" in data and data["dietType"] in VALID_DIET_TYPES:
            profile.diet_type = data["dietType"]
        if "workoutLocation" in data and data["workoutLocation"] in VALID_LOCATIONS:
            profile.workout_location = data["workoutLocation"]
        if "workoutDaysPerWeek" in data:
            profile.workout_days_per_week = max(2, min(6, int(data["workoutDaysPerWeek"])))
        if "workoutDuration" in data:
            profile.workout_duration_min = max(15, min(180, int(data["workoutDuration"])))
        if "mealsPerDay" in data:
            profile.meals_per_day = max(2, min(6, int(data["mealsPerDay"])))

        active_goal = (
            FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True)
            .order_by(FitnessGoalModel.id.desc())
            .first()
        )
        if not active_goal:
            active_goal = FitnessGoalModel(user_id=user.id, is_active=True)
            db.session.add(active_goal)

        if "fitnessGoal" in data and data["fitnessGoal"] in VALID_GOALS:
            active_goal.fitness_goal = data["fitnessGoal"]

        assessment_payload = profile.to_assessment_dict(active_goal=active_goal.fitness_goal)
        calc = calculate_metrics(assessment_payload)
        active_goal.bmi = calc["bmi"]
        active_goal.bmi_category = calc["bmiCategory"]
        active_goal.bmr = calc["bmr"]
        active_goal.tdee = calc["tdee"]

        if not active_goal.is_custom_targets or data.get("recalculateTargets", False):
            active_goal.calorie_target = calc["calorieTarget"]
            active_goal.protein_target_g = calc["proteinTarget"]
            active_goal.carb_target_g = calc["carbTarget"]
            active_goal.fat_target_g = calc["fatTarget"]
            active_goal.is_custom_targets = False

        if data.get("regeneratePlans", False):
            metrics_dict = active_goal.to_metrics_dict()
            new_meals = generate_diet_plan(assessment_payload, metrics_dict)
            _save_diet_plan_meals(user.id, profile.diet_type, metrics_dict, new_meals)
            new_workout = generate_workout_plan(assessment_payload)
            _save_workout_plan(
                user.id,
                profile.workout_location,
                profile.workout_days_per_week,
                profile.workout_duration_min,
                new_workout,
            )

        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    @app.put("/api/targets")
    @require_auth
    def update_nutrition_targets():
        """Allows users to edit or reset their daily calorie and macronutrient targets."""
        user: User = g.current_user
        data = request.get_json(silent=True) or {}

        profile = user.profile
        active_goal = (
            FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True)
            .order_by(FitnessGoalModel.id.desc())
            .first()
        )
        if not profile or not active_goal:
            return jsonify({"error": "Please complete your fitness assessment first."}), 400

        if data.get("resetToCalculated"):
            assessment_payload = profile.to_assessment_dict(active_goal=active_goal.fitness_goal)
            calc = calculate_metrics(assessment_payload)
            active_goal.calorie_target = calc["calorieTarget"]
            active_goal.protein_target_g = calc["proteinTarget"]
            active_goal.carb_target_g = calc["carbTarget"]
            active_goal.fat_target_g = calc["fatTarget"]
            active_goal.is_custom_targets = False
        else:
            try:
                calories = int(data.get("calorieTarget", active_goal.calorie_target))
                protein = int(data.get("proteinTarget", active_goal.protein_target_g))
                carbs = int(data.get("carbTarget", active_goal.carb_target_g))
                fat = int(data.get("fatTarget", active_goal.fat_target_g))
            except (ValueError, TypeError):
                return jsonify({"error": "Targets must be valid whole numbers."}), 400

            if not (1000 <= calories <= 8000):
                return jsonify({"error": "Daily calories must be between 1,000 and 8,000 kcal."}), 400
            if not (20 <= protein <= 500) or not (0 <= carbs <= 1000) or not (10 <= fat <= 350):
                return jsonify({"error": "Macronutrient targets are outside safe ranges."}), 400

            active_goal.calorie_target = calories
            active_goal.protein_target_g = protein
            active_goal.carb_target_g = carbs
            active_goal.fat_target_g = fat
            active_goal.is_custom_targets = True

        if "targetWeight" in data:
            tw = data["targetWeight"]
            active_goal.target_weight_kg = float(tw) if tw not in (None, "", 0) else None

        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    # -------------------------------------------------------------------------
    # Diet Plan & Daily Nutrition Log Endpoints
    # -------------------------------------------------------------------------
    @app.put("/api/diet/meals")
    @require_auth
    def save_meals():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}
        meals = data.get("meals")
        if not isinstance(meals, list):
            return jsonify({"error": "Expected a list of meals."}), 400

        profile = user.profile
        active_goal = (
            FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True)
            .order_by(FitnessGoalModel.id.desc())
            .first()
        )
        diet_type = profile.diet_type if profile else "nonVegetarian"
        metrics_dict = active_goal.to_metrics_dict() if active_goal else {}

        _save_diet_plan_meals(user.id, diet_type, metrics_dict, meals)
        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    @app.post("/api/diet/regenerate")
    @require_auth
    def regenerate_diet():
        user: User = g.current_user
        profile = user.profile
        active_goal = (
            FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True)
            .order_by(FitnessGoalModel.id.desc())
            .first()
        )
        if not profile or not active_goal:
            return jsonify({"error": "Assessment not found."}), 400

        assessment_payload = profile.to_assessment_dict(active_goal=active_goal.fitness_goal)
        metrics_dict = active_goal.to_metrics_dict()
        meals = generate_diet_plan(assessment_payload, metrics_dict)
        _save_diet_plan_meals(user.id, profile.diet_type, metrics_dict, meals)
        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    @app.get("/api/nutrition-logs")
    @require_auth
    def get_nutrition_logs():
        user: User = g.current_user
        date_str = request.args.get("date")
        try:
            target_date = date.fromisoformat(date_str) if date_str else date.today()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

        logs = (
            DailyNutritionLog.query.filter_by(user_id=user.id, log_date=target_date)
            .order_by(DailyNutritionLog.id.asc())
            .all()
        )
        return jsonify({"date": target_date.isoformat(), "logs": [l.to_dict() for l in logs]}), 200

    @app.post("/api/nutrition-logs")
    @require_auth
    def add_nutrition_log():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}

        # Support logging either a single food item or a batch of items (e.g. "Log Entire Meal")
        items = data.get("items")
        date_str = data.get("logDate")
        try:
            log_date = date.fromisoformat(date_str) if date_str else date.today()
        except ValueError:
            log_date = date.today()

        if isinstance(items, list) and len(items) > 0:
            for item in items:
                food_name = str(item.get("foodName", "")).strip()
                if not food_name:
                    continue
                entry = DailyNutritionLog(
                    user_id=user.id,
                    log_date=log_date,
                    meal_name=str(item.get("mealName", data.get("mealName", "Meal"))).strip()[:100],
                    food_name=food_name[:150],
                    serving_size=str(item.get("servingSize", "1 serving")).strip()[:80],
                    quantity=max(0.1, float(item.get("quantity", 1.0))),
                    calories=max(0, int(round(float(item.get("calories", 0))))),
                    protein_g=max(0.0, round(float(item.get("protein", 0)), 1)),
                    carbs_g=max(0.0, round(float(item.get("carbs", 0)), 1)),
                    fat_g=max(0.0, round(float(item.get("fat", 0)), 1)),
                )
                db.session.add(entry)
        else:
            food_name = str(data.get("foodName", "")).strip()
            if not food_name:
                return jsonify({"error": "Food name is required."}), 400
            entry = DailyNutritionLog(
                user_id=user.id,
                log_date=log_date,
                meal_name=str(data.get("mealName", "Meal")).strip()[:100],
                food_name=food_name[:150],
                serving_size=str(data.get("servingSize", "1 serving")).strip()[:80],
                quantity=max(0.1, float(data.get("quantity", 1.0))),
                calories=max(0, int(round(float(data.get("calories", 0))))),
                protein_g=max(0.0, round(float(data.get("protein", 0)), 1)),
                carbs_g=max(0.0, round(float(data.get("carbs", 0)), 1)),
                fat_g=max(0.0, round(float(data.get("fat", 0)), 1)),
            )
            db.session.add(entry)

        db.session.commit()
        logs = (
            DailyNutritionLog.query.filter_by(user_id=user.id, log_date=log_date)
            .order_by(DailyNutritionLog.id.asc())
            .all()
        )
        return jsonify({"nutritionLogs": [l.to_dict() for l in logs]}), 201

    @app.delete("/api/nutrition-logs/<int:log_id>")
    @require_auth
    def delete_nutrition_log(log_id: int):
        user: User = g.current_user
        log_entry = db.session.get(DailyNutritionLog, log_id)
        if not log_entry or log_entry.user_id != user.id:
            return jsonify({"error": "Nutrition log entry not found."}), 404

        target_date = log_entry.log_date
        db.session.delete(log_entry)
        db.session.commit()

        logs = (
            DailyNutritionLog.query.filter_by(user_id=user.id, log_date=target_date)
            .order_by(DailyNutritionLog.id.asc())
            .all()
        )
        return jsonify({"nutritionLogs": [l.to_dict() for l in logs]}), 200

    @app.post("/api/diet/analyze-image")
    @require_auth
    def analyze_food_image():
        """
        Analyzes a meal photo using OpenAI Vision if OPENAI_API_KEY is configured,
        or provides an editable rule-based template based on the user's diet type
        so the scanner remains usable without external paid keys.
        """
        data = request.get_json(silent=True) or {}
        image = data.get("image", "")
        if not isinstance(image, str) or not image.startswith("data:image/"):
            return jsonify({"error": "Please upload a valid JPEG, PNG, or WebP image."}), 400

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            try:
                req_body = json.dumps(
                    {
                        "model": "gpt-4o-mini",
                        "temperature": 0.2,
                        "max_tokens": 1000,
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are a nutrition assistant. Return JSON with 'mealName' (string) "
                                    "and 'foods' (array of objects with name, servingSize, calories, protein, carbs, fat)."
                                ),
                            },
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Estimate the foods and macros in this meal photo."},
                                    {"type": "image_url", "image_url": {"url": image, "detail": "low"}},
                                ],
                            },
                        ],
                    }
                ).encode("utf-8")
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=req_body,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    content = resp_data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    return jsonify(parsed), 200
            except Exception as exc:
                logger.warning("OpenAI image analysis failed, using smart template fallback: %s", exc)

        # Smart editable template based on user's diet preference
        user: User = g.current_user
        diet_type = user.profile.diet_type if user.profile else "nonVegetarian"
        if diet_type == "vegetarian":
            foods = [
                {"name": "Paneer Bhurji / Curry", "servingSize": "100g", "calories": 265, "protein": 18, "carbs": 3, "fat": 20},
                {"name": "Whole Wheat Roti", "servingSize": "2 rotis (60g)", "calories": 120, "protein": 4, "carbs": 22, "fat": 2.5},
                {"name": "Mixed Vegetable Side", "servingSize": "1 cup (150g)", "calories": 72, "protein": 3, "carbs": 13, "fat": 0.5},
            ]
        elif diet_type == "eggetarian":
            foods = [
                {"name": "Boiled / Scrambled Eggs", "servingSize": "2 eggs (100g)", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11},
                {"name": "Whole Wheat Roti", "servingSize": "2 rotis (60g)", "calories": 120, "protein": 4, "carbs": 22, "fat": 2.5},
                {"name": "Dal Tadka", "servingSize": "1 cup (198g)", "calories": 116, "protein": 9, "carbs": 20, "fat": 0.4},
            ]
        else:
            foods = [
                {"name": "Grilled Chicken Breast", "servingSize": "150g", "calories": 248, "protein": 46.5, "carbs": 0, "fat": 5.4},
                {"name": "Steamed Rice", "servingSize": "1 cup (186g)", "calories": 206, "protein": 4, "carbs": 45, "fat": 0.4},
                {"name": "Mixed Vegetables", "servingSize": "1 cup (150g)", "calories": 72, "protein": 3, "carbs": 13, "fat": 0.5},
            ]

        return jsonify(
            {
                "mealName": "Scanned Plate (Review & Customize)",
                "foods": foods,
                "note": "Estimated plate template loaded. Adjust food names, portions, and macros before saving.",
            }
        ), 200

    # -------------------------------------------------------------------------
    # Workout Plan & Workout Sessions Endpoints
    # -------------------------------------------------------------------------
    @app.put("/api/workout/plan")
    @require_auth
    def update_workout_plan():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}
        schedule = data.get("workoutPlan")
        if not isinstance(schedule, list):
            return jsonify({"error": "Expected a workoutPlan list."}), 400

        profile = user.profile
        loc = profile.workout_location if profile else "gym"
        days = len(schedule) or (profile.workout_days_per_week if profile else 4)
        dur = int(data.get("durationMin", profile.workout_duration_min if profile else 60))

        _save_workout_plan(user.id, loc, days, dur, schedule)
        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    @app.get("/api/workout-sessions")
    @require_auth
    def list_workout_sessions():
        user: User = g.current_user
        rows = (
            WorkoutSession.query.filter_by(user_id=user.id)
            .order_by(WorkoutSession.session_date.desc(), WorkoutSession.id.desc())
            .limit(50)
            .all()
        )
        return jsonify({"workoutSessions": [r.to_dict() for r in rows]}), 200

    @app.post("/api/workout-sessions")
    @require_auth
    def log_workout_session():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}

        day_label = str(data.get("dayLabel", "Workout Session")).strip()[:80]
        focus = str(data.get("focus", "Strength & Conditioning")).strip()[:120]
        duration_min = max(5, min(300, int(data.get("durationMin", 45))))
        notes = str(data.get("notes", "")).strip()[:500]
        exercises = data.get("exercises") if isinstance(data.get("exercises"), list) else []

        date_str = data.get("sessionDate")
        try:
            session_date = date.fromisoformat(date_str) if date_str else date.today()
        except ValueError:
            session_date = date.today()

        ws = WorkoutSession(
            user_id=user.id,
            session_date=session_date,
            day_label=day_label,
            focus=focus,
            duration_min=duration_min,
            exercises_json=json.dumps(exercises),
            notes=notes,
        )
        db.session.add(ws)

        # Also mark workoutCompleted on today's progress measurement if one exists
        prog = (
            ProgressMeasurement.query.filter_by(user_id=user.id, recorded_date=session_date)
            .order_by(ProgressMeasurement.id.desc())
            .first()
        )
        if prog:
            prog.workout_completed = True

        db.session.commit()
        return jsonify(build_user_bundle(user)), 201

    @app.delete("/api/workout-sessions/<int:session_id>")
    @require_auth
    def delete_workout_session(session_id: int):
        user: User = g.current_user
        ws = db.session.get(WorkoutSession, session_id)
        if not ws or ws.user_id != user.id:
            return jsonify({"error": "Workout session not found."}), 404

        db.session.delete(ws)
        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    # -------------------------------------------------------------------------
    # Progress Measurements Endpoints
    # -------------------------------------------------------------------------
    @app.get("/api/progress")
    @require_auth
    def get_progress():
        user: User = g.current_user
        days_param = request.args.get("days", "all")
        query = ProgressMeasurement.query.filter_by(user_id=user.id)

        if days_param in ("7", "30", "90"):
            cutoff = date.today() - timedelta(days=int(days_param))
            query = query.filter(ProgressMeasurement.recorded_date >= cutoff)

        rows = query.order_by(
            ProgressMeasurement.recorded_date.asc(),
            ProgressMeasurement.id.asc(),
        ).all()
        return jsonify({"progress": [r.to_dict() for r in rows]}), 200

    @app.post("/api/progress")
    @require_auth
    def add_progress():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}

        try:
            weight = float(data.get("weight", 0))
        except (ValueError, TypeError):
            return jsonify({"error": "Please enter a valid weight in kg."}), 400

        if not (30 <= weight <= 350):
            return jsonify({"error": "Weight must be between 30 kg and 350 kg."}), 400

        waist_raw = data.get("waist")
        waist = None
        if waist_raw not in (None, "", 0):
            try:
                waist = float(waist_raw)
            except (ValueError, TypeError):
                return jsonify({"error": "Please enter a valid waist measurement in cm."}), 400
            if not (40 <= waist <= 220):
                return jsonify({"error": "Waist measurement must be between 40 cm and 220 cm."}), 400

        bf_raw = data.get("bodyFatPct")
        body_fat = None
        if bf_raw not in (None, "", 0):
            try:
                body_fat = float(bf_raw)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid body fat percentage."}), 400
            if not (2 <= body_fat <= 65):
                return jsonify({"error": "Body fat percentage must be between 2% and 65%."}), 400

        date_str = data.get("isoDate") or data.get("recordedDate")
        try:
            recorded_date = date.fromisoformat(date_str) if date_str else date.today()
        except ValueError:
            recorded_date = date.today()

        workout_completed = bool(data.get("workoutCompleted", False))
        notes = str(data.get("notes", "")).strip()[:255]

        entry = ProgressMeasurement(
            user_id=user.id,
            recorded_date=recorded_date,
            weight_kg=weight,
            waist_cm=waist,
            body_fat_pct=body_fat,
            workout_completed=workout_completed,
            notes=notes,
        )
        db.session.add(entry)

        # Keep UserProfile current weight & BMI screening metric synchronized
        if user.profile and recorded_date >= date.today():
            user.profile.weight_kg = weight
            if waist is not None:
                user.profile.waist_cm = waist
            active_goal = (
                FitnessGoalModel.query.filter_by(user_id=user.id, is_active=True)
                .order_by(FitnessGoalModel.id.desc())
                .first()
            )
            if active_goal:
                assessment_payload = user.profile.to_assessment_dict(active_goal=active_goal.fitness_goal)
                calc = calculate_metrics(assessment_payload)
                active_goal.bmi = calc["bmi"]
                active_goal.bmi_category = calc["bmiCategory"]
                active_goal.bmr = calc["bmr"]
                active_goal.tdee = calc["tdee"]

        db.session.commit()
        return jsonify(build_user_bundle(user)), 201

    @app.delete("/api/progress/<int:entry_id>")
    @require_auth
    def delete_progress(entry_id: int):
        user: User = g.current_user
        entry = db.session.get(ProgressMeasurement, entry_id)
        if not entry or entry.user_id != user.id:
            return jsonify({"error": "Progress entry not found."}), 404

        db.session.delete(entry)
        db.session.commit()
        return jsonify(build_user_bundle(user)), 200

    # -------------------------------------------------------------------------
    # User Settings & Hydration Endpoints
    # -------------------------------------------------------------------------
    @app.put("/api/settings")
    @require_auth
    def update_settings():
        user: User = g.current_user
        data = request.get_json(silent=True) or {}

        settings = user.settings
        if not settings:
            settings = UserSettings(user_id=user.id)
            db.session.add(settings)

        if "unitSystem" in data and data["unitSystem"] in ("metric", "imperial"):
            settings.unit_system = data["unitSystem"]
        if "waterGoalMl" in data:
            settings.water_goal_ml = max(500, min(10000, int(data["waterGoalMl"])))
        if "dailyWaterMl" in data:
            settings.daily_water_ml = max(0, min(15000, int(data["dailyWaterMl"])))
            settings.water_log_date = date.today()
        if "notificationsEnabled" in data:
            settings.notifications_enabled = bool(data["notificationsEnabled"])

        db.session.commit()
        return jsonify({"settings": settings.to_dict()}), 200

    return app


# WSGI module-level application instance
if "pytest" in sys.modules or os.getenv("TESTING", "").lower() in ("1", "true"):
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "SECRET_KEY": "pytest-dummy-key-for-test-collection",
        }
    )
else:
    app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true")
    app.run(host="0.0.0.0", port=port, debug=debug)
