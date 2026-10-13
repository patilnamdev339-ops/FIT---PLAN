import pytest
from backend.app import create_app
from backend.models import db
from backend.security import auth_rate_limiter


@pytest.fixture()
def client():
    test_cfg = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SECRET_KEY": "pytest-secret-key-fitplan-test",
        "ENABLE_RATE_LIMIT_IN_TESTS": False,
    }
    auth_rate_limiter.reset()
    app = create_app(test_cfg)
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "ok"
    assert body["database"]["connected"] is True


def test_registration_and_duplicate_email(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Arjun Sharma",
            "email": "Arjun.Sharma@Example.com",
            "password": "StrongPassword123!",
            "confirm": "StrongPassword123!",
            "initialGoal": "muscleGain",
            "gender": "male",
        },
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["email"] == "arjun.sharma@example.com"
    assert data["user"]["name"] == "Arjun Sharma"
    assert data["initialGoal"] == "muscleGain"
    assert "token" in data

    dup = client.post(
        "/api/auth/register",
        json={
            "name": "Arjun Clone",
            "email": "arjun.sharma@example.com",
            "password": "AnotherPassword123!",
            "confirm": "AnotherPassword123!",
        },
    )
    assert dup.status_code == 409
    assert "already exists" in dup.get_json()["error"].lower()


def test_registration_validation_errors(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "short",
            "confirm": "short",
        },
    )
    assert res.status_code == 400

    res2 = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "Password1234",
            "confirm": "Different1234",
        },
    )
    assert res2.status_code == 400


def test_login_logout_and_session_persistence(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Priya Patel",
            "email": "priya@example.com",
            "password": "SecurePass99!",
            "confirm": "SecurePass99!",
            "gender": "female",
        },
    )

    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

    me_unauth = client.get("/api/auth/me")
    assert me_unauth.status_code == 401

    bad_login = client.post(
        "/api/auth/login",
        json={"email": "priya@example.com", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

    no_user = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "SecurePass99!"},
    )
    assert no_user.status_code == 401

    good_login = client.post(
        "/api/auth/login",
        json={"email": "PRIYA@example.com", "password": "SecurePass99!"},
    )
    assert good_login.status_code == 200
    token = good_login.get_json()["token"]

    client.post("/api/auth/logout")
    me_with_token = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_with_token.status_code == 200
    assert me_with_token.get_json()["user"]["email"] == "priya@example.com"


def test_protected_routes_block_unauthorized_requests(client):
    endpoints = [
        ("GET", "/api/auth/me"),
        ("POST", "/api/assessment"),
        ("PUT", "/api/profile"),
        ("PUT", "/api/targets"),
        ("PUT", "/api/diet/meals"),
        ("GET", "/api/nutrition-logs"),
        ("POST", "/api/nutrition-logs"),
        ("PUT", "/api/workout/plan"),
        ("GET", "/api/workout-sessions"),
        ("POST", "/api/workout-sessions"),
        ("GET", "/api/progress"),
        ("POST", "/api/progress"),
        ("PUT", "/api/settings"),
    ]
    for method, url in endpoints:
        resp = client.open(url, method=method, json={})
        assert resp.status_code == 401, f"Expected 401 for {method} {url}"


def test_assessment_calculations_diet_workout_and_progress_flow(client):
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Rohan Verma",
            "email": "rohan@example.com",
            "password": "Password123!",
            "confirm": "Password123!",
        },
    )
    token = reg.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    assess_res = client.post(
        "/api/assessment",
        headers=headers,
        json={
            "age": 28,
            "gender": "male",
            "height": 175,
            "weight": 78,
            "waist": 84,
            "activityLevel": "moderate",
            "fitnessGoal": "fatLoss",
            "experienceLevel": "intermediate",
            "workoutLocation": "gym",
            "equipment": ["Dumbbells", "Barbell", "Bench"],
            "workoutDaysPerWeek": 4,
            "workoutDuration": 60,
            "dietType": "eggetarian",
            "mealsPerDay": 4,
            "foodPreferences": ["Eggs", "Roti", "Dal"],
        },
    )
    assert assess_res.status_code == 200
    bundle = assess_res.get_json()

    metrics = bundle["metrics"]
    assert metrics is not None
    assert 25.0 <= metrics["bmi"] <= 26.0
    assert metrics["bmiCategory"] == "Overweight"
    assert metrics["calorieTarget"] >= 1500
    assert metrics["proteinTarget"] > 100
    assert len(bundle["meals"]) == 4
    assert len(bundle["workoutPlan"]) == 4
    assert len(bundle["progress"]) == 1
    assert bundle["progress"][0]["weight"] == 78.0

    # Edit nutrition targets
    target_res = client.put(
        "/api/targets",
        headers=headers,
        json={
            "calorieTarget": 2150,
            "proteinTarget": 165,
            "carbTarget": 210,
            "fatTarget": 70,
            "targetWeight": 72.0,
        },
    )
    assert target_res.status_code == 200
    updated_metrics = target_res.get_json()["metrics"]
    assert updated_metrics["calorieTarget"] == 2150
    assert updated_metrics["proteinTarget"] == 165
    assert updated_metrics["isCustomTargets"] is True
    assert updated_metrics["targetWeight"] == 72.0

    # Log a consumed food item
    log_res = client.post(
        "/api/nutrition-logs",
        headers=headers,
        json={
            "mealName": "Breakfast",
            "foodName": "Boiled Eggs",
            "servingSize": "3 eggs",
            "quantity": 1.5,
            "calories": 232,
            "protein": 19.5,
            "carbs": 1.6,
            "fat": 16.5,
        },
    )
    assert log_res.status_code == 201
    logs = log_res.get_json()["nutritionLogs"]
    assert len(logs) == 1
    assert logs[0]["foodName"] == "Boiled Eggs"

    # Log a workout session
    ws_res = client.post(
        "/api/workout-sessions",
        headers=headers,
        json={
            "dayLabel": "Day 1",
            "focus": "Push (Chest & Shoulders)",
            "durationMin": 55,
            "notes": "Felt strong on bench press",
            "exercises": [
                {"name": "Barbell Bench Press", "sets": 4, "reps": "8", "weightKg": 70, "completed": True},
                {"name": "Push-Up", "sets": 3, "reps": "15", "weightKg": 0, "completed": True},
            ],
        },
    )
    assert ws_res.status_code == 201
    sessions = ws_res.get_json()["workoutSessions"]
    assert len(sessions) == 1
    assert sessions[0]["durationMin"] == 55
    assert len(sessions[0]["exercises"]) == 2

    # Log a new progress entry
    prog_res = client.post(
        "/api/progress",
        headers=headers,
        json={
            "weight": 77.2,
            "waist": 83.0,
            "bodyFatPct": 18.5,
            "workoutCompleted": True,
            "notes": "Week 1 check-in",
        },
    )
    assert prog_res.status_code == 201
    prog_list = prog_res.get_json()["progress"]
    assert len(prog_list) == 2
    assert prog_list[-1]["weight"] == 77.2


def test_profile_update_password_change_and_settings(client):
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Neha Gupta",
            "email": "neha@example.com",
            "password": "OldPassword123!",
            "confirm": "OldPassword123!",
            "gender": "female",
        },
    )
    headers = {"Authorization": f"Bearer {reg.get_json()['token']}"}

    # Complete assessment
    client.post(
        "/api/assessment",
        headers=headers,
        json={
            "age": 24,
            "gender": "female",
            "height": 162,
            "weight": 58,
            "activityLevel": "light",
            "fitnessGoal": "recomposition",
            "experienceLevel": "beginner",
            "workoutLocation": "home",
            "workoutDaysPerWeek": 3,
            "workoutDuration": 45,
            "dietType": "vegetarian",
            "mealsPerDay": 3,
        },
    )

    # Update profile & avatar
    prof_res = client.put(
        "/api/profile",
        headers=headers,
        json={
            "name": "Neha G.",
            "avatarId": "female_yogi",
            "weight": 57.0,
            "regeneratePlans": True,
        },
    )
    assert prof_res.status_code == 200
    b = prof_res.get_json()
    assert b["user"]["name"] == "Neha G."
    assert b["user"]["avatarId"] == "female_yogi"
    assert b["assessment"]["weight"] == 57.0

    # Update settings (water intake)
    set_res = client.put(
        "/api/settings",
        headers=headers,
        json={"waterGoalMl": 2750, "dailyWaterMl": 1250},
    )
    assert set_res.status_code == 200
    assert set_res.get_json()["settings"]["dailyWaterMl"] == 1250

    # Change password
    pw_res = client.put(
        "/api/auth/password",
        headers=headers,
        json={
            "currentPassword": "OldPassword123!",
            "newPassword": "NewPassword456!",
            "confirmPassword": "NewPassword456!",
        },
    )
    assert pw_res.status_code == 200

    # Login with new password succeeds
    login_new = client.post(
        "/api/auth/login",
        json={"email": "neha@example.com", "password": "NewPassword456!"},
    )
    assert login_new.status_code == 200


def test_invalid_inputs_rejected(client):
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Validator User",
            "email": "valid@example.com",
            "password": "Password123!",
            "confirm": "Password123!",
        },
    )
    headers = {"Authorization": f"Bearer {reg.get_json()['token']}"}

    # Invalid height & weight in assessment
    bad_assess = client.post(
        "/api/assessment",
        headers=headers,
        json={"age": 25, "gender": "male", "height": 40, "weight": 70},
    )
    assert bad_assess.status_code == 400

    # Invalid weight in progress
    bad_prog = client.post(
        "/api/progress",
        headers=headers,
        json={"weight": -10, "workoutCompleted": False},
    )
    assert bad_prog.status_code == 400


def test_user_data_isolation_and_idor_protection(client):
    reg_a = client.post(
        "/api/auth/register",
        json={
            "name": "User A",
            "email": "usera@example.com",
            "password": "Password123!",
            "confirm": "Password123!",
        },
    )
    headers_a = {"Authorization": f"Bearer {reg_a.get_json()['token']}"}

    prog_a = client.post(
        "/api/progress",
        headers=headers_a,
        json={"weight": 75.0, "workoutCompleted": True},
    ).get_json()["progress"][0]
    log_a = client.post(
        "/api/nutrition-logs",
        headers=headers_a,
        json={"foodName": "Oats", "calories": 150, "protein": 5, "carbs": 27, "fat": 2.5},
    ).get_json()["nutritionLogs"][0]

    reg_b = client.post(
        "/api/auth/register",
        json={
            "name": "User B",
            "email": "userb@example.com",
            "password": "Password123!",
            "confirm": "Password123!",
        },
    )
    headers_b = {"Authorization": f"Bearer {reg_b.get_json()['token']}"}

    me_b = client.get("/api/auth/me", headers=headers_b).get_json()
    assert len(me_b["progress"]) == 0
    assert len(me_b["nutritionLogs"]) == 0

    del_prog = client.delete(f"/api/progress/{prog_a['id']}", headers=headers_b)
    assert del_prog.status_code == 404

    del_log = client.delete(f"/api/nutrition-logs/{log_a['id']}", headers=headers_b)
    assert del_log.status_code == 404


def test_rate_limiting_on_auth(client):
    client.application.config["ENABLE_RATE_LIMIT_IN_TESTS"] = True
    auth_rate_limiter.reset()

    for _ in range(15):
        res = client.post(
            "/api/auth/login",
            json={"email": "ratelimit@example.com", "password": "wrong"},
        )
        assert res.status_code == 401

    blocked = client.post(
        "/api/auth/login",
        json={"email": "ratelimit@example.com", "password": "wrong"},
    )
    assert blocked.status_code == 429
    assert blocked.get_json()["code"] == "RATE_LIMITED"


def test_firebase_auth_flow(client):
    from unittest.mock import patch, MagicMock
    import json

    # 1. Missing token
    res = client.post("/api/auth/firebase", json={})
    assert res.status_code == 400
    assert "Missing Firebase ID token" in res.get_json()["error"]

    # 2. Valid token with mocked Google response
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps({
        "email": "firebase.athlete@example.com",
        "name": "Firebase Athlete",
        "sub": "firebase_sub_12345"
    }).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_resp):
        res = client.post(
            "/api/auth/firebase",
            json={
                "idToken": "fake_firebase_google_id_token_12345",
                "gender": "female",
                "initialGoal": "weightLoss",
            },
        )
        assert res.status_code == 200
        data = res.get_json()
        assert data["user"]["email"] == "firebase.athlete@example.com"
        assert data["user"]["name"] == "Firebase Athlete"
        assert data["initialGoal"] == "fatLoss"
        assert "token" in data
        jwt_token = data["token"]

        # 3. Verify user bundle via /api/auth/me
        me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {jwt_token}"})
        assert me_resp.status_code == 200
        me_data = me_resp.get_json()
        assert me_data["user"]["email"] == "firebase.athlete@example.com"

        # 4. Repeated login with same token updates/persists smoothly
        res2 = client.post(
            "/api/auth/firebase",
            json={
                "idToken": "fake_firebase_google_id_token_12345",
            },
        )
        assert res2.status_code == 200
        assert res2.get_json()["user"]["email"] == "firebase.athlete@example.com"

