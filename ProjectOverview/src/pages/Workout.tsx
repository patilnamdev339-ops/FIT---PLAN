import { useState } from "react";
import type {
  WorkoutDay,
  Exercise,
  WorkoutSessionEntry,
  LoggedExercise,
} from "../lib/types";
import {
  Dumbbell,
  Calendar,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";

interface Props {
  workoutPlan: WorkoutDay[];
  workoutSessions: WorkoutSessionEntry[];
  durationMin: number;
  onSaveWorkoutPlan: (plan: WorkoutDay[], durationMin?: number) => Promise<void> | void;
  onLogSession: (payload: {
    sessionDate?: string;
    dayLabel: string;
    focus: string;
    durationMin: number;
    exercises: LoggedExercise[];
    notes?: string;
  }) => Promise<void> | void;
  onDeleteSession: (sessionId: number) => Promise<void> | void;
}

const DIFFICULTY_CONFIG = {
  beginner: {
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.1)",
    border: "rgba(52, 211, 153, 0.3)",
  },
  intermediate: {
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.1)",
    border: "rgba(56, 189, 248, 0.3)",
  },
  advanced: {
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.1)",
    border: "rgba(251, 146, 60, 0.3)",
  },
};

function ExerciseCard({
  exercise,
  onRemove,
}: {
  exercise: Exercise;
  onRemove?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diff =
    DIFFICULTY_CONFIG[exercise.difficulty as keyof typeof DIFFICULTY_CONFIG] ||
    DIFFICULTY_CONFIG.intermediate;

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700/80">
      <div className="w-full flex items-center justify-between p-4 text-left">
        <button
          type="button"
          className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none"
          onClick={() => setExpanded((e) => !e)}
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: diff.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-100 truncate">{exercise.name}</p>
            <p className="text-slate-500 text-xs mt-0.5">{exercise.muscleGroup}</p>
          </div>
        </button>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <div className="text-right hidden sm:block">
            <p className="font-mono text-slate-300 text-xs font-bold">
              {exercise.sets} × {exercise.reps}
            </p>
            <p className="text-slate-500 text-[11px] font-mono">Rest: {exercise.restTime}</p>
          </div>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold border"
            style={{
              color: diff.color,
              backgroundColor: diff.bg,
              borderColor: diff.border,
            }}
          >
            {exercise.difficulty}
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              title="Remove exercise"
              className="text-slate-500 hover:text-red-400 p-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="mt-3 grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Sets", value: exercise.sets },
              { label: "Reps", value: exercise.reps },
              { label: "Rest Time", value: exercise.restTime },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center"
              >
                <p className="font-mono font-bold text-sm text-white">
                  {s.value}
                </p>
                <p className="text-slate-500 text-[10px] uppercase font-mono mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            {exercise.instructions}
          </p>
          {exercise.equipment && exercise.equipment !== "None" && (
            <p className="text-slate-500 text-xs mt-2">
              Required Equipment:{" "}
              <span className="text-slate-300 font-semibold">
                {exercise.equipment}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Workout({
  workoutPlan,
  workoutSessions,
  durationMin,
  onSaveWorkoutPlan,
  onLogSession,
  onDeleteSession,
}: Props) {
  const [viewTab, setViewTab] = useState<"split" | "history">("split");
  const [activeDay, setActiveDay] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // Add Custom Exercise Form State
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroup: "Chest, Shoulders",
    sets: "3",
    reps: "10–12",
    restTime: "60s",
    equipment: "Dumbbells",
    instructions: "Perform with controlled tempo and full range of motion.",
  });

  // Log Session Modal State
  const [loggingSession, setLoggingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState<{
    durationMin: string;
    notes: string;
    exercises: LoggedExercise[];
  }>({
    durationMin: String(durationMin),
    notes: "",
    exercises: [],
  });
  const [savingSession, setSavingSession] = useState(false);

  const day = workoutPlan[activeDay];

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3500);
  };

  const openSessionLogger = () => {
    if (!day) return;
    setSessionForm({
      durationMin: String(durationMin),
      notes: "",
      exercises: day.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weightKg: 0,
        completed: true,
      })),
    });
    setLoggingSession(true);
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name.trim() || !day) return;
    const created: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExercise.name.trim(),
      muscleGroup: newExercise.muscleGroup.trim() || "Full Body",
      sets: Math.max(1, Number(newExercise.sets) || 3),
      reps: newExercise.reps.trim() || "10–12",
      restTime: newExercise.restTime.trim() || "60s",
      difficulty: "intermediate",
      location: ["home", "gym"],
      goals: ["generalFitness"],
      equipment: newExercise.equipment.trim() || "None",
      instructions:
        newExercise.instructions.trim() ||
        "Perform with proper form and controlled tempo.",
    };

    const updatedPlan = workoutPlan.map((d, i) =>
      i === activeDay ? { ...d, exercises: [...d.exercises, created] } : d,
    );
    await onSaveWorkoutPlan(updatedPlan, durationMin);
    setNewExercise({
      name: "",
      muscleGroup: "Chest, Shoulders",
      sets: "3",
      reps: "10–12",
      restTime: "60s",
      equipment: "Dumbbells",
      instructions: "Perform with controlled tempo and full range of motion.",
    });
    setShowAddExercise(false);
    notify(`Added "${created.name}" to ${day.day}`);
  };

  const handleRemoveExercise = async (exIndex: number) => {
    if (!day) return;
    const updatedPlan = workoutPlan.map((d, i) =>
      i === activeDay
        ? {
            ...d,
            exercises: d.exercises.filter((_, idx) => idx !== exIndex),
          }
        : d,
    );
    await onSaveWorkoutPlan(updatedPlan, durationMin);
    notify("Removed exercise from workout day.");
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!day) return;
    setSavingSession(true);
    try {
      await onLogSession({
        dayLabel: day.day,
        focus: day.focus,
        durationMin: Number(sessionForm.durationMin) || durationMin,
        exercises: sessionForm.exercises,
        notes: sessionForm.notes.trim(),
      });
      setLoggingSession(false);
      notify(`Workout session (${day.day}) recorded in your training history.`);
    } finally {
      setSavingSession(false);
    }
  };

  if (!day && workoutPlan.length === 0) {
    return (
      <div className="p-10 text-center text-slate-400">
        No workout plan available. Please complete the fitness assessment.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-emerald-400 font-mono text-[11px] mb-1">
            <Dumbbell className="w-3 h-3" />
            <span>TRAINING SYSTEM</span>
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white">
            Workout Split &amp; Session Logger
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {workoutPlan.length} days/week · {durationMin} min target · Track exercises, sets, and weights lifted.
          </p>
        </div>
        {day && (
          <button
            type="button"
            onClick={openSessionLogger}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Check className="w-4 h-4" />
            <span>Log {day.day} Session</span>
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg("")}
            className="text-emerald-400/80 hover:text-emerald-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewTab("split")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            viewTab === "split"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Weekly Training Split ({workoutPlan.length} Days)</span>
        </button>
        <button
          type="button"
          onClick={() => setViewTab("history")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            viewTab === "history"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Training History ({workoutSessions.length} Logged)</span>
        </button>
      </div>

      {viewTab === "split" && day && (
        <div className="space-y-4">
          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {workoutPlan.map((d, i) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setActiveDay(i)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  i === activeDay
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                {d.day}: {d.focus.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Day Detail Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-black text-xl text-white">{day.day}</h2>
                <p className="text-emerald-400 text-xs font-bold mt-0.5">
                  {day.focus}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-slate-300 text-xs font-bold">
                    {day.exercises.length} exercises
                  </p>
                  <p className="text-slate-500 text-[11px] font-mono">{durationMin} min target</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExercise((v) => !v)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Exercise</span>
                </button>
              </div>
            </div>

            {showAddExercise && (
              <form
                onSubmit={handleAddExercise}
                className="p-5 bg-slate-950/90 border-b border-slate-800 space-y-4"
              >
                <h3 className="font-display font-bold text-xs text-slate-200">
                  Add Custom Exercise to {day.day}
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Exercise Name (e.g. Incline DB Press)"
                    value={newExercise.name}
                    onChange={(e) =>
                      setNewExercise((s) => ({ ...s, name: e.target.value }))
                    }
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Target Muscle (e.g. Upper Chest)"
                    value={newExercise.muscleGroup}
                    onChange={(e) =>
                      setNewExercise((s) => ({
                        ...s,
                        muscleGroup: e.target.value,
                      }))
                    }
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Equipment (e.g. Dumbbells, Bench)"
                    value={newExercise.equipment}
                    onChange={(e) =>
                      setNewExercise((s) => ({
                        ...s,
                        equipment: e.target.value,
                      }))
                    }
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                      Sets
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newExercise.sets}
                      onChange={(e) =>
                        setNewExercise((s) => ({ ...s, sets: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                      Reps
                    </label>
                    <input
                      type="text"
                      value={newExercise.reps}
                      onChange={(e) =>
                        setNewExercise((s) => ({ ...s, reps: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                      Rest Time
                    </label>
                    <input
                      type="text"
                      value={newExercise.restTime}
                      onChange={(e) =>
                        setNewExercise((s) => ({
                          ...s,
                          restTime: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Save Exercise
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddExercise(false)}
                    className="border border-slate-700 bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="p-4 space-y-3">
              {day.exercises.length > 0 ? (
                day.exercises.map((ex, idx) => (
                  <ExerciseCard
                    key={`${ex.id}-${idx}`}
                    exercise={ex}
                    onRemove={() => handleRemoveExercise(idx)}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-6">
                  No exercises added to this training day yet. Click &ldquo;+ Add Exercise&rdquo; above.
                </p>
              )}
            </div>
          </div>

          {/* Difficulty Legend */}
          <div className="flex items-center gap-6 flex-wrap px-2">
            <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">
              Intensity:
            </p>
            {Object.entries(DIFFICULTY_CONFIG).map(([lvl, conf]) => (
              <div key={lvl} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: conf.color }}
                />
                <span className="text-slate-400 text-xs capitalize">
                  {lvl}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TRAINING HISTORY */}
      {viewTab === "history" && (
        <div className="space-y-4">
          {workoutSessions.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500 mb-3">
                <Dumbbell className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-base text-slate-200">
                No training sessions recorded yet
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click &ldquo;Log Day Session&rdquo; after completing a workout to track weights and completion.
              </p>
            </div>
          ) : (
            workoutSessions.map((ws) => (
              <div
                key={ws.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        {ws.dayLabel}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {ws.sessionDate} · {ws.durationMin} min
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-white mt-1">
                      {ws.focus}
                    </h3>
                    {ws.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic">
                        &ldquo;{ws.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(ws.id)}
                    className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                    title="Delete session log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {ws.exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs"
                    >
                      <span className="font-semibold text-slate-300">
                        {ex.completed ? "✓ " : ""}
                        {ex.name}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {ex.sets} × {ex.reps}
                        {ex.weightKg > 0 ? ` @ ${ex.weightKg}kg` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Log Workout Session Modal */}
      {loggingSession && day && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveSession}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                  RECORD TRAINING SESSION
                </p>
                <h2 className="font-display font-black text-xl text-white">
                  {day.day} — {day.focus}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLoggingSession(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  required
                  value={sessionForm.durationMin}
                  onChange={(e) =>
                    setSessionForm((f) => ({
                      ...f,
                      durationMin: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Set a personal record on barbell squats"
                  value={sessionForm.notes}
                  onChange={(e) =>
                    setSessionForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs font-mono uppercase text-slate-400">
                Logged Exercises (Customize reps &amp; weight in kg)
              </p>
              {sessionForm.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 grid sm:grid-cols-[1.5fr_1fr_1fr_1fr] gap-2.5 items-center"
                >
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ex.completed}
                      onChange={(e) => {
                        const next = [...sessionForm.exercises];
                        next[idx] = { ...ex, completed: e.target.checked };
                        setSessionForm((f) => ({ ...f, exercises: next }));
                      }}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span className="truncate">{ex.name}</span>
                  </label>
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-slate-500">
                      Sets
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={ex.sets}
                      onChange={(e) => {
                        const next = [...sessionForm.exercises];
                        next[idx] = { ...ex, sets: Number(e.target.value) };
                        setSessionForm((f) => ({ ...f, exercises: next }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-slate-500">
                      Reps
                    </span>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) => {
                        const next = [...sessionForm.exercises];
                        next[idx] = { ...ex, reps: e.target.value };
                        setSessionForm((f) => ({ ...f, exercises: next }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-slate-500">
                      Weight (kg)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={ex.weightKg}
                      onChange={(e) => {
                        const next = [...sessionForm.exercises];
                        next[idx] = { ...ex, weightKg: Number(e.target.value) };
                        setSessionForm((f) => ({ ...f, exercises: next }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={savingSession}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
              >
                {savingSession ? "Saving Session..." : "Save Workout Session"}
              </button>
              <button
                type="button"
                onClick={() => setLoggingSession(false)}
                className="px-6 py-3 border border-slate-700 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
