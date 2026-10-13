"""
Rule-based Fitness Calculation & Recommendation Engine.
Computes BMI (screening metric), BMR (Mifflin-St Jeor), TDEE, calorie/macro targets,
personalized diet plans, and personalized workout splits.
"""

ACTIVITY_MULTIPLIERS: dict[str, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "veryActive": 1.9,
}

GOAL_CALORIE_MULTIPLIERS: dict[str, float] = {
    "fatLoss": 0.80,
    "cutting": 0.75,
    "muscleGain": 1.10,
    "leanBulk": 1.05,
    "recomposition": 0.95,
    "maintenance": 1.00,
    "generalFitness": 1.00,
}

PROTEIN_GRAMS_PER_KG: dict[str, float] = {
    "fatLoss": 2.0,
    "cutting": 2.0,
    "muscleGain": 1.8,
    "leanBulk": 1.8,
    "recomposition": 2.0,
    "maintenance": 1.6,
    "generalFitness": 1.6,
}

FOODS: list[dict] = [
    {
        "id": "rice",
        "name": "Rice (cooked)",
        "calories": 206,
        "protein": 4,
        "carbs": 45,
        "fat": 0.4,
        "servingSize": "1 cup (186g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "grain",
        "replacements": ["roti", "bhakri", "oats"],
    },
    {
        "id": "roti",
        "name": "Whole Wheat Roti",
        "calories": 120,
        "protein": 4,
        "carbs": 22,
        "fat": 2.5,
        "servingSize": "2 rotis (60g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "grain",
        "replacements": ["rice", "bhakri", "oats"],
    },
    {
        "id": "bhakri",
        "name": "Jowar Bhakri",
        "calories": 110,
        "protein": 3,
        "carbs": 21,
        "fat": 1.5,
        "servingSize": "1 bhakri (50g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "grain",
        "replacements": ["roti", "rice", "oats"],
    },
    {
        "id": "oats",
        "name": "Oats",
        "calories": 150,
        "protein": 5,
        "carbs": 27,
        "fat": 2.5,
        "servingSize": "½ cup dry (40g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "grain",
        "replacements": ["roti", "rice", "bhakri"],
    },
    {
        "id": "eggs",
        "name": "Eggs (boiled)",
        "calories": 155,
        "protein": 13,
        "carbs": 1.1,
        "fat": 11,
        "servingSize": "2 eggs (100g)",
        "dietTypes": ["eggetarian", "nonVegetarian"],
        "category": "protein",
        "replacements": ["paneer", "soyaChunks", "dal"],
    },
    {
        "id": "chicken",
        "name": "Chicken Breast (grilled)",
        "calories": 165,
        "protein": 31,
        "carbs": 0,
        "fat": 3.6,
        "servingSize": "100g",
        "dietTypes": ["nonVegetarian"],
        "category": "protein",
        "replacements": ["eggs", "paneer", "soyaChunks"],
    },
    {
        "id": "fish",
        "name": "Fish (rohu/tilapia)",
        "calories": 128,
        "protein": 26,
        "carbs": 0,
        "fat": 2.8,
        "servingSize": "100g",
        "dietTypes": ["nonVegetarian"],
        "category": "protein",
        "replacements": ["chicken", "eggs", "soyaChunks"],
    },
    {
        "id": "paneer",
        "name": "Paneer",
        "calories": 265,
        "protein": 18,
        "carbs": 1.2,
        "fat": 20,
        "servingSize": "100g",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "protein",
        "replacements": ["eggs", "soyaChunks", "dal"],
    },
    {
        "id": "soyaChunks",
        "name": "Soya Chunks (cooked)",
        "calories": 108,
        "protein": 15,
        "carbs": 6,
        "fat": 0.5,
        "servingSize": "½ cup (50g dry)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "protein",
        "replacements": ["paneer", "dal", "chana"],
    },
    {
        "id": "dal",
        "name": "Dal (masoor/moong)",
        "calories": 116,
        "protein": 9,
        "carbs": 20,
        "fat": 0.4,
        "servingSize": "1 cup cooked (198g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "protein",
        "replacements": ["chana", "paneer", "soyaChunks"],
    },
    {
        "id": "chana",
        "name": "Chana (chickpeas)",
        "calories": 164,
        "protein": 9,
        "carbs": 27,
        "fat": 2.6,
        "servingSize": "1 cup cooked (164g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "protein",
        "replacements": ["dal", "soyaChunks", "paneer"],
    },
    {
        "id": "banana",
        "name": "Banana",
        "calories": 89,
        "protein": 1.1,
        "carbs": 23,
        "fat": 0.3,
        "servingSize": "1 medium (118g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "fruit",
        "replacements": ["apple"],
    },
    {
        "id": "apple",
        "name": "Apple",
        "calories": 72,
        "protein": 0.4,
        "carbs": 19,
        "fat": 0.2,
        "servingSize": "1 medium (182g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "fruit",
        "replacements": ["banana"],
    },
    {
        "id": "mixedVeg",
        "name": "Mixed Vegetables (cooked)",
        "calories": 72,
        "protein": 3,
        "carbs": 13,
        "fat": 0.5,
        "servingSize": "1 cup (150g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "vegetable",
        "replacements": ["dal", "chana"],
    },
    {
        "id": "milk",
        "name": "Milk (toned)",
        "calories": 122,
        "protein": 8,
        "carbs": 12,
        "fat": 4,
        "servingSize": "1 cup (244ml)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "dairy",
        "replacements": ["curd", "paneer"],
    },
    {
        "id": "curd",
        "name": "Curd (low-fat)",
        "calories": 100,
        "protein": 11,
        "carbs": 8,
        "fat": 1.5,
        "servingSize": "1 cup (245g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "dairy",
        "replacements": ["milk", "paneer"],
    },
    {
        "id": "almonds",
        "name": "Almonds",
        "calories": 164,
        "protein": 6,
        "carbs": 6,
        "fat": 14,
        "servingSize": "28g (about 23 almonds)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "nuts",
        "replacements": ["peanutButter"],
    },
    {
        "id": "peanutButter",
        "name": "Peanut Butter",
        "calories": 190,
        "protein": 8,
        "carbs": 6,
        "fat": 16,
        "servingSize": "2 tbsp (32g)",
        "dietTypes": ["vegetarian", "eggetarian", "nonVegetarian"],
        "category": "nuts",
        "replacements": ["almonds"],
    },
]

EXERCISES: list[dict] = [
    {
        "id": "pushup",
        "name": "Push-Up",
        "muscleGroup": "Chest, Triceps, Shoulders",
        "sets": 3,
        "reps": "12–15",
        "restTime": "60s",
        "difficulty": "beginner",
        "location": ["home", "gym"],
        "goals": ["generalFitness", "muscleGain", "leanBulk", "recomposition", "maintenance", "fatLoss", "cutting"],
        "instructions": "Keep your body in a straight line from head to heels. Lower chest to just above the floor, then push up explosively.",
        "equipment": "None",
    },
    {
        "id": "benchPress",
        "name": "Barbell Bench Press",
        "muscleGroup": "Chest, Triceps, Shoulders",
        "sets": 4,
        "reps": "8–10",
        "restTime": "90s",
        "difficulty": "intermediate",
        "location": ["gym"],
        "goals": ["muscleGain", "leanBulk", "recomposition", "generalFitness", "fatLoss", "cutting"],
        "instructions": "Lie flat, grip bar slightly wider than shoulder-width. Lower bar to mid-chest, press back up. Keep feet flat on floor.",
        "equipment": "Barbell, Bench",
    },
    {
        "id": "inclineDumbbell",
        "name": "Incline Dumbbell Press",
        "muscleGroup": "Upper Chest, Shoulders",
        "sets": 3,
        "reps": "10–12",
        "restTime": "75s",
        "difficulty": "intermediate",
        "location": ["gym"],
        "goals": ["muscleGain", "leanBulk", "generalFitness", "recomposition"],
        "instructions": "Set bench to 30–45°. Press dumbbells from chest level to full extension. Control the descent.",
        "equipment": "Dumbbells, Incline Bench",
    },
    {
        "id": "pullup",
        "name": "Pull-Up",
        "muscleGroup": "Back, Biceps",
        "sets": 3,
        "reps": "6–10",
        "restTime": "90s",
        "difficulty": "intermediate",
        "location": ["home", "gym"],
        "goals": ["muscleGain", "leanBulk", "recomposition", "generalFitness", "fatLoss"],
        "instructions": "Hang from bar with overhand grip. Pull yourself up until chin clears bar. Lower with control.",
        "equipment": "Pull-up bar",
    },
    {
        "id": "barbellRow",
        "name": "Bent-Over Barbell Row",
        "muscleGroup": "Back, Rear Delts, Biceps",
        "sets": 4,
        "reps": "8–10",
        "restTime": "90s",
        "difficulty": "intermediate",
        "location": ["gym"],
        "goals": ["muscleGain", "leanBulk", "recomposition", "generalFitness"],
        "instructions": "Hinge at hips, back flat, bar hanging. Pull bar to lower chest. Squeeze shoulder blades at top.",
        "equipment": "Barbell",
    },
    {
        "id": "latPulldown",
        "name": "Lat Pulldown",
        "muscleGroup": "Back, Biceps",
        "sets": 3,
        "reps": "10–12",
        "restTime": "75s",
        "difficulty": "beginner",
        "location": ["gym"],
        "goals": ["muscleGain", "leanBulk", "generalFitness", "recomposition", "maintenance", "fatLoss"],
        "instructions": "Sit with thighs secured. Pull bar to upper chest with elbows driving down. Return with control.",
        "equipment": "Cable machine",
    },
    {
        "id": "squat",
        "name": "Barbell Back Squat",
        "muscleGroup": "Quads, Glutes, Hamstrings",
        "sets": 4,
        "reps": "8–10",
        "restTime": "120s",
        "difficulty": "intermediate",
        "location": ["gym"],
        "goals": ["muscleGain", "leanBulk", "fatLoss", "cutting", "recomposition", "generalFitness"],
        "instructions": "Bar on upper traps. Descend until thighs parallel to floor. Drive up through heels, knees tracking toes.",
        "equipment": "Barbell, Squat rack",
    },
    {
        "id": "bodyweightSquat",
        "name": "Bodyweight Squat",
        "muscleGroup": "Quads, Glutes, Hamstrings",
        "sets": 3,
        "reps": "15–20",
        "restTime": "60s",
        "difficulty": "beginner",
        "location": ["home", "gym"],
        "goals": ["fatLoss", "cutting", "generalFitness", "maintenance", "recomposition", "muscleGain"],
        "instructions": "Feet shoulder-width apart, toes slightly out. Descend until thighs parallel, keeping chest tall.",
        "equipment": "None",
    },
    {
        "id": "romanianDeadlift",
        "name": "Romanian Deadlift",
        "muscleGroup": "Hamstrings, Glutes, Lower Back",
        "sets": 3,
        "reps": "10–12",
        "restTime": "90s",
        "difficulty": "intermediate",
        "location": ["gym"],
        "goals": ["muscleGain", "leanBulk", "fatLoss", "recomposition", "generalFitness"],
        "instructions": "Hold bar at hips. Hinge forward, pushing hips back, bar slides down legs. Feel hamstring stretch, drive hips forward to return.",
        "equipment": "Barbell or Dumbbells",
    },
    {
        "id": "lunge",
        "name": "Walking Lunge",
        "muscleGroup": "Quads, Glutes, Hamstrings",
        "sets": 3,
        "reps": "12 each leg",
        "restTime": "60s",
        "difficulty": "beginner",
        "location": ["home", "gym"],
        "goals": ["fatLoss", "cutting", "generalFitness", "maintenance", "recomposition", "muscleGain", "leanBulk"],
        "instructions": "Step forward, lower rear knee toward floor, push off front foot to stand. Alternate legs.",
        "equipment": "None",
    },
    {
        "id": "ohp",
        "name": "Overhead Press",
        "muscleGroup": "Shoulders, Triceps",
        "sets": 4,
        "reps": "8–10",
        "restTime": "90s",
        "difficulty": "intermediate",
        "location": ["gym"],
        "goals": ["muscleGain", "leanBulk", "generalFitness", "recomposition"],
        "instructions": "Bar at shoulder height. Press bar overhead to full extension. Lower with control. Keep core braced.",
        "equipment": "Barbell",
    },
    {
        "id": "pikePushup",
        "name": "Pike Push-Up",
        "muscleGroup": "Shoulders, Triceps",
        "sets": 3,
        "reps": "10–12",
        "restTime": "60s",
        "difficulty": "beginner",
        "location": ["home", "gym"],
        "goals": ["generalFitness", "recomposition", "maintenance", "muscleGain", "leanBulk"],
        "instructions": "Form inverted V shape with hips high. Bend elbows to lower head toward floor. Push back up.",
        "equipment": "None",
    },
    {
        "id": "plank",
        "name": "Plank",
        "muscleGroup": "Core, Shoulders",
        "sets": 3,
        "reps": "30–60s hold",
        "restTime": "45s",
        "difficulty": "beginner",
        "location": ["home", "gym"],
        "goals": ["fatLoss", "cutting", "generalFitness", "maintenance", "recomposition", "muscleGain", "leanBulk"],
        "instructions": "Forearms on floor, body in straight line. Engage core, glutes, and quads. Breathe steadily.",
        "equipment": "None",
    },
    {
        "id": "crunches",
        "name": "Bicycle Crunches",
        "muscleGroup": "Abs, Obliques",
        "sets": 3,
        "reps": "20 reps",
        "restTime": "45s",
        "difficulty": "beginner",
        "location": ["home", "gym"],
        "goals": ["fatLoss", "cutting", "generalFitness", "maintenance", "recomposition"],
        "instructions": "Lie on back, hands behind head. Alternate bringing elbow to opposite knee with a twisting motion.",
        "equipment": "None",
    },
    {
        "id": "jumpingJacks",
        "name": "Jumping Jacks",
        "muscleGroup": "Full Body, Cardio",
        "sets": 3,
        "reps": "30 reps",
        "restTime": "30s",
        "difficulty": "beginner",
        "location": ["home", "gym"],
        "goals": ["fatLoss", "cutting", "generalFitness", "maintenance"],
        "instructions": "Jump feet out while raising arms overhead, then jump back to start. Keep a steady, controlled pace.",
        "equipment": "None",
    },
    {
        "id": "burpee",
        "name": "Burpee",
        "muscleGroup": "Full Body, Cardio",
        "sets": 3,
        "reps": "10–12",
        "restTime": "60s",
        "difficulty": "intermediate",
        "location": ["home", "gym"],
        "goals": ["fatLoss", "cutting", "generalFitness", "recomposition"],
        "instructions": "Stand → squat → jump feet back to plank → push-up → jump feet in → jump up with arms overhead.",
        "equipment": "None",
    },
]


def calculate_metrics(assessment: dict) -> dict:
    """
    Calculates BMI (screening metric), BMR (Mifflin-St Jeor equation),
    TDEE, and daily macro targets based on user assessment inputs.
    """
    height_cm = max(100.0, min(260.0, float(assessment.get("height", 170))))
    weight_kg = max(30.0, min(350.0, float(assessment.get("weight", 70))))
    age = max(15, min(100, int(assessment.get("age", 25))))
    gender = assessment.get("gender", "male")
    activity_level = assessment.get("activityLevel", "moderate")
    fitness_goal = assessment.get("fitnessGoal", "generalFitness")

    height_m = height_cm / 100.0
    bmi = weight_kg / (height_m * height_m)

    if bmi < 18.5:
        bmi_category = "Underweight"
    elif bmi < 25.0:
        bmi_category = "Normal"
    elif bmi < 30.0:
        bmi_category = "Overweight"
    else:
        bmi_category = "Obese"

    # Mifflin-St Jeor Equation
    if gender == "male":
        bmr = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age + 5.0
    else:
        bmr = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age - 161.0

    activity_mult = ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    tdee = bmr * activity_mult

    goal_mult = GOAL_CALORIE_MULTIPLIERS.get(fitness_goal, 1.0)
    min_calories = 1500 if gender == "male" else 1200
    calorie_target = max(min_calories, round(tdee * goal_mult))

    protein_per_kg = PROTEIN_GRAMS_PER_KG.get(fitness_goal, 1.6)
    protein_target = round(min(weight_kg * protein_per_kg, (calorie_target * 0.35) / 4.0))
    fat_target = round((calorie_target * 0.25) / 9.0)
    carb_target = max(
        0,
        round((calorie_target - protein_target * 4.0 - fat_target * 9.0) / 4.0),
    )

    return {
        "bmi": round(bmi, 1),
        "bmiCategory": bmi_category,
        "bmr": round(bmr),
        "tdee": round(tdee),
        "calorieTarget": int(calorie_target),
        "proteinTarget": int(protein_target),
        "carbTarget": int(carb_target),
        "fatTarget": int(fat_target),
    }


def generate_diet_plan(assessment: dict, metrics: dict) -> list[dict]:
    """Generates a structured daily meal plan scaled to the user's calorie target."""
    diet_type = assessment.get("dietType", "nonVegetarian")
    meals_per_day = max(2, min(6, int(assessment.get("mealsPerDay", 3))))
    calorie_target = float(metrics.get("calorieTarget", 2000))

    allowed = [f for f in FOODS if diet_type in f["dietTypes"]]
    grains = [f for f in allowed if f["category"] == "grain"]
    proteins = [f for f in allowed if f["category"] == "protein"]
    fruits = [f for f in allowed if f["category"] == "fruit"]
    veggies = [f for f in allowed if f["category"] == "vegetable"]
    dairy = [f for f in allowed if f["category"] == "dairy"]

    meal_names = [
        "Breakfast",
        "Mid-Morning Snack",
        "Lunch",
        "Evening Snack",
        "Dinner",
        "Post-Workout",
    ]

    almonds = next((f for f in allowed if f["id"] == "almonds"), proteins[0] if proteins else None)
    pb = next((f for f in allowed if f["id"] == "peanutButter"), almonds)

    templates = [
        {
            "name": "Breakfast",
            "items": [
                {"food": grains[1] if len(grains) > 1 else grains[0], "qty": 1.0},
                {"food": proteins[0] if proteins else grains[0], "qty": 1.0},
                {"food": dairy[0] if dairy else fruits[0], "qty": 1.0},
            ],
        },
        {
            "name": "Mid-Morning Snack",
            "items": [
                {"food": fruits[0], "qty": 1.0},
                {"food": almonds, "qty": 1.0},
            ],
        },
        {
            "name": "Lunch",
            "items": [
                {"food": grains[0], "qty": 1.5},
                {"food": proteins[1] if len(proteins) > 1 else proteins[0], "qty": 1.0},
                {"food": veggies[0] if veggies else fruits[0], "qty": 1.0},
                {"food": dairy[1] if len(dairy) > 1 else dairy[0], "qty": 1.0},
            ],
        },
        {
            "name": "Evening Snack",
            "items": [
                {"food": pb, "qty": 1.0},
                {"food": fruits[1] if len(fruits) > 1 else fruits[0], "qty": 1.0},
            ],
        },
        {
            "name": "Dinner",
            "items": [
                {"food": grains[0], "qty": 1.0},
                {"food": proteins[2] if len(proteins) > 2 else proteins[0], "qty": 1.0},
                {"food": veggies[0] if veggies else fruits[0], "qty": 1.0},
            ],
        },
        {
            "name": "Post-Workout",
            "items": [
                {"food": dairy[0] if dairy else proteins[0], "qty": 1.0},
                {"food": fruits[0], "qty": 1.0},
            ],
        },
    ]

    calories_per_meal = calorie_target / meals_per_day
    meals: list[dict] = []

    for i in range(meals_per_day):
        tpl = templates[i % len(templates)]
        valid_items = [item for item in tpl["items"] if item["food"] is not None]
        base_cal = sum(item["food"]["calories"] * item["qty"] for item in valid_items)
        scale = (calories_per_meal / base_cal) if base_cal > 0 else 1.0

        scaled_foods = []
        tot_cal = 0.0
        tot_prot = 0.0
        tot_carb = 0.0
        tot_fat = 0.0

        for item in valid_items:
            food = item["food"]
            qty = round(item["qty"] * scale, 2)
            scaled_foods.append({"food": food, "quantity": qty})
            tot_cal += food["calories"] * qty
            tot_prot += food["protein"] * qty
            tot_carb += food["carbs"] * qty
            tot_fat += food["fat"] * qty

        meals.append(
            {
                "mealName": meal_names[i] if i < len(meal_names) else f"Meal {i + 1}",
                "foods": scaled_foods,
                "totalCalories": round(tot_cal),
                "totalProtein": round(tot_prot),
                "totalCarbs": round(tot_carb),
                "totalFat": round(tot_fat),
            }
        )

    return meals


def generate_workout_plan(assessment: dict) -> list[dict]:
    """Generates a multi-day workout schedule tailored to goal, experience, and location."""
    fitness_goal = assessment.get("fitnessGoal", "generalFitness")
    workout_location = assessment.get("workoutLocation", "gym")
    days_per_week = max(2, min(6, int(assessment.get("workoutDaysPerWeek", 4))))
    experience = assessment.get("experienceLevel", "beginner")

    def is_difficulty_allowed(diff: str) -> bool:
        if experience == "advanced":
            return True
        if experience == "intermediate":
            return diff != "advanced"
        return diff == "beginner"

    eligible = [
        ex
        for ex in EXERCISES
        if workout_location in ex["location"]
        and fitness_goal in ex["goals"]
        and is_difficulty_allowed(ex["difficulty"])
    ]
    if not eligible:
        eligible = [ex for ex in EXERCISES if workout_location in ex["location"]]

    push = [e for e in eligible if "Chest" in e["muscleGroup"] or "Shoulders" in e["muscleGroup"]]
    pull = [e for e in eligible if "Back" in e["muscleGroup"] or "Biceps" in e["muscleGroup"]]
    legs = [
        e
        for e in eligible
        if "Quad" in e["muscleGroup"]
        or "Glute" in e["muscleGroup"]
        or "Hamstring" in e["muscleGroup"]
    ]
    core = [e for e in eligible if "Core" in e["muscleGroup"] or "Abs" in e["muscleGroup"]]
    cardio = [e for e in eligible if "Cardio" in e["muscleGroup"]]
    full = eligible[:5]

    templates = [
        {"day": "Day 1", "focus": "Push (Chest & Shoulders)", "exercises": push[:3] + core[:1]},
        {"day": "Day 2", "focus": "Pull (Back & Biceps)", "exercises": pull[:3] + core[:1]},
        {"day": "Day 3", "focus": "Legs & Core", "exercises": legs[:3] + core[:2]},
        {"day": "Day 4", "focus": "Full Body Conditioning", "exercises": full[:4] + cardio[:1]},
        {"day": "Day 5", "focus": "Upper Body Hypertrophy", "exercises": push[:2] + pull[:2] + core[:1]},
        {"day": "Day 6", "focus": "Cardio & Core Mobility", "exercises": cardio[:2] + core[:2]},
    ]

    result = []
    for i in range(days_per_week):
        tpl = templates[i]
        exs = tpl["exercises"] if tpl["exercises"] else eligible[:4]
        result.append(
            {
                "day": f"Day {i + 1}",
                "focus": tpl["focus"],
                "exercises": exs,
            }
        )
    return result
