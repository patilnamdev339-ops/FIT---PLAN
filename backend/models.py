from datetime import datetime, date, timezone
import json
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(db.Model):
    """1. Users table — stores core authentication credentials."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utc_now, onupdate=utc_now
    )

    profile = db.relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    goals = db.relationship(
        "FitnessGoalModel",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    diet_plans = db.relationship(
        "DietPlan",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    nutrition_logs = db.relationship(
        "DailyNutritionLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    workout_plans = db.relationship(
        "WorkoutPlan",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    workout_sessions = db.relationship(
        "WorkoutSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    progress_entries = db.relationship(
        "ProgressMeasurement",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    settings = db.relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def to_dict(self) -> dict:
        avatar = self.profile.avatar_id if self.profile else "male_athlete"
        gender = self.profile.gender if self.profile else "male"
        return {
            "id": self.id,
            "name": self.full_name,
            "email": self.email,
            "avatarId": avatar,
            "gender": gender,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class UserProfile(db.Model):
    """2. User profiles and body measurements table."""

    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    age = db.Column(db.Integer, nullable=False, default=25)
    gender = db.Column(db.String(16), nullable=False, default="male")
    avatar_id = db.Column(db.String(50), nullable=False, default="male_athlete")
    height_cm = db.Column(db.Float, nullable=False, default=170.0)
    weight_kg = db.Column(db.Float, nullable=False, default=70.0)
    waist_cm = db.Column(db.Float, nullable=True)
    activity_level = db.Column(db.String(32), nullable=False, default="moderate")
    experience_level = db.Column(db.String(32), nullable=False, default="beginner")
    workout_location = db.Column(db.String(16), nullable=False, default="gym")
    equipment_json = db.Column(db.Text, nullable=True, default="[]")
    workout_days_per_week = db.Column(db.Integer, nullable=False, default=4)
    workout_duration_min = db.Column(db.Integer, nullable=False, default=60)
    diet_type = db.Column(db.String(32), nullable=False, default="nonVegetarian")
    meals_per_day = db.Column(db.Integer, nullable=False, default=3)
    food_preferences_json = db.Column(db.Text, nullable=True, default="[]")
    assessment_completed = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utc_now, onupdate=utc_now
    )

    user = db.relationship("User", back_populates="profile")

    @property
    def equipment(self) -> list[str]:
        try:
            return json.loads(self.equipment_json or "[]")
        except (ValueError, TypeError):
            return []

    @equipment.setter
    def equipment(self, value: list[str]) -> None:
        self.equipment_json = json.dumps(list(value or []))

    @property
    def food_preferences(self) -> list[str]:
        try:
            return json.loads(self.food_preferences_json or "[]")
        except (ValueError, TypeError):
            return []

    @food_preferences.setter
    def food_preferences(self, value: list[str]) -> None:
        self.food_preferences_json = json.dumps(list(value or []))

    def to_assessment_dict(self, active_goal: str = "generalFitness") -> dict:
        data = {
            "age": self.age,
            "gender": self.gender if self.gender in ("male", "female") else "male",
            "avatarId": self.avatar_id,
            "height": round(float(self.height_cm), 1),
            "weight": round(float(self.weight_kg), 1),
            "activityLevel": self.activity_level,
            "fitnessGoal": active_goal,
            "experienceLevel": self.experience_level,
            "workoutLocation": self.workout_location,
            "equipment": self.equipment,
            "workoutDaysPerWeek": self.workout_days_per_week,
            "workoutDuration": self.workout_duration_min,
            "dietType": self.diet_type,
            "mealsPerDay": self.meals_per_day,
            "foodPreferences": self.food_preferences,
        }
        if self.waist_cm is not None:
            data["waist"] = round(float(self.waist_cm), 1)
        return data


class FitnessGoalModel(db.Model):
    """3. Fitness goals and nutrition targets table."""

    __tablename__ = "fitness_goals"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fitness_goal = db.Column(
        db.String(32), nullable=False, default="generalFitness"
    )
    target_weight_kg = db.Column(db.Float, nullable=True)
    bmi = db.Column(db.Float, nullable=False, default=22.0)
    bmi_category = db.Column(db.String(40), nullable=False, default="Normal")
    bmr = db.Column(db.Integer, nullable=False, default=1650)
    tdee = db.Column(db.Integer, nullable=False, default=2200)
    calorie_target = db.Column(db.Integer, nullable=False, default=2000)
    protein_target_g = db.Column(db.Integer, nullable=False, default=130)
    carb_target_g = db.Column(db.Integer, nullable=False, default=220)
    fat_target_g = db.Column(db.Integer, nullable=False, default=60)
    is_custom_targets = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utc_now, onupdate=utc_now
    )

    user = db.relationship("User", back_populates="goals")

    def to_metrics_dict(self) -> dict:
        return {
            "bmi": round(float(self.bmi), 1),
            "bmiCategory": self.bmi_category,
            "bmr": int(self.bmr),
            "tdee": int(self.tdee),
            "calorieTarget": int(self.calorie_target),
            "proteinTarget": int(self.protein_target_g),
            "carbTarget": int(self.carb_target_g),
            "fatTarget": int(self.fat_target_g),
            "isCustomTargets": bool(self.is_custom_targets),
            "targetWeight": (
                round(float(self.target_weight_kg), 1)
                if self.target_weight_kg is not None
                else None
            ),
        }


class DietPlan(db.Model):
    """4. Diet plans table."""

    __tablename__ = "diet_plans"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_name = db.Column(
        db.String(120), nullable=False, default="Personalized Nutrition Plan"
    )
    diet_type = db.Column(db.String(32), nullable=False, default="nonVegetarian")
    target_calories = db.Column(db.Integer, nullable=False, default=2000)
    target_protein_g = db.Column(db.Integer, nullable=False, default=130)
    target_carbs_g = db.Column(db.Integer, nullable=False, default=220)
    target_fat_g = db.Column(db.Integer, nullable=False, default=60)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utc_now, onupdate=utc_now
    )

    user = db.relationship("User", back_populates="diet_plans")
    meals = db.relationship(
        "DietPlanMeal",
        back_populates="diet_plan",
        cascade="all, delete-orphan",
        order_by="DietPlanMeal.meal_order",
    )


class DietPlanMeal(db.Model):
    """5. Meals and food entries table."""

    __tablename__ = "diet_plan_meals"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    diet_plan_id = db.Column(
        db.Integer,
        db.ForeignKey("diet_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    meal_name = db.Column(db.String(100), nullable=False)
    meal_order = db.Column(db.Integer, nullable=False, default=0)
    foods_json = db.Column(db.Text, nullable=False, default="[]")
    total_calories = db.Column(db.Integer, nullable=False, default=0)
    total_protein_g = db.Column(db.Float, nullable=False, default=0.0)
    total_carbs_g = db.Column(db.Float, nullable=False, default=0.0)
    total_fat_g = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utc_now, onupdate=utc_now
    )

    diet_plan = db.relationship("DietPlan", back_populates="meals")

    def to_dict(self) -> dict:
        try:
            foods = json.loads(self.foods_json or "[]")
        except (ValueError, TypeError):
            foods = []
        return {
            "id": self.id,
            "mealName": self.meal_name,
            "foods": foods,
            "totalCalories": int(round(self.total_calories)),
            "totalProtein": int(round(self.total_protein_g)),
            "totalCarbs": int(round(self.total_carbs_g)),
            "totalFat": int(round(self.total_fat_g)),
        }


class DailyNutritionLog(db.Model):
    """6. Daily nutrition logs table — tracks consumed meals/foods by date."""

    __tablename__ = "daily_nutrition_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    log_date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    meal_name = db.Column(db.String(100), nullable=False, default="Meal")
    food_name = db.Column(db.String(150), nullable=False)
    serving_size = db.Column(db.String(80), nullable=False, default="1 serving")
    quantity = db.Column(db.Float, nullable=False, default=1.0)
    calories = db.Column(db.Integer, nullable=False, default=0)
    protein_g = db.Column(db.Float, nullable=False, default=0.0)
    carbs_g = db.Column(db.Float, nullable=False, default=0.0)
    fat_g = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    user = db.relationship("User", back_populates="nutrition_logs")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "logDate": self.log_date.isoformat() if self.log_date else None,
            "mealName": self.meal_name,
            "foodName": self.food_name,
            "servingSize": self.serving_size,
            "quantity": round(float(self.quantity), 2),
            "calories": int(self.calories),
            "protein": round(float(self.protein_g), 1),
            "carbs": round(float(self.carbs_g), 1),
            "fat": round(float(self.fat_g), 1),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class WorkoutPlan(db.Model):
    """7. Workout plans table."""

    __tablename__ = "workout_plans"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_name = db.Column(
        db.String(120), nullable=False, default="Personalized Training Split"
    )
    workout_location = db.Column(db.String(16), nullable=False, default="gym")
    days_per_week = db.Column(db.Integer, nullable=False, default=4)
    duration_min = db.Column(db.Integer, nullable=False, default=60)
    schedule_json = db.Column(db.Text, nullable=False, default="[]")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utc_now, onupdate=utc_now
    )

    user = db.relationship("User", back_populates="workout_plans")

    @property
    def schedule(self) -> list[dict]:
        try:
            return json.loads(self.schedule_json or "[]")
        except (ValueError, TypeError):
            return []

    @schedule.setter
    def schedule(self, value: list[dict]) -> None:
        self.schedule_json = json.dumps(list(value or []))


class WorkoutSession(db.Model):
    """8. Exercises and workout sessions table — logs actual workouts completed."""

    __tablename__ = "workout_sessions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_date = db.Column(
        db.Date, nullable=False, default=date.today, index=True
    )
    day_label = db.Column(db.String(80), nullable=False)
    focus = db.Column(db.String(120), nullable=False)
    duration_min = db.Column(db.Integer, nullable=False, default=45)
    exercises_json = db.Column(db.Text, nullable=False, default="[]")
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    user = db.relationship("User", back_populates="workout_sessions")

    def to_dict(self) -> dict:
        try:
            exercises = json.loads(self.exercises_json or "[]")
        except (ValueError, TypeError):
            exercises = []
        return {
            "id": self.id,
            "sessionDate": (
                self.session_date.isoformat() if self.session_date else None
            ),
            "dayLabel": self.day_label,
            "focus": self.focus,
            "durationMin": int(self.duration_min),
            "exercises": exercises,
            "notes": self.notes or "",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class ProgressMeasurement(db.Model):
    """9. Progress measurements table — weight, waist, body fat, workout adherence."""

    __tablename__ = "progress_measurements"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recorded_date = db.Column(
        db.Date, nullable=False, default=date.today, index=True
    )
    weight_kg = db.Column(db.Float, nullable=False)
    waist_cm = db.Column(db.Float, nullable=True)
    body_fat_pct = db.Column(db.Float, nullable=True)
    workout_completed = db.Column(db.Boolean, nullable=False, default=False)
    notes = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    user = db.relationship("User", back_populates="progress_entries")

    def to_dict(self) -> dict:
        iso_date = (
            self.recorded_date.isoformat()
            if self.recorded_date
            else date.today().isoformat()
        )
        display_date = (
            self.recorded_date.strftime("%b %d").replace(" 0", " ")
            if self.recorded_date
            else iso_date
        )
        item = {
            "id": self.id,
            "date": display_date,
            "isoDate": iso_date,
            "weight": round(float(self.weight_kg), 1),
            "workoutCompleted": bool(self.workout_completed),
            "notes": self.notes or "",
        }
        if self.waist_cm is not None:
            item["waist"] = round(float(self.waist_cm), 1)
        if self.body_fat_pct is not None:
            item["bodyFatPct"] = round(float(self.body_fat_pct), 1)
        return item


class UserSettings(db.Model):
    """10. User settings table — unit system, hydration target, and daily water log."""

    __tablename__ = "user_settings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    unit_system = db.Column(db.String(16), nullable=False, default="metric")
    water_goal_ml = db.Column(db.Integer, nullable=False, default=3000)
    daily_water_ml = db.Column(db.Integer, nullable=False, default=0)
    water_log_date = db.Column(db.Date, nullable=True, default=date.today)
    notifications_enabled = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utc_now, onupdate=utc_now
    )

    user = db.relationship("User", back_populates="settings")

    def to_dict(self) -> dict:
        today = date.today()
        current_water = (
            int(self.daily_water_ml)
            if self.water_log_date == today
            else 0
        )
        return {
            "unitSystem": self.unit_system,
            "waterGoalMl": int(self.water_goal_ml),
            "dailyWaterMl": current_water,
            "notificationsEnabled": bool(self.notifications_enabled),
        }
