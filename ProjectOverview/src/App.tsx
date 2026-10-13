import { useEffect, useState } from "react";
import type {
  Page,
  AuthMode,
  UserProfile,
  AssessmentData,
  FitnessMetrics,
  ProgressEntry,
  MealPlan,
  WorkoutDay,
  NutritionLogEntry,
  WorkoutSessionEntry,
  UserSettingsData,
  UserBundle,
  FitnessGoal,
} from "./lib/types";
import { api, getAuthToken } from "./lib/api";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import Diet from "./pages/Diet";
import Workout from "./pages/Workout";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import AppShell from "./components/AppShell";

const DEFAULT_SETTINGS: UserSettingsData = {
  unitSystem: "metric",
  waterGoalMl: 3000,
  dailyWaterMl: 0,
  notificationsEnabled: true,
};

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [initializing, setInitializing] = useState<boolean>(true);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [initialGoal, setInitialGoal] = useState<FitnessGoal>("generalFitness");
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [metrics, setMetrics] = useState<FitnessMetrics | null>(null);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLogEntry[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSessionEntry[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [settings, setSettings] = useState<UserSettingsData>(DEFAULT_SETTINGS);

  const applyBundle = (bundle: UserBundle, navigateAfterAuth = false) => {
    setUser(bundle.user);
    if (bundle.initialGoal) setInitialGoal(bundle.initialGoal);
    setAssessment(bundle.assessment);
    setMetrics(bundle.metrics);
    setMeals(bundle.meals || []);
    setNutritionLogs(bundle.nutritionLogs || []);
    setWorkoutPlan(bundle.workoutPlan || []);
    setWorkoutSessions(bundle.workoutSessions || []);
    setProgress(bundle.progress || []);
    setSettings(bundle.settings || DEFAULT_SETTINGS);

    if (navigateAfterAuth) {
      if (bundle.assessment && bundle.metrics) {
        setPage("dashboard");
      } else {
        setPage("assessment");
      }
    }
  };

  // Restore session on browser reload from backend (/api/auth/me)
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const bundle = await api.getMe();
        if (!active) return;
        applyBundle(bundle, true);
      } catch {
        // Not logged in or session expired
        if (active && getAuthToken()) {
          setPage("landing");
        }
      } finally {
        if (active) setInitializing(false);
      }
    };
    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  // Safe guard: if user is on a private page without session, redirect via effect (never during render)
  useEffect(() => {
    if (initializing) return;
    const privatePages: Page[] = [
      "dashboard",
      "diet",
      "workout",
      "progress",
      "profile",
    ];
    if (privatePages.includes(page)) {
      if (!user) {
        setPage("landing");
      } else if (!assessment || !metrics) {
        setPage("assessment");
      }
    }
  }, [initializing, page, user, assessment, metrics]);

  const handleAuthSuccess = (bundle: UserBundle) => {
    applyBundle(bundle, true);
  };

  const handleAssessmentComplete = async (data: AssessmentData) => {
    const bundle = await api.submitAssessment(data);
    applyBundle(bundle, true);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setAssessment(null);
    setMetrics(null);
    setMeals([]);
    setNutritionLogs([]);
    setWorkoutPlan([]);
    setWorkoutSessions([]);
    setProgress([]);
    setSettings(DEFAULT_SETTINGS);
    setPage("landing");
  };

  const handleMealsChange = async (updatedMeals: MealPlan[]) => {
    setMeals(updatedMeals);
    const bundle = await api.saveMeals(updatedMeals);
    applyBundle(bundle, false);
  };

  const handleRegenerateDiet = async () => {
    const bundle = await api.regenerateDiet();
    applyBundle(bundle, false);
  };

  const handleUpdateTargets = async (targets: {
    calorieTarget?: number;
    proteinTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
    resetToCalculated?: boolean;
  }) => {
    const bundle = await api.updateTargets(targets);
    applyBundle(bundle, false);
  };

  const handleLogFood = async (payload: any) => {
    const res = await api.addNutritionLog(payload);
    setNutritionLogs(res.nutritionLogs);
  };

  const handleDeleteFoodLog = async (logId: number) => {
    const res = await api.deleteNutritionLog(logId);
    setNutritionLogs(res.nutritionLogs);
  };

  const handleSaveWorkoutPlan = async (
    updatedPlan: WorkoutDay[],
    durationMin?: number,
  ) => {
    setWorkoutPlan(updatedPlan);
    const bundle = await api.saveWorkoutPlan(updatedPlan, durationMin);
    applyBundle(bundle, false);
  };

  const handleLogWorkoutSession = async (payload: any) => {
    const bundle = await api.logWorkoutSession(payload);
    applyBundle(bundle, false);
  };

  const handleDeleteWorkoutSession = async (sessionId: number) => {
    const bundle = await api.deleteWorkoutSession(sessionId);
    applyBundle(bundle, false);
  };

  const handleAddProgress = async (entry: {
    weight: number;
    waist?: number;
    bodyFatPct?: number;
    workoutCompleted: boolean;
    isoDate?: string;
    notes?: string;
  }) => {
    const bundle = await api.addProgress(entry);
    applyBundle(bundle, false);
  };

  const handleDeleteProgress = async (entryId: number) => {
    const bundle = await api.deleteProgress(entryId);
    applyBundle(bundle, false);
  };

  const handleUpdateProfile = async (data: any) => {
    const bundle = await api.updateProfile(data);
    applyBundle(bundle, false);
  };

  const handleUpdateSettings = async (data: Partial<UserSettingsData>) => {
    const res = await api.updateSettings(data);
    setSettings(res.settings);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-emerald-400 mb-4" />
        <p className="font-display font-bold text-lg text-white">Loading FitPlan...</p>
      </div>
    );
  }

  if (page === "landing") {
    return (
      <Landing
        onGetStarted={() => {
          setAuthMode("register");
          setPage("auth");
        }}
        onLogin={() => {
          setAuthMode("login");
          setPage("auth");
        }}
      />
    );
  }

  if (page === "auth") {
    return (
      <Auth
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthSuccess={handleAuthSuccess}
        onBack={() => setPage("landing")}
      />
    );
  }

  if (page === "assessment" && user) {
    return (
      <Assessment
        userName={user.name}
        initialGoal={initialGoal}
        initialGender={user.gender}
        existingAssessment={assessment}
        onComplete={handleAssessmentComplete}
        onCancel={assessment && metrics ? () => setPage("dashboard") : undefined}
      />
    );
  }

  if (!user || !assessment || !metrics) {
    return null;
  }

  return (
    <AppShell user={user} page={page} onNav={setPage} onLogout={handleLogout}>
      {page === "dashboard" && (
        <Dashboard
          user={user}
          assessment={assessment}
          metrics={metrics}
          nutritionLogs={nutritionLogs}
          workoutSessions={workoutSessions}
          progress={progress}
          settings={settings}
          onViewDiet={() => setPage("diet")}
          onViewWorkout={() => setPage("workout")}
          onViewProgress={() => setPage("progress")}
          onViewProfile={() => setPage("profile")}
          onUpdateWater={(nextWaterMl) =>
            handleUpdateSettings({ dailyWaterMl: nextWaterMl })
          }
        />
      )}
      {page === "diet" && (
        <Diet
          meals={meals}
          metrics={metrics}
          nutritionLogs={nutritionLogs}
          onMealsChange={handleMealsChange}
          onRegenerateDiet={handleRegenerateDiet}
          onUpdateTargets={handleUpdateTargets}
          onLogFood={handleLogFood}
          onDeleteLog={handleDeleteFoodLog}
        />
      )}
      {page === "workout" && (
        <Workout
          workoutPlan={workoutPlan}
          workoutSessions={workoutSessions}
          durationMin={assessment.workoutDuration}
          onSaveWorkoutPlan={handleSaveWorkoutPlan}
          onLogSession={handleLogWorkoutSession}
          onDeleteSession={handleDeleteWorkoutSession}
        />
      )}
      {page === "progress" && (
        <Progress
          progress={progress}
          onAddEntry={handleAddProgress}
          onDeleteEntry={handleDeleteProgress}
          startWeight={assessment.weight}
        />
      )}
      {page === "profile" && (
        <Profile
          user={user}
          assessment={assessment}
          metrics={metrics}
          settings={settings}
          onUpdateProfile={handleUpdateProfile}
          onUpdateSettings={handleUpdateSettings}
          onLogout={handleLogout}
          onResetAssessment={() => setPage("assessment")}
        />
      )}
    </AppShell>
  );
}
