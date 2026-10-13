import type {
  AssessmentData,
  FitnessGoal,
  MealPlan,
  NutritionLogEntry,
  UserBundle,
  UserSettingsData,
  WorkoutDay,
  LoggedExercise,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

// Session token key used only to attach the signed Bearer token header alongside HTTP-only cookies
const SESSION_TOKEN_KEY = "fitplan_auth_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted browsing modes
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      "Cannot reach the FitPlan server. Please ensure the backend service is running.",
      0,
      "NETWORK_ERROR",
    );
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
    }
    throw new ApiError(
      payload?.error || `Request failed with status ${response.status}`,
      response.status,
      payload?.code,
    );
  }

  if (payload?.token) {
    setAuthToken(payload.token);
  }

  return payload as T;
}

export const api = {
  health: () =>
    apiRequest<{
      status: string;
      database: {
        connected: boolean;
        engine: string;
        mysqlHost: string;
        mysqlDatabase: string;
        statusMessage: string;
      };
    }>("/health"),

  register: (data: {
    name: string;
    email: string;
    password: string;
    confirm: string;
    initialGoal?: FitnessGoal;
    gender?: "male" | "female";
  }) =>
    apiRequest<UserBundle>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<UserBundle>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: async () => {
    try {
      await apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
    } finally {
      setAuthToken(null);
    }
  },

  getMe: () => apiRequest<UserBundle>("/auth/me"),

  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    apiRequest<{ message: string }>("/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  submitAssessment: (data: AssessmentData) =>
    apiRequest<UserBundle>("/assessment", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProfile: (
    data: Partial<AssessmentData> & {
      name?: string;
      avatarId?: string;
      recalculateTargets?: boolean;
      regeneratePlans?: boolean;
    },
  ) =>
    apiRequest<UserBundle>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateTargets: (data: {
    calorieTarget?: number;
    proteinTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
    targetWeight?: number | null;
    resetToCalculated?: boolean;
  }) =>
    apiRequest<UserBundle>("/targets", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  saveMeals: (meals: MealPlan[]) =>
    apiRequest<UserBundle>("/diet/meals", {
      method: "PUT",
      body: JSON.stringify({ meals }),
    }),

  regenerateDiet: () =>
    apiRequest<UserBundle>("/diet/regenerate", {
      method: "POST",
    }),

  addNutritionLog: (
    payload:
      | {
          mealName: string;
          foodName: string;
          servingSize: string;
          quantity: number;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          logDate?: string;
        }
      | {
          mealName: string;
          logDate?: string;
          items: {
            mealName?: string;
            foodName: string;
            servingSize: string;
            quantity: number;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
          }[];
        },
  ) =>
    apiRequest<{ nutritionLogs: NutritionLogEntry[] }>("/nutrition-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteNutritionLog: (logId: number) =>
    apiRequest<{ nutritionLogs: NutritionLogEntry[] }>(
      `/nutrition-logs/${logId}`,
      { method: "DELETE" },
    ),

  analyzeMealImage: (image: string) =>
    apiRequest<{
      mealName: string;
      foods: {
        name: string;
        servingSize: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }[];
      note?: string;
    }>("/diet/analyze-image", {
      method: "POST",
      body: JSON.stringify({ image }),
    }),

  saveWorkoutPlan: (workoutPlan: WorkoutDay[], durationMin?: number) =>
    apiRequest<UserBundle>("/workout/plan", {
      method: "PUT",
      body: JSON.stringify({ workoutPlan, durationMin }),
    }),

  logWorkoutSession: (data: {
    sessionDate?: string;
    dayLabel: string;
    focus: string;
    durationMin: number;
    exercises: LoggedExercise[];
    notes?: string;
  }) =>
    apiRequest<UserBundle>("/workout-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteWorkoutSession: (sessionId: number) =>
    apiRequest<UserBundle>(`/workout-sessions/${sessionId}`, {
      method: "DELETE",
    }),

  addProgress: (data: {
    weight: number;
    waist?: number;
    bodyFatPct?: number;
    workoutCompleted: boolean;
    isoDate?: string;
    notes?: string;
  }) =>
    apiRequest<UserBundle>("/progress", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteProgress: (entryId: number) =>
    apiRequest<UserBundle>(`/progress/${entryId}`, {
      method: "DELETE",
    }),

  updateSettings: (data: Partial<UserSettingsData>) =>
    apiRequest<{ settings: UserSettingsData }>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
