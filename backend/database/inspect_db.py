"""
Database Inspection Utility for FitPlan
Run this script to inspect database connections, tables, row counts, and recent entries.
Usage:
    python backend/database/inspect_db.py
"""

import os
import sys
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app import create_app
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


def inspect():
    app = create_app()
    with app.app_context():
        engine_str = str(db.engine.url)
        # Obfuscate password in URL if present
        if ":" in engine_str and "@" in engine_str:
            proto, rest = engine_str.split("://", 1)
            user_pass, host_db = rest.split("@", 1)
            u = user_pass.split(":")[0]
            safe_url = f"{proto}://{u}:****@{host_db}"
        else:
            safe_url = engine_str

        print("=" * 72)
        print("          FITPLAN DATABASE INSPECTION & HEALTH CHECK")
        print("=" * 72)
        print(f"Timestamp    : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Database URL : {safe_url}")
        print(f"Engine Type  : {db.engine.name.upper()}")
        print("-" * 72)

        models = [
            ("users", User),
            ("user_profiles", UserProfile),
            ("fitness_goals", FitnessGoalModel),
            ("diet_plans", DietPlan),
            ("diet_plan_meals", DietPlanMeal),
            ("daily_nutrition_logs", DailyNutritionLog),
            ("workout_plans", WorkoutPlan),
            ("workout_sessions", WorkoutSession),
            ("progress_measurements", ProgressMeasurement),
            ("user_settings", UserSettings),
        ]

        print(f"{'Table Name':<28} | {'Row Count':<12} | {'Status':<15}")
        print("-" * 72)
        total_rows = 0
        for name, model in models:
            try:
                count = model.query.count()
                total_rows += count
                print(f"{name:<28} | {count:<12} | OK")
            except Exception as e:
                print(f"{name:<28} | {'ERROR':<12} | {str(e)[:25]}")

        print("-" * 72)
        print(f"Total Database Rows: {total_rows}")
        print("=" * 72)

        # Show Recent Users
        users = User.query.order_by(User.id.desc()).limit(10).all()
        print("\nRECENT REGISTERED USERS (Up to 10):")
        if not users:
            print("  (No users registered yet)")
        else:
            print(f"{'ID':<4} | {'Name':<20} | {'Email':<30} | {'Goal':<15} | {'Active'}")
            print("-" * 78)
            for u in users:
                g = (
                    FitnessGoalModel.query.filter_by(user_id=u.id, is_active=True).first()
                )
                goal_name = g.fitness_goal if g else "None"
                print(
                    f"{u.id:<4} | {u.full_name[:18]:<20} | {u.email[:28]:<30} | {goal_name:<15} | {u.is_active}"
                )

        # Show Recent Progress Measurements
        progress = ProgressMeasurement.query.order_by(ProgressMeasurement.id.desc()).limit(5).all()
        if progress:
            print("\nRECENT PROGRESS LOGS (Up to 5):")
            print(f"{'ID':<4} | {'User ID':<8} | {'Date':<12} | {'Weight (kg)':<12} | {'Waist (cm)':<12} | {'Body Fat %'}")
            print("-" * 65)
            for p in progress:
                waist_str = f"{p.waist_cm:.1f}" if p.waist_cm else "-"
                bf_str = f"{p.body_fat_pct:.1f}%" if p.body_fat_pct else "-"
                print(
                    f"{p.id:<4} | {p.user_id:<8} | {str(p.recorded_date):<12} | {p.weight_kg:<12.1f} | {waist_str:<12} | {bf_str}"
                )

        # Show Recent Workout Sessions
        sessions = WorkoutSession.query.order_by(WorkoutSession.id.desc()).limit(5).all()
        if sessions:
            print("\nRECENT WORKOUT SESSIONS (Up to 5):")
            print(f"{'ID':<4} | {'User ID':<8} | {'Date':<12} | {'Focus':<20} | {'Duration (min)'}")
            print("-" * 60)
            for s in sessions:
                print(
                    f"{s.id:<4} | {s.user_id:<8} | {str(s.session_date):<12} | {s.focus[:18]:<20} | {s.duration_min}"
                )

        print("\n" + "=" * 72)
        print("Inspection completed successfully.")
        print("=" * 72 + "\n")


if __name__ == "__main__":
    inspect()
