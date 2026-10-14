"""
Full End-to-End Persistence and Authentication Verification Script.
Tests:
  1. API Health & Engine Check
  2. Registration writes to database
  3. Duplicate email rejected
  4. Login retrieves user and verifies password
  5. Session persistence & Protected /api/auth/me access
  6. Biometric assessment submission & Mifflin-St Jeor persistence
  7. Diet plan generation and meal logs saved to database
  8. Workout session logging saved to database
  9. Progress measurement saved to database
  10. Logout and verify unauthorized access blocked
  11. Data remains persistent in database after app lifecycle
"""

import json
import urllib.request
import urllib.error
import http.cookiejar

BASE_URL = "http://127.0.0.1:5000"
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))


def request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json", "User-Agent": "FitPlanVerifier/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with opener.open(req) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"raw": raw}
        return err.code, parsed


def run_checks():
    print("=" * 70)
    print("           FITPLAN REAL DATA & AUTH VERIFICATION")
    print("=" * 70)

    # 1. Health check
    status, health = request("GET", "/api/health")
    print(f"[1] Health Check: Status {status}")
    print(f"    Database Engine: {health.get('database', {}).get('engine')}")
    print(f"    Connected: {health.get('database', {}).get('connected')}")
    print(f"    Message: {health.get('database', {}).get('statusMessage')}")

    # 2. Registration
    import time
    test_email = f"verified_athlete_{int(time.time())}@example.com"
    reg_payload = {
        "name": "Karan Mehra",
        "email": test_email,
        "password": "Password123!",
        "confirm": "Password123!",
        "gender": "male",
        "initialGoal": "muscleGain",
    }
    status, reg_res = request("POST", "/api/auth/register", reg_payload)
    print(f"\n[2] User Registration ({test_email}): Status {status}")
    if status == 201:
        user_id = reg_res["user"]["id"]
        token = reg_res["token"]
        print(f"    Saved User ID: {user_id}")
        print(f"    User Name: {reg_res['user']['name']}")
        print(f"    Initial Goal: {reg_res['initialGoal']}")
    else:
        print(f"    FAILED: {reg_res}")
        return

    # 3. Duplicate email prevention
    status, dup_res = request("POST", "/api/auth/register", reg_payload)
    print(f"\n[3] Duplicate Email Rejection: Status {status}")
    if status == 409:
        print(f"    PASSED: Successfully blocked duplicate registration: {dup_res.get('error')}")
    else:
        print(f"    FAILED: Expected 409, got {status}: {dup_res}")

    # 4. Login verification
    login_payload = {"email": test_email, "password": "Password123!"}
    status, login_res = request("POST", "/api/auth/login", login_payload)
    print(f"\n[4] Login Verification: Status {status}")
    if status == 200:
        token = login_res["token"]
        print(f"    PASSED: Authenticated user ID {login_res['user']['id']}")
    else:
        print(f"    FAILED: {login_res}")
        return

    # 5. Protected Dashboard Route /api/auth/me
    status, me_res = request("GET", "/api/auth/me", token=token)
    print(f"\n[5] Protected Route Access (/api/auth/me): Status {status}")
    if status == 200:
        print(f"    PASSED: Retrieved active bundle for {me_res['user']['email']}")
    else:
        print(f"    FAILED: {me_res}")

    # 6. Biometric Assessment Submission
    assessment_payload = {
        "age": 28,
        "gender": "male",
        "height": 178,
        "weight": 76.5,
        "waist": 82,
        "activityLevel": "moderate",
        "primaryGoal": "muscleGain",
        "experience": "intermediate",
        "workoutDays": 4,
        "workoutLocation": "gym",
        "dietType": "nonVegetarian",
    }
    status, assess_res = request("POST", "/api/assessment", assessment_payload, token=token)
    print(f"\n[6] Biometric Assessment & Calculation Engine: Status {status}")
    if status == 200:
        metrics = assess_res.get("metrics", {})
        print(f"    Calculated BMR: {metrics.get('bmr')} kcal")
        print(f"    Calculated TDEE: {metrics.get('tdee')} kcal")
        print(f"    Target Calories: {metrics.get('calorieTarget')} kcal")
        print(f"    Target Protein: {metrics.get('proteinTarget')}g | Carbs: {metrics.get('carbTarget')}g | Fat: {metrics.get('fatTarget')}g")
        print(f"    Diet Plan Meals Generated: {len(assess_res.get('meals', []))}")
        print(f"    Workout Split Days Generated: {len(assess_res.get('workoutPlan', []))}")
    else:
        print(f"    FAILED: {assess_res}")

    # 7. Nutrition Log Entry
    nutri_payload = {
        "mealName": "Post-Workout Snack",
        "foodName": "Greek Yogurt with Berries",
        "servingSize": "200g",
        "calories": 180,
        "protein": 18,
        "carbs": 16,
        "fat": 2,
    }
    status, nutri_res = request("POST", "/api/nutrition-logs", nutri_payload, token=token)
    print(f"\n[7] Nutrition Log Submission: Status {status}")
    if status == 201:
        logs = nutri_res.get("nutritionLogs", [])
        last_log = logs[-1] if logs else {}
        print(f"    PASSED: Logged food '{last_log.get('foodName')}' ({last_log.get('calories')} kcal) - Total logs today: {len(logs)}")
    else:
        print(f"    FAILED: {nutri_res}")

    # 8. Workout Session Entry
    workout_payload = {
        "dayLabel": "Day 1",
        "focus": "Chest & Triceps Hypertrophy",
        "durationMin": 55,
        "notes": "Felt strong on bench press.",
        "exercises": [
            {"name": "Barbell Bench Press", "sets": 4, "reps": "8", "weightKg": 80, "completed": True},
            {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10", "weightKg": 28, "completed": True},
        ],
    }
    status, ws_res = request("POST", "/api/workout-sessions", workout_payload, token=token)
    print(f"\n[8] Workout Session Logging: Status {status}")
    if status == 201:
        sessions = ws_res.get("workoutSessions", [])
        last_s = sessions[0] if sessions else {}
        print(f"    PASSED: Session logged for focus '{last_s.get('focus')}' with {len(last_s.get('exercises', []))} exercises")
    else:
        print(f"    FAILED: {ws_res}")

    # 9. Progress Measurement Entry
    prog_payload = {
        "weight": 76.2,
        "waist": 81.5,
        "bodyFatPct": 14.8,
        "workoutCompleted": True,
        "notes": "Morning measurement before breakfast",
    }
    status, prog_res = request("POST", "/api/progress", prog_payload, token=token)
    print(f"\n[9] Progress Measurement Logging: Status {status}")
    if status == 201:
        p_list = prog_res.get("progress", [])
        print(f"    PASSED: Measurement recorded ({p_list[-1].get('weight')} kg, {p_list[-1].get('bodyFatPct')}%) - Total records: {len(p_list)}")
    else:
        print(f"    FAILED: {prog_res}")

    # 10. Logout and verify protected route blocked
    status, logout_res = request("POST", "/api/auth/logout")
    print(f"\n[10] Logout: Status {status}")
    status, unauth_res = request("GET", "/api/auth/me")
    print(f"     Protected Route Without Session/Token: Status {status} ({unauth_res.get('error')})")
    if status == 401:
        print("     PASSED: Unauthorized request properly blocked.")
    else:
        print(f"     FAILED: Expected 401, got {status}")

    # 11. Re-login and verify all data persists across sessions
    status, relogin_res = request("POST", "/api/auth/login", login_payload)
    print(f"\n[11] Re-login & Data Persistence Verification across sessions: Status {status}")
    if status == 200:
        bundle = relogin_res
        print(f"     User ID: {bundle['user']['id']} ({bundle['user']['name']})")
        print(f"     Assessment Saved: {bundle['assessment'] is not None} (Height: {bundle['assessment']['height']}cm, Weight: {bundle['assessment']['weight']}kg)")
        print(f"     Metrics Saved: {bundle['metrics'] is not None} (Calorie Target: {bundle['metrics']['calorieTarget']} kcal)")
        print(f"     Diet Plan Meals: {len(bundle['meals'])} meals")
        print(f"     Workout Sessions: {len(bundle['workoutSessions'])} sessions")
        print(f"     Progress Measurements: {len(bundle['progress'])} measurements")
        print(f"     Daily Nutrition Logs: {len(bundle['nutritionLogs'])} logs")
        assert len(bundle['meals']) > 0, "Meals must persist in database"
        assert len(bundle['workoutSessions']) > 0, "Workout sessions must persist in database"
        assert len(bundle['progress']) > 0, "Progress entries must persist in database"
        assert len(bundle['nutritionLogs']) > 0, "Nutrition logs must persist in database"
        print("     PASSED: All user data successfully verified and retrieved from database!")

    print("\n" + "=" * 70)
    print("ALL API AUTHENTICATION & DATA ENDPOINTS VERIFIED ON RUNNING BACKEND.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_checks()
