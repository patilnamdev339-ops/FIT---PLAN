import type { AssessmentData, FitnessMetrics } from "./types";

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

const GOAL_CALORIE_MULTIPLIERS: Record<string, number> = {
  fatLoss: 0.8,
  cutting: 0.75,
  muscleGain: 1.1,
  leanBulk: 1.05,
  recomposition: 0.95,
  maintenance: 1,
  generalFitness: 1,
};

const PROTEIN_GRAMS_PER_KG: Record<string, number> = {
  fatLoss: 2,
  cutting: 2,
  muscleGain: 1.8,
  leanBulk: 1.8,
  recomposition: 2,
  maintenance: 1.6,
  generalFitness: 1.6,
};

export function calculateMetrics(data: AssessmentData): FitnessMetrics {
  const heightM = data.height / 100;
  const bmi = data.weight / (heightM * heightM);

  let bmiCategory = "Normal";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi < 25) bmiCategory = "Normal";
  else if (bmi < 30) bmiCategory = "Overweight";
  else bmiCategory = "Obese";

  // Mifflin-St Jeor
  const bmr =
    data.gender === "male"
      ? 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
      : 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[data.activityLevel];
  const goalMultiplier = GOAL_CALORIE_MULTIPLIERS[data.fitnessGoal] ?? 1;
  const minimumCalories = data.gender === "male" ? 1500 : 1200;
  const calorieTarget = Math.max(
    minimumCalories,
    Math.round(tdee * goalMultiplier),
  );

  // Set protein by body weight, cap it at 35% of calories, then allocate
  // 25% to fat and use the remaining calories for carbohydrates.
  const proteinPerKg = PROTEIN_GRAMS_PER_KG[data.fitnessGoal] ?? 1.6;
  const proteinTarget = Math.round(
    Math.min(data.weight * proteinPerKg, (calorieTarget * 0.35) / 4),
  );
  const fatTarget = Math.round((calorieTarget * 0.25) / 9);
  const carbTarget = Math.max(
    0,
    Math.round((calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4),
  );

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    proteinTarget,
    carbTarget,
    fatTarget,
  };
}
