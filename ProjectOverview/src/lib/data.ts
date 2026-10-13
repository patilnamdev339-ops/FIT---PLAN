import type {
  FoodItem,
  Exercise,
  WorkoutDay,
  AssessmentData,
  FitnessMetrics,
  MealPlan,
  DietType,
} from "./types";

export const FOODS: FoodItem[] = [
  {
    id: "rice",
    name: "Rice (cooked)",
    calories: 206,
    protein: 4,
    carbs: 45,
    fat: 0.4,
    servingSize: "1 cup (186g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "grain",
    replacements: ["roti", "bhakri", "potato"],
  },
  {
    id: "roti",
    name: "Whole Wheat Roti",
    calories: 120,
    protein: 4,
    carbs: 22,
    fat: 2.5,
    servingSize: "2 rotis (60g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "grain",
    replacements: ["rice", "bhakri", "oats"],
  },
  {
    id: "bhakri",
    name: "Jowar Bhakri",
    calories: 110,
    protein: 3,
    carbs: 21,
    fat: 1.5,
    servingSize: "1 bhakri (50g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "grain",
    replacements: ["roti", "rice", "oats"],
  },
  {
    id: "oats",
    name: "Oats",
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 2.5,
    servingSize: "½ cup dry (40g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "grain",
    replacements: ["roti", "rice", "bhakri"],
  },
  {
    id: "eggs",
    name: "Eggs (boiled)",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    servingSize: "2 eggs (100g)",
    dietTypes: ["eggetarian", "nonVegetarian"],
    category: "protein",
    replacements: ["paneer", "soyaChunks", "dal"],
  },
  {
    id: "chicken",
    name: "Chicken Breast (grilled)",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSize: "100g",
    dietTypes: ["nonVegetarian"],
    category: "protein",
    replacements: ["eggs", "paneer", "soyaChunks"],
  },
  {
    id: "fish",
    name: "Fish (rohu/tilapia)",
    calories: 128,
    protein: 26,
    carbs: 0,
    fat: 2.8,
    servingSize: "100g",
    dietTypes: ["nonVegetarian"],
    category: "protein",
    replacements: ["chicken", "eggs", "soyaChunks"],
  },
  {
    id: "paneer",
    name: "Paneer",
    calories: 265,
    protein: 18,
    carbs: 1.2,
    fat: 20,
    servingSize: "100g",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "protein",
    replacements: ["eggs", "soyaChunks", "dal"],
  },
  {
    id: "soyaChunks",
    name: "Soya Chunks (cooked)",
    calories: 108,
    protein: 15,
    carbs: 6,
    fat: 0.5,
    servingSize: "½ cup (50g dry)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "protein",
    replacements: ["paneer", "dal", "chana"],
  },
  {
    id: "dal",
    name: "Dal (masoor/moong)",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    servingSize: "1 cup cooked (198g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "protein",
    replacements: ["chana", "paneer", "soyaChunks"],
  },
  {
    id: "chana",
    name: "Chana (chickpeas)",
    calories: 164,
    protein: 9,
    carbs: 27,
    fat: 2.6,
    servingSize: "1 cup cooked (164g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "protein",
    replacements: ["dal", "soyaChunks", "paneer"],
  },
  {
    id: "banana",
    name: "Banana",
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    servingSize: "1 medium (118g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "fruit",
    replacements: ["apple", "mango"],
  },
  {
    id: "apple",
    name: "Apple",
    calories: 72,
    protein: 0.4,
    carbs: 19,
    fat: 0.2,
    servingSize: "1 medium (182g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "fruit",
    replacements: ["banana", "orange"],
  },
  {
    id: "mixedVeg",
    name: "Mixed Vegetables (cooked)",
    calories: 72,
    protein: 3,
    carbs: 13,
    fat: 0.5,
    servingSize: "1 cup (150g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "vegetable",
    replacements: ["spinach", "broccoli"],
  },
  {
    id: "milk",
    name: "Milk (toned)",
    calories: 122,
    protein: 8,
    carbs: 12,
    fat: 4,
    servingSize: "1 cup (244ml)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "dairy",
    replacements: ["curd", "paneer"],
  },
  {
    id: "curd",
    name: "Curd (low-fat)",
    calories: 100,
    protein: 11,
    carbs: 8,
    fat: 1.5,
    servingSize: "1 cup (245g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "dairy",
    replacements: ["milk", "paneer"],
  },
  {
    id: "almonds",
    name: "Almonds",
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    servingSize: "28g (about 23 almonds)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "nuts",
    replacements: ["walnuts", "peanuts"],
  },
  {
    id: "peanutButter",
    name: "Peanut Butter",
    calories: 190,
    protein: 8,
    carbs: 6,
    fat: 16,
    servingSize: "2 tbsp (32g)",
    dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
    category: "nuts",
    replacements: ["almonds", "walnuts"],
  },
];

export const FOOD_MAP: Record<string, FoodItem> = Object.fromEntries(
  FOODS.map((f) => [f.id, f])
);

function filterFoods(dietType: DietType): FoodItem[] {
  return FOODS.filter((f) => f.dietTypes.includes(dietType));
}

const MEAL_NAMES = [
  "Breakfast",
  "Mid-Morning Snack",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Post-Workout",
];

export function generateDietPlan(
  assessment: AssessmentData,
  metrics: FitnessMetrics
): MealPlan[] {
  const allowed = filterFoods(assessment.dietType);
  const grains = allowed.filter((f) => f.category === "grain");
  const proteins = allowed.filter((f) => f.category === "protein");
  const fruits = allowed.filter((f) => f.category === "fruit");
  const veggies = allowed.filter((f) => f.category === "vegetable");
  const dairy = allowed.filter((f) => f.category === "dairy");

  const meals: MealPlan[] = [];
  const caloriesPerMeal = metrics.calorieTarget / assessment.mealsPerDay;

  const mealTemplates: {
    name: string;
    items: { food: FoodItem; qty: number }[];
  }[] = [
    {
      name: "Breakfast",
      items: [
        { food: grains[1] ?? grains[0], qty: 1 },
        { food: proteins[0] ?? proteins[1], qty: 1 },
        { food: dairy[0] ?? dairy[1], qty: 1 },
      ],
    },
    {
      name: "Mid-Morning Snack",
      items: [
        { food: fruits[0], qty: 1 },
        { food: allowed.find((f) => f.id === "almonds") ?? proteins[0], qty: 1 },
      ],
    },
    {
      name: "Lunch",
      items: [
        { food: grains[0], qty: 1.5 },
        { food: proteins[1] ?? proteins[0], qty: 1 },
        { food: veggies[0] ?? fruits[0], qty: 1 },
        { food: dairy[1] ?? dairy[0], qty: 1 },
      ],
    },
    {
      name: "Evening Snack",
      items: [
        {
          food:
            allowed.find((f) => f.id === "peanutButter") ??
            allowed.find((f) => f.id === "almonds") ??
            fruits[0],
          qty: 1,
        },
        { food: fruits[1] ?? fruits[0], qty: 1 },
      ],
    },
    {
      name: "Dinner",
      items: [
        { food: grains[0], qty: 1 },
        { food: proteins[2] ?? proteins[0], qty: 1 },
        { food: veggies[0] ?? fruits[0], qty: 1 },
      ],
    },
    {
      name: "Post-Workout",
      items: [
        { food: dairy[0] ?? proteins[0], qty: 1 },
        { food: fruits[0], qty: 1 },
      ],
    },
  ];

  for (let i = 0; i < assessment.mealsPerDay; i++) {
    const template = mealTemplates[i % mealTemplates.length];
    const foods = template.items
      .filter((item) => item.food !== undefined)
      .map((item) => ({ food: item.food, quantity: item.qty }));

    const baseCalories = foods.reduce(
      (total, { food, quantity }) => total + food.calories * quantity,
      0,
    );
    const scale = baseCalories > 0 ? caloriesPerMeal / baseCalories : 1;
    const scaledFoods = foods.map(({ food, quantity }) => ({
      food,
      quantity: Math.round(quantity * scale * 100) / 100,
    }));

    const totals = scaledFoods.reduce(
      (acc, { food, quantity }) => ({
        cal: acc.cal + food.calories * quantity,
        prot: acc.prot + food.protein * quantity,
        carb: acc.carb + food.carbs * quantity,
        fat: acc.fat + food.fat * quantity,
      }),
      { cal: 0, prot: 0, carb: 0, fat: 0 }
    );

    meals.push({
      mealName: MEAL_NAMES[i] ?? `Meal ${i + 1}`,
      foods: scaledFoods,
      totalCalories: Math.round(totals.cal),
      totalProtein: Math.round(totals.prot),
      totalCarbs: Math.round(totals.carb),
      totalFat: Math.round(totals.fat),
    });
  }

  return meals;
}

const EXERCISES: Exercise[] = [
  // Push
  {
    id: "pushup",
    name: "Push-Up",
    muscleGroup: "Chest, Triceps, Shoulders",
    sets: 3,
    reps: "12–15",
    restTime: "60s",
    difficulty: "beginner",
    location: ["home", "gym"],
    goals: [
      "generalFitness",
      "muscleGain",
      "leanBulk",
      "recomposition",
      "maintenance",
    ],
    instructions:
      "Keep your body in a straight line from head to heels. Lower chest to just above the floor, then push up explosively.",
    equipment: "None",
  },
  {
    id: "benchPress",
    name: "Barbell Bench Press",
    muscleGroup: "Chest, Triceps, Shoulders",
    sets: 4,
    reps: "8–10",
    restTime: "90s",
    difficulty: "intermediate",
    location: ["gym"],
    goals: ["muscleGain", "leanBulk", "recomposition", "generalFitness"],
    instructions:
      "Lie flat, grip bar slightly wider than shoulder-width. Lower bar to mid-chest, press back up. Keep feet flat on floor.",
    equipment: "Barbell, Bench",
  },
  {
    id: "inclineDumbbell",
    name: "Incline Dumbbell Press",
    muscleGroup: "Upper Chest, Shoulders",
    sets: 3,
    reps: "10–12",
    restTime: "75s",
    difficulty: "intermediate",
    location: ["gym"],
    goals: ["muscleGain", "leanBulk", "generalFitness"],
    instructions:
      "Set bench to 30–45°. Press dumbbells from chest level to full extension. Control the descent.",
    equipment: "Dumbbells, Incline Bench",
  },
  // Pull
  {
    id: "pullup",
    name: "Pull-Up",
    muscleGroup: "Back, Biceps",
    sets: 3,
    reps: "6–10",
    restTime: "90s",
    difficulty: "intermediate",
    location: ["home", "gym"],
    goals: ["muscleGain", "leanBulk", "recomposition", "generalFitness"],
    instructions:
      "Hang from bar with overhand grip. Pull yourself up until chin clears bar. Lower with control.",
    equipment: "Pull-up bar",
  },
  {
    id: "barbellRow",
    name: "Bent-Over Barbell Row",
    muscleGroup: "Back, Rear Delts, Biceps",
    sets: 4,
    reps: "8–10",
    restTime: "90s",
    difficulty: "intermediate",
    location: ["gym"],
    goals: ["muscleGain", "leanBulk", "recomposition"],
    instructions:
      "Hinge at hips, back flat, bar hanging. Pull bar to lower chest. Squeeze shoulder blades at top.",
    equipment: "Barbell",
  },
  {
    id: "latPulldown",
    name: "Lat Pulldown",
    muscleGroup: "Back, Biceps",
    sets: 3,
    reps: "10–12",
    restTime: "75s",
    difficulty: "beginner",
    location: ["gym"],
    goals: [
      "muscleGain",
      "leanBulk",
      "generalFitness",
      "recomposition",
      "maintenance",
    ],
    instructions:
      "Sit with thighs secured. Pull bar to upper chest with elbows driving down. Return with control.",
    equipment: "Cable machine",
  },
  // Legs
  {
    id: "squat",
    name: "Barbell Back Squat",
    muscleGroup: "Quads, Glutes, Hamstrings",
    sets: 4,
    reps: "8–10",
    restTime: "120s",
    difficulty: "intermediate",
    location: ["gym"],
    goals: ["muscleGain", "leanBulk", "fatLoss", "cutting", "recomposition"],
    instructions:
      "Bar on upper traps. Descend until thighs parallel to floor. Drive up through heels, knees tracking toes.",
    equipment: "Barbell, Squat rack",
  },
  {
    id: "bodyweightSquat",
    name: "Bodyweight Squat",
    muscleGroup: "Quads, Glutes, Hamstrings",
    sets: 3,
    reps: "15–20",
    restTime: "60s",
    difficulty: "beginner",
    location: ["home", "gym"],
    goals: [
      "fatLoss",
      "cutting",
      "generalFitness",
      "maintenance",
      "recomposition",
    ],
    instructions:
      "Feet shoulder-width apart, toes slightly out. Descend until thighs parallel, keeping chest tall.",
    equipment: "None",
  },
  {
    id: "romanianDeadlift",
    name: "Romanian Deadlift",
    muscleGroup: "Hamstrings, Glutes, Lower Back",
    sets: 3,
    reps: "10–12",
    restTime: "90s",
    difficulty: "intermediate",
    location: ["gym"],
    goals: ["muscleGain", "leanBulk", "fatLoss", "recomposition"],
    instructions:
      "Hold bar at hips. Hinge forward, pushing hips back, bar slides down legs. Feel hamstring stretch, drive hips forward to return.",
    equipment: "Barbell or Dumbbells",
  },
  {
    id: "lunge",
    name: "Walking Lunge",
    muscleGroup: "Quads, Glutes, Hamstrings",
    sets: 3,
    reps: "12 each leg",
    restTime: "60s",
    difficulty: "beginner",
    location: ["home", "gym"],
    goals: [
      "fatLoss",
      "cutting",
      "generalFitness",
      "maintenance",
      "recomposition",
    ],
    instructions:
      "Step forward, lower rear knee toward floor, push off front foot to stand. Alternate legs.",
    equipment: "None",
  },
  // Shoulders
  {
    id: "ohp",
    name: "Overhead Press",
    muscleGroup: "Shoulders, Triceps",
    sets: 4,
    reps: "8–10",
    restTime: "90s",
    difficulty: "intermediate",
    location: ["gym"],
    goals: ["muscleGain", "leanBulk", "generalFitness"],
    instructions:
      "Bar at shoulder height. Press bar overhead to full extension. Lower with control. Keep core braced.",
    equipment: "Barbell",
  },
  {
    id: "pikePushup",
    name: "Pike Push-Up",
    muscleGroup: "Shoulders, Triceps",
    sets: 3,
    reps: "10–12",
    restTime: "60s",
    difficulty: "beginner",
    location: ["home"],
    goals: ["generalFitness", "recomposition", "maintenance", "muscleGain"],
    instructions:
      "Form inverted V shape with hips high. Bend elbows to lower head toward floor. Push back up.",
    equipment: "None",
  },
  // Core
  {
    id: "plank",
    name: "Plank",
    muscleGroup: "Core, Shoulders",
    sets: 3,
    reps: "30–60s hold",
    restTime: "45s",
    difficulty: "beginner",
    location: ["home", "gym"],
    goals: [
      "fatLoss",
      "cutting",
      "generalFitness",
      "maintenance",
      "recomposition",
      "muscleGain",
      "leanBulk",
    ],
    instructions:
      "Forearms on floor, body in straight line. Engage core, glutes, and quads. Breathe steadily.",
    equipment: "None",
  },
  {
    id: "crunches",
    name: "Bicycle Crunches",
    muscleGroup: "Abs, Obliques",
    sets: 3,
    reps: "20 reps",
    restTime: "45s",
    difficulty: "beginner",
    location: ["home", "gym"],
    goals: ["fatLoss", "cutting", "generalFitness", "maintenance"],
    instructions:
      "Lie on back, hands behind head. Alternate bringing elbow to opposite knee with a twisting motion.",
    equipment: "None",
  },
  // Cardio
  {
    id: "jumpingJacks",
    name: "Jumping Jacks",
    muscleGroup: "Full Body, Cardio",
    sets: 3,
    reps: "30 reps",
    restTime: "30s",
    difficulty: "beginner",
    location: ["home", "gym"],
    goals: ["fatLoss", "cutting", "generalFitness"],
    instructions:
      "Jump feet out while raising arms overhead, then jump back to start. Keep a steady, controlled pace.",
    equipment: "None",
  },
  {
    id: "burpee",
    name: "Burpee",
    muscleGroup: "Full Body, Cardio",
    sets: 3,
    reps: "10–12",
    restTime: "60s",
    difficulty: "intermediate",
    location: ["home", "gym"],
    goals: ["fatLoss", "cutting", "generalFitness", "recomposition"],
    instructions:
      "Stand → squat → jump feet back to plank → push-up → jump feet in → jump up with arms overhead.",
    equipment: "None",
  },
];

export function generateWorkoutPlan(assessment: AssessmentData): WorkoutDay[] {
  const { fitnessGoal, workoutLocation, workoutDaysPerWeek, experienceLevel } =
    assessment;

  const eligible = EXERCISES.filter(
    (e) =>
      e.location.includes(workoutLocation) &&
      e.goals.includes(fitnessGoal) &&
      (experienceLevel === "advanced" ||
        (experienceLevel === "intermediate" &&
          e.difficulty !== "advanced") ||
        (experienceLevel === "beginner" && e.difficulty === "beginner"))
  );

  const getPush = () =>
    eligible.filter(
      (e) =>
        e.muscleGroup.includes("Chest") || e.muscleGroup.includes("Shoulders")
    );
  const getPull = () =>
    eligible.filter(
      (e) =>
        e.muscleGroup.includes("Back") || e.muscleGroup.includes("Biceps")
    );
  const getLegs = () =>
    eligible.filter(
      (e) =>
        e.muscleGroup.includes("Quad") ||
        e.muscleGroup.includes("Glute") ||
        e.muscleGroup.includes("Hamstring")
    );
  const getCore = () =>
    eligible.filter(
      (e) => e.muscleGroup.includes("Core") || e.muscleGroup.includes("Abs")
    );
  const getCardio = () =>
    eligible.filter((e) => e.muscleGroup.includes("Cardio"));
  const getFull = () => eligible.slice(0, 5);

  const dayNames = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];

  const templates: WorkoutDay[] = [
    {
      day: "Day 1",
      focus: "Push (Chest & Shoulders)",
      exercises: [...getPush().slice(0, 3), ...getCore().slice(0, 1)],
    },
    {
      day: "Day 2",
      focus: "Pull (Back & Biceps)",
      exercises: [...getPull().slice(0, 3), ...getCore().slice(0, 1)],
    },
    {
      day: "Day 3",
      focus: "Legs & Core",
      exercises: [...getLegs().slice(0, 3), ...getCore().slice(0, 2)],
    },
    {
      day: "Day 4",
      focus: "Full Body",
      exercises: [...getFull().slice(0, 4), ...getCardio().slice(0, 1)],
    },
    {
      day: "Day 5",
      focus: "Upper Body",
      exercises: [
        ...getPush().slice(0, 2),
        ...getPull().slice(0, 2),
        ...getCore().slice(0, 1),
      ],
    },
    {
      day: "Day 6",
      focus: "Cardio & Core",
      exercises: [...getCardio().slice(0, 2), ...getCore().slice(0, 2)],
    },
  ];

  return templates.slice(0, workoutDaysPerWeek).map((t, i) => ({
    ...t,
    day: dayNames[i],
    exercises:
      t.exercises.length > 0
        ? t.exercises
        : eligible.slice(0, 4),
  }));
}
