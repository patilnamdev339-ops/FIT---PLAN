export type Page =
  | "landing"
  | "auth"
  | "assessment"
  | "dashboard"
  | "diet"
  | "workout"
  | "progress"
  | "profile";

export type AuthMode = "login" | "register";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";

export type FitnessGoal =
  | "fatLoss"
  | "cutting"
  | "muscleGain"
  | "leanBulk"
  | "recomposition"
  | "maintenance"
  | "generalFitness";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type WorkoutLocation = "home" | "gym";
export type DietType = "vegetarian" | "eggetarian" | "nonVegetarian";

export type AvatarId =
  | "male_athlete"
  | "male_runner"
  | "male_lifter"
  | "male_yogi"
  | "female_athlete"
  | "female_runner"
  | "female_lifter"
  | "female_yogi";

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  avatarId?: AvatarId | string;
  gender?: "male" | "female";
  createdAt?: string;
}

export interface AssessmentData {
  age: number;
  gender: "male" | "female";
  avatarId?: string;
  height: number;
  weight: number;
  waist?: number;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  workoutLocation: WorkoutLocation;
  equipment: string[];
  workoutDaysPerWeek: number;
  workoutDuration: number;
  dietType: DietType;
  mealsPerDay: number;
  foodPreferences: string[];
}

export interface FitnessMetrics {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  isCustomTargets?: boolean;
  targetWeight?: number | null;
}

export interface ProgressEntry {
  id?: number;
  date: string;
  isoDate?: string;
  weight: number;
  waist?: number;
  bodyFatPct?: number;
  workoutCompleted: boolean;
  notes?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  dietTypes: DietType[];
  category: string;
  replacements: string[];
}

export interface MealPlan {
  id?: number;
  mealName: string;
  foods: { food: FoodItem; quantity: number }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface NutritionLogEntry {
  id: number;
  logDate: string;
  mealName: string;
  foodName: string;
  servingSize: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restTime: string;
  difficulty: ExperienceLevel;
  location: WorkoutLocation[];
  goals: FitnessGoal[];
  instructions: string;
  equipment: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface LoggedExercise {
  name: string;
  sets: number;
  reps: string;
  weightKg: number;
  completed: boolean;
}

export interface WorkoutSessionEntry {
  id: number;
  sessionDate: string;
  dayLabel: string;
  focus: string;
  durationMin: number;
  exercises: LoggedExercise[];
  notes?: string;
  createdAt?: string;
}

export interface UserSettingsData {
  unitSystem: "metric" | "imperial";
  waterGoalMl: number;
  dailyWaterMl: number;
  notificationsEnabled: boolean;
}

export interface UserBundle {
  user: UserProfile;
  initialGoal?: FitnessGoal;
  assessment: AssessmentData | null;
  metrics: FitnessMetrics | null;
  meals: MealPlan[];
  nutritionLogs: NutritionLogEntry[];
  workoutPlan: WorkoutDay[];
  workoutSessions: WorkoutSessionEntry[];
  progress: ProgressEntry[];
  settings: UserSettingsData;
  token?: string;
}
