# FitPlan — Personalized Fitness, Diet & Workout Planner

A full-stack fitness SaaS web application built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons** on the frontend and **Python Flask + SQLAlchemy + PyMySQL + bcrypt** with a normalized **10-table MySQL database (`fitness_planner_db`)** on the backend.

---

## 1. Architecture & Design Direction

- **Frontend (`ProjectOverview/`)**:
  - **Aesthetic**: Premium fitness SaaS aesthetic featuring a dark navy/charcoal background (`#0b0f19`), dark slate card surfaces (`#111827`), restrained electric-green (`#10b981`) and electric-blue accents, and consistent **Lucide icons**.
  - **State & Communication**: Centralized API client (`src/lib/api.ts`) communicating with `/api/*` via session cookies and Bearer tokens.
  - **Avatars**: Distinct male and female profile personas (`male_athlete`, `female_athlete`, `male_lifter`, `female_lifter`, etc.).
  - **Modules**:
    - **Landing Page**: Modern hero with responsive CTA buttons, scientific rationale section, and key feature highlights.
    - **Authentication**: Secure bcrypt-backed login and registration with validation, show/hide password, and rate-limiting.
    - **Assessment Wizard**: 5-step guided biometric intake (Age, Gender, Height, Weight, Waist, Lifestyle, Goal, Location, Diet type).
    - **Live Dashboard**: Consumed vs. target calories & macros, interactive hydration tracker (+250ml/+500ml/reset), workout summary, and clinical BMI screening notice.
    - **Diet Planner**: Recommended meals, macronutrient target editor, food replacement modal, custom food logger, and photo meal scanner.
    - **Workout Planner**: Structured weekly splits, custom exercise addition, session volume logger (sets, reps, weight in kg), and training history.
    - **Progress Tracking**: Real-time Recharts trends for body weight and waist circumference with 7D / 30D / 90D / All-time date filters. Zero synthetic/sample data.
    - **Profile & Settings**: Account management, biometric calibration, password security, and avatar customization.

- **Backend (`backend/`)**:
  - `backend/app.py`: Flask REST API with CORS, private sessions, signed Bearer tokens, rate limiting, and structured JSON error responses.
  - `backend/models.py`: 10 SQLAlchemy ORM models mapped to `backend/database/schema.sql`.
  - `backend/recommendation.py`: Mifflin-St Jeor equation BMR/TDEE calculation engine, BMI screening classifier, diet plan generator, and workout split generator.
  - `backend/security.py`: `bcrypt` password hashing (`rounds=12`), signed tokens, `@require_auth` middleware, and sliding-window rate limiter.
  - `backend/database/schema.sql`: Versioned MySQL 8.0+ DDL creating 10 normalized tables for `fitness_planner_db`.
  - `backend/database/setup_user.sql`: Automated script creating dedicated MySQL user `fitness_app` with password `Harsh@123` granted on `fitness_planner_db`.

---

## 2. MySQL Database Schema (10 Tables)

Located in [`backend/database/schema.sql`](backend/database/schema.sql):

1. `users` — Core user credentials (`id`, `full_name`, `email` UNIQUE, `password_hash`, `is_active`, timestamps)
2. `user_profiles` — Demographics, avatar persona, height, weight, waist, activity level, equipment, and dietary preferences
3. `fitness_goals` — Active fitness goal, BMI screening index, BMR, TDEE, and daily calorie/protein/carb/fat targets
4. `diet_plans` — User diet plan header and macro targets
5. `diet_plan_meals` — Planned daily meals and food items (`foods_json`, `total_calories`, macros)
6. `daily_nutrition_logs` — Daily food and meal intake logged by date (`log_date`, `meal_name`, `food_name`, `calories`, macros)
7. `workout_plans` — Personalized weekly training split (`schedule_json`, `days_per_week`, `duration_min`)
8. `workout_sessions` — Logged workout sessions with sets, reps, weight (`kg`), duration, and notes
9. `progress_measurements` — Historical weight (`kg`), waist (`cm`), body fat (`%`), and workout completion records
10. `user_settings` — Unit system, daily water goal (`ml`), and daily water intake tracker

---

## 3. Step-by-Step Guide to Connect MySQL & MySQL Workbench

### Database Credentials
- **Host**: `127.0.0.1` (Port `3306`)
- **Database**: `fitness_planner_db`
- **Application User**: `fitness_app`
- **Password**: `Harsh@123`

### Option A: Automatic Database Setup (Recommended)
1. Ensure MySQL Server is running on your machine.
2. If MySQL Server is not yet installed on Windows:
   - Download the official MySQL Community Installer: [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)
   - Select **MySQL Server 8.0+** and **MySQL Workbench**.
   - During setup, set your MySQL `root` password.
3. Open **MySQL Workbench** or Windows Command Prompt as `root` and run the user creation script:
   ```powershell
   mysql -u root -p < backend/database/setup_user.sql
   ```
4. Run the schema initializer:
   ```powershell
   python backend/database/init_db.py
   ```
   You will see:
   `[SUCCESS] Connected to MySQL at 127.0.0.1:3306/fitness_planner_db`

> **Note on Local Development Fallback:** When MySQL Server is not currently running on `127.0.0.1:3306`, the Flask backend automatically activates a local persistent SQLite database (`backend/database/fitplan.db`) so local testing is never blocked. As soon as MySQL is started, it connects seamlessly.

### Option B: Using MySQL Workbench GUI
1. Open **MySQL Workbench** and connect to your local MySQL instance as `root`.
2. Click **File → Open SQL Script...** and select `backend/database/setup_user.sql`. Click the ⚡ Execute icon.
3. Next, click **File → Open SQL Script...** and select `backend/database/schema.sql`. Click the ⚡ Execute icon.
4. Refresh the **Schemas** panel on the left to see `fitness_planner_db` with all 10 tables ready.

---

## 4. Running the Application in VS Code

### Step 1: Install Python Dependencies
```powershell
python -m pip install -r backend/requirements.txt
```

### Step 2: Start the Flask Backend Server (Port 5000)
```powershell
python -m backend.app
```
Verify backend health at: `http://127.0.0.1:5000/api/health`

### Step 3: Start the React + Vite Frontend (Port 8443)
Open a second terminal window:
```powershell
cd ProjectOverview
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:8443` in your browser. Vite automatically proxies all `/api/*` calls to the backend on `http://127.0.0.1:5000`.

### Single-Script Local Startup (PowerShell)
Alternatively, run the automated launch script from the project root:
```powershell
.\start_local.ps1
```

---

## 5. Automated Tests & Quality Verification

```powershell
# 1. Backend automated unit and integration tests (10 test suites)
python -m pytest backend/tests/test_api.py -v

# 2. Frontend TypeScript compilation verification (zero errors)
cd ProjectOverview
npx.cmd tsc --noEmit

# 3. Frontend production asset build
npm.cmd run build
```

---

## 6. Production Deployment Guide (GitHub + Render)

1. **GitHub Repository**:
   - `.env` is excluded via `.gitignore` to protect credentials.
   - Commit and push your code to your GitHub repository.
2. **Database**:
   - Provision a managed MySQL 8.0 instance on **Aiven**, **Railway**, **PlanetScale**, or **AWS RDS**.
   - Run `backend/database/schema.sql` on the managed database.
3. **Render Deployment**:
   - Use the provided [`render.yaml`](render.yaml) blueprint or create two services:
     - **Backend Service (Python)**: Command: `gunicorn backend.app:app`. Set environment variables: `DB_ENGINE=mysql`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `SECRET_KEY`.
     - **Frontend Service (Static Site)**: Build command: `npm run build`, Publish directory: `dist`. Set `VITE_API_URL` to your backend URL.
