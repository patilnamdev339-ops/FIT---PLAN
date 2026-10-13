import type {
  AssessmentData,
  FitnessMetrics,
  NutritionLogEntry,
  ProgressEntry,
  UserProfile,
  UserSettingsData,
  WorkoutSessionEntry,
} from "../lib/types";
import { UserAvatar } from "../components/Avatar";
import {
  Droplets,
  Dumbbell,
  TrendingUp,
  Plus,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Flame,
  Activity,
  Scale,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface Props {
  user: UserProfile;
  assessment: AssessmentData;
  metrics: FitnessMetrics;
  nutritionLogs: NutritionLogEntry[];
  workoutSessions: WorkoutSessionEntry[];
  progress: ProgressEntry[];
  settings: UserSettingsData;
  onViewDiet: () => void;
  onViewWorkout: () => void;
  onViewProgress: () => void;
  onViewProfile: () => void;
  onUpdateWater: (nextWaterMl: number) => void;
}

const GOAL_LABELS: Record<string, string> = {
  fatLoss: "Fat Loss",
  cutting: "Cutting",
  muscleGain: "Muscle Gain",
  leanBulk: "Lean Bulk",
  recomposition: "Body Recomposition",
  maintenance: "Maintenance",
  generalFitness: "General Fitness",
};

const DIET_LABELS: Record<string, string> = {
  vegetarian: "Vegetarian",
  eggetarian: "Eggetarian",
  nonVegetarian: "Non-Vegetarian",
};

function StatCard({
  label,
  value,
  unit,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: boolean;
  icon?: typeof Flame;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        accent
          ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
          : "bg-slate-900/60 border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">
          {label}
        </p>
        {Icon && (
          <Icon className={`w-4 h-4 ${accent ? "text-emerald-400" : "text-slate-500"}`} />
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-mono font-black text-2xl ${
            accent ? "text-emerald-400" : "text-white"
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-slate-400 text-xs font-medium">{unit}</span>}
      </div>
      {sub && <p className="text-slate-400 text-xs mt-1.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard({
  user,
  assessment,
  metrics,
  nutritionLogs,
  workoutSessions,
  progress,
  settings,
  onViewDiet,
  onViewWorkout,
  onViewProgress,
  onViewProfile,
  onUpdateWater,
}: Props) {
  const consumed = nutritionLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const latestWeight =
    progress.length > 0 ? progress[progress.length - 1].weight : assessment.weight;
  const startWeight = progress.length > 0 ? progress[0].weight : assessment.weight;
  const weightDelta = Math.round((latestWeight - startWeight) * 10) / 10;

  const waterPct = Math.min(
    100,
    Math.round((settings.dailyWaterMl / Math.max(500, settings.waterGoalMl)) * 100),
  );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar avatarId={user.avatarId} name={user.name} size="lg" />
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-emerald-400 font-mono text-[11px] mb-1">
              <Sparkles className="w-3 h-3" />
              <span>LIVE DASHBOARD</span>
            </div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-white">
              Hey, {user.name.split(" ")[0]}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Goal:{" "}
              <span className="text-emerald-400 font-semibold">
                {GOAL_LABELS[assessment.fitnessGoal] ?? assessment.fitnessGoal}
              </span>{" "}
              · {assessment.workoutDaysPerWeek} days/week ·{" "}
              {DIET_LABELS[assessment.dietType] ?? assessment.dietType}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onViewDiet}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meal</span>
          </button>
          <button
            type="button"
            onClick={onViewWorkout}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Log Workout</span>
          </button>
        </div>
      </div>

      {/* Key Energy & Screening Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">
              BMI Screening
            </p>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-slate-800 text-emerald-400 border border-emerald-500/30">
              {metrics.bmiCategory}
            </span>
          </div>
          <div className="font-mono font-black text-2xl text-white">
            {metrics.bmi}
          </div>
          <p className="text-slate-400 text-xs mt-1.5">
            Height: {assessment.height}cm · Weight: {latestWeight}kg
          </p>
        </div>

        <StatCard
          label="Daily Calorie Target"
          value={metrics.calorieTarget.toLocaleString()}
          unit="kcal"
          sub={
            metrics.isCustomTargets
              ? "Custom calibrated target"
              : "Calculated from TDEE"
          }
          accent
          icon={Flame}
        />
        <StatCard
          label="Estimated BMR"
          value={metrics.bmr.toLocaleString()}
          unit="kcal"
          sub="Basal metabolic baseline"
          icon={Activity}
        />
        <StatCard
          label="Estimated TDEE"
          value={metrics.tdee.toLocaleString()}
          unit="kcal"
          sub="Daily energy expenditure"
          icon={TrendingUp}
        />
      </div>

      {/* Today's Nutrition Intake vs Targets */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="font-display font-black text-lg text-white">
              Today's Nutrition &amp; Macro Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged today: <strong className="font-mono text-emerald-400">{Math.round(consumed.calories)}</strong> /{" "}
              <strong className="font-mono text-white">{metrics.calorieTarget} kcal</strong>{" "}
              ({nutritionLogs.length} item{nutritionLogs.length === 1 ? "" : "s"} recorded)
            </p>
          </div>
          <button
            type="button"
            onClick={onViewDiet}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Manage Diet & Targets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Calories",
              logged: Math.round(consumed.calories),
              target: metrics.calorieTarget,
              unit: "kcal",
              color: "#10b981",
              track: "bg-emerald-500",
              sub: `${Math.max(0, metrics.calorieTarget - Math.round(consumed.calories))} kcal remaining`,
            },
            {
              label: "Protein",
              logged: Math.round(consumed.protein),
              target: metrics.proteinTarget,
              unit: "g",
              color: "#38bdf8",
              track: "bg-sky-400",
              sub: `${Math.round((metrics.proteinTarget * 4 * 100) / metrics.calorieTarget)}% of target kcal`,
            },
            {
              label: "Carbohydrates",
              logged: Math.round(consumed.carbs),
              target: metrics.carbTarget,
              unit: "g",
              color: "#a78bfa",
              track: "bg-purple-400",
              sub: `${Math.round((metrics.carbTarget * 4 * 100) / metrics.calorieTarget)}% of target kcal`,
            },
            {
              label: "Fats",
              logged: Math.round(consumed.fat),
              target: metrics.fatTarget,
              unit: "g",
              color: "#fb923c",
              track: "bg-orange-400",
              sub: `${Math.round((metrics.fatTarget * 9 * 100) / metrics.calorieTarget)}% of target kcal`,
            },
          ].map((m) => {
            const pct = Math.min(
              100,
              Math.round((m.logged / Math.max(1, m.target)) * 100),
            );
            return (
              <div
                key={m.label}
                className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4"
              >
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                    {m.label}
                  </span>
                  <span className="font-mono font-bold text-sm text-white">
                    <span style={{ color: m.color }}>{m.logged}</span> / {m.target}{m.unit}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${m.track}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs font-mono">{m.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hydration, Workout Activity & Body Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Daily Water Tracker */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-lg text-white">Hydration</h2>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-mono font-black text-2xl text-sky-400">
                {settings.dailyWaterMl}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {settings.waterGoalMl} ml
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden my-3">
              <div
                className="h-full bg-sky-400 rounded-full transition-all"
                style={{ width: `${waterPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mb-6">
              {waterPct}% of daily hydration target completed
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateWater(settings.dailyWaterMl + 250)}
              className="flex-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              +250 ml
            </button>
            <button
              type="button"
              onClick={() => onUpdateWater(settings.dailyWaterMl + 500)}
              className="flex-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              +500 ml
            </button>
            {settings.dailyWaterMl > 0 && (
              <button
                type="button"
                onClick={() => onUpdateWater(0)}
                className="px-3 py-2.5 border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-red-400 rounded-xl text-xs transition-colors"
                title="Reset water intake"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Workout Activity Summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-lg text-white">Workout Activity</h2>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Dumbbell className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-mono font-black text-2xl text-white">
                {workoutSessions.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                sessions recorded
              </span>
            </div>
            {workoutSessions.length > 0 ? (
              <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs font-bold text-slate-200">
                  Last: {workoutSessions[0].dayLabel} ({workoutSessions[0].focus})
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {workoutSessions[0].sessionDate} · {workoutSessions[0].durationMin} min ·{" "}
                  {workoutSessions[0].exercises.length} exercises
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                You have an active {assessment.workoutDaysPerWeek}-day split ready.
                Record your first training session to begin tracking volume.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onViewWorkout}
            className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Workout Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body & Progress Summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-lg text-white">Body Measurements</h2>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Weight</span>
                <span className="font-mono font-bold text-white text-sm">{latestWeight} kg</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Net Weight Delta</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    weightDelta <= 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Height / Age</span>
                <span className="font-mono font-bold text-slate-300">
                  {assessment.height} cm · {assessment.age} yrs
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2.5 mt-6">
            <button
              type="button"
              onClick={onViewProgress}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Charts</span>
            </button>
            <button
              type="button"
              onClick={onViewProfile}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors"
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* Medical & Screening Notice */}
      <div className="flex items-start gap-3 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300">Clinical &amp; Estimation Notice:</strong>{" "}
          Calculated BMR, TDEE, macronutrient targets, and BMI values are algorithmic
          estimations derived from the Mifflin-St Jeor formula for educational fitness planning.
          They do not replace medical or certified clinical dietary consultation.
        </div>
      </div>
    </div>
  );
}
