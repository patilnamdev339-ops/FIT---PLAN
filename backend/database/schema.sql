-- =============================================================================
-- FitPlan — Personalized Fitness, Diet & Workout Planner
-- Normalized MySQL Database Schema (Version 1.0)
-- Compatible with MySQL 8.0+ / MariaDB 10.6+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS fitness_planner_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitness_planner_db;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores core authentication credentials and account status.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    INDEX idx_users_email (email),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. USER PROFILES & BODY MEASUREMENTS TABLE
-- Stores demographic details, body measurements, avatar choice, and lifestyle.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    age INT NOT NULL DEFAULT 25,
    gender ENUM('male', 'female') NOT NULL DEFAULT 'male',
    avatar_id VARCHAR(50) NOT NULL DEFAULT 'male_athlete',
    height_cm DECIMAL(5,2) NOT NULL DEFAULT 170.00,
    weight_kg DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    waist_cm DECIMAL(5,2) NULL DEFAULT NULL,
    activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'veryActive') NOT NULL DEFAULT 'moderate',
    experience_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
    workout_location ENUM('home', 'gym') NOT NULL DEFAULT 'gym',
    equipment_json JSON NULL,
    workout_days_per_week INT NOT NULL DEFAULT 4,
    workout_duration_min INT NOT NULL DEFAULT 60,
    diet_type ENUM('vegetarian', 'eggetarian', 'nonVegetarian') NOT NULL DEFAULT 'nonVegetarian',
    meals_per_day INT NOT NULL DEFAULT 3,
    food_preferences_json JSON NULL,
    assessment_completed TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id),
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. FITNESS GOALS & NUTRITION TARGETS TABLE
-- Stores active fitness goals, calculated screening metrics (BMI, BMR, TDEE),
-- and editable daily nutrition targets.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fitness_goals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    fitness_goal ENUM('fatLoss', 'cutting', 'muscleGain', 'leanBulk', 'recomposition', 'maintenance', 'generalFitness') NOT NULL DEFAULT 'generalFitness',
    target_weight_kg DECIMAL(5,2) NULL DEFAULT NULL,
    bmi DECIMAL(4,1) NOT NULL DEFAULT 22.0,
    bmi_category VARCHAR(40) NOT NULL DEFAULT 'Normal',
    bmr INT NOT NULL DEFAULT 1650,
    tdee INT NOT NULL DEFAULT 2200,
    calorie_target INT NOT NULL DEFAULT 2000,
    protein_target_g INT NOT NULL DEFAULT 130,
    carb_target_g INT NOT NULL DEFAULT 220,
    fat_target_g INT NOT NULL DEFAULT 60,
    is_custom_targets TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fitness_goals_user_active (user_id, is_active),
    CONSTRAINT fk_fitness_goals_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. DIET PLANS TABLE
-- Stores personalized or user-customized daily diet plans.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diet_plans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    plan_name VARCHAR(120) NOT NULL DEFAULT 'Personalized Nutrition Plan',
    diet_type ENUM('vegetarian', 'eggetarian', 'nonVegetarian') NOT NULL DEFAULT 'nonVegetarian',
    target_calories INT NOT NULL DEFAULT 2000,
    target_protein_g INT NOT NULL DEFAULT 130,
    target_carbs_g INT NOT NULL DEFAULT 220,
    target_fat_g INT NOT NULL DEFAULT 60,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_diet_plans_user_active (user_id, is_active),
    CONSTRAINT fk_diet_plans_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. MEALS & FOOD ENTRIES TABLE (diet_plan_meals)
-- Stores individual meals and food items belonging to a diet plan.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diet_plan_meals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    diet_plan_id INT UNSIGNED NOT NULL,
    meal_name VARCHAR(100) NOT NULL,
    meal_order INT NOT NULL DEFAULT 0,
    foods_json JSON NOT NULL,
    total_calories INT NOT NULL DEFAULT 0,
    total_protein_g DECIMAL(6,1) NOT NULL DEFAULT 0.0,
    total_carbs_g DECIMAL(6,1) NOT NULL DEFAULT 0.0,
    total_fat_g DECIMAL(6,1) NOT NULL DEFAULT 0.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_diet_plan_meals_plan (diet_plan_id, meal_order),
    CONSTRAINT fk_diet_plan_meals_plan FOREIGN KEY (diet_plan_id)
        REFERENCES diet_plans (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. DAILY NUTRITION LOGS TABLE
-- Tracks actual daily meals and foods consumed by the user across dates.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_nutrition_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    log_date DATE NOT NULL,
    meal_name VARCHAR(100) NOT NULL DEFAULT 'Meal',
    food_name VARCHAR(150) NOT NULL,
    serving_size VARCHAR(80) NOT NULL DEFAULT '1 serving',
    quantity DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    calories INT NOT NULL DEFAULT 0,
    protein_g DECIMAL(6,1) NOT NULL DEFAULT 0.0,
    carbs_g DECIMAL(6,1) NOT NULL DEFAULT 0.0,
    fat_g DECIMAL(6,1) NOT NULL DEFAULT 0.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nutrition_logs_user_date (user_id, log_date),
    CONSTRAINT fk_nutrition_logs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. WORKOUT PLANS TABLE
-- Stores personalized weekly workout schedules and exercises.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_plans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    plan_name VARCHAR(120) NOT NULL DEFAULT 'Personalized Training Split',
    workout_location ENUM('home', 'gym') NOT NULL DEFAULT 'gym',
    days_per_week INT NOT NULL DEFAULT 4,
    duration_min INT NOT NULL DEFAULT 60,
    schedule_json JSON NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workout_plans_user_active (user_id, is_active),
    CONSTRAINT fk_workout_plans_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. EXERCISES & WORKOUT SESSIONS TABLE (workout_sessions)
-- Logs completed workout sessions, sets, reps, and weights lifted.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    session_date DATE NOT NULL,
    day_label VARCHAR(80) NOT NULL,
    focus VARCHAR(120) NOT NULL,
    duration_min INT NOT NULL DEFAULT 45,
    exercises_json JSON NOT NULL,
    notes VARCHAR(500) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workout_sessions_user_date (user_id, session_date),
    CONSTRAINT fk_workout_sessions_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. PROGRESS MEASUREMENTS TABLE
-- Stores historical body weight, waist circumference, and workout adherence.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress_measurements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    recorded_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    waist_cm DECIMAL(5,2) NULL DEFAULT NULL,
    body_fat_pct DECIMAL(4,1) NULL DEFAULT NULL,
    workout_completed TINYINT(1) NOT NULL DEFAULT 0,
    notes VARCHAR(255) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_progress_user_date (user_id, recorded_date),
    CONSTRAINT fk_progress_measurements_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. USER SETTINGS TABLE
-- Stores user preferences, hydration goals, and daily water intake tracking.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    unit_system ENUM('metric', 'imperial') NOT NULL DEFAULT 'metric',
    water_goal_ml INT NOT NULL DEFAULT 3000,
    daily_water_ml INT NOT NULL DEFAULT 0,
    water_log_date DATE NULL DEFAULT NULL,
    notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_settings_user_id UNIQUE (user_id),
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
