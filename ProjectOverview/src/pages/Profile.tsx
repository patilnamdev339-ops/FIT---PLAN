import { useState } from "react";
import type {
  UserProfile,
  AssessmentData,
  FitnessMetrics,
  UserSettingsData,
} from "../lib/types";
import { AVATAR_OPTIONS, UserAvatar } from "../components/Avatar";
import { api } from "../lib/api";
import {
  User,
  Lock,
  Edit3,
  RotateCcw,
  LogOut,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Activity,
  Flame,
} from "lucide-react";

interface Props {
  user: UserProfile;
  assessment: AssessmentData;
  metrics: FitnessMetrics;
  settings: UserSettingsData;
  onUpdateProfile: (data: any) => Promise<void> | void;
  onUpdateSettings: (data: Partial<UserSettingsData>) => Promise<void> | void;
  onLogout: () => void;
  onResetAssessment: () => void;
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

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary (desk work)",
  light: "Lightly Active (1–3d/wk)",
  moderate: "Moderately Active (3–5d/wk)",
  active: "Very Active (6–7d/wk)",
  veryActive: "Extremely Active (labor + 2x)",
};

export default function Profile({
  user,
  assessment,
  metrics,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onLogout,
  onResetAssessment,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: user.name,
    avatarId: user.avatarId || (assessment.gender === "female" ? "female_athlete" : "male_athlete"),
    age: String(assessment.age),
    gender: assessment.gender,
    height: String(assessment.height),
    weight: String(assessment.weight),
    waist: assessment.waist ? String(assessment.waist) : "",
    activityLevel: assessment.activityLevel,
    fitnessGoal: assessment.fitnessGoal,
    dietType: assessment.dietType,
    workoutLocation: assessment.workoutLocation,
    workoutDaysPerWeek: String(assessment.workoutDaysPerWeek),
    workoutDuration: String(assessment.workoutDuration),
    mealsPerDay: String(assessment.mealsPerDay),
    waterGoalMl: String(settings.waterGoalMl),
    regeneratePlans: true,
  });

  // Password Change State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);

  const notify = (msg: string) => {
    setFeedback(msg);
    setError("");
    setTimeout(() => setFeedback(""), 4000);
  };

  const handleAvatarQuickSelect = async (avatarId: string) => {
    setForm((f) => ({ ...f, avatarId }));
    await onUpdateProfile({ avatarId });
    notify("Profile avatar persona updated in database.");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onUpdateProfile({
        name: form.name.trim(),
        avatarId: form.avatarId,
        age: Number(form.age),
        gender: form.gender,
        height: Number(form.height),
        weight: Number(form.weight),
        waist: form.waist ? Number(form.waist) : null,
        activityLevel: form.activityLevel,
        fitnessGoal: form.fitnessGoal,
        dietType: form.dietType,
        workoutLocation: form.workoutLocation,
        workoutDaysPerWeek: Number(form.workoutDaysPerWeek),
        workoutDuration: Number(form.workoutDuration),
        mealsPerDay: Number(form.mealsPerDay),
        recalculateTargets: true,
        regeneratePlans: form.regeneratePlans,
      });
      await onUpdateSettings({
        waterGoalMl: Number(form.waterGoalMl) || 3000,
      });
      setEditing(false);
      notify("Profile, biometric metrics, and plans updated in database.");
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pwForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await api.updatePassword(pwForm);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
      notify("Password updated securely via bcrypt.");
    } catch (err: any) {
      setError(err?.message || "Could not update password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-emerald-400 font-mono text-[11px] mb-1">
            <User className="w-3 h-3" />
            <span>ACCOUNT &amp; SETTINGS</span>
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white">
            Profile &amp; Account Settings
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{editing ? "Close Editor" : "Edit Profile & Metrics"}</span>
        </button>
      </div>

      {feedback && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback("")}
            className="text-emerald-400/80 hover:text-emerald-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* User Card + Male & Female Persona Selector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-5">
            <UserAvatar avatarId={user.avatarId} name={user.name} size="lg" />
            <div>
              <h2 className="font-display font-bold text-xl text-white">{user.name}</h2>
              <p className="text-slate-400 text-xs">{user.email}</p>
              <p className="text-emerald-400 text-xs font-mono font-bold mt-1">
                {GOAL_LABELS[assessment.fitnessGoal]} · {DIET_LABELS[assessment.dietType]} ·{" "}
                {assessment.gender === "female" ? "Female" : "Male"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordForm((v) => !v)}
            className="border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Change Password</span>
          </button>
        </div>

        {/* Male & Female Profile Persona Grid */}
        <div className="pt-5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
            Select Profile Persona (Male &amp; Female Options)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {AVATAR_OPTIONS.map((av) => {
              const selected = (user.avatarId || form.avatarId) === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handleAvatarQuickSelect(av.id)}
                  className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                    selected
                      ? "border-emerald-500 bg-emerald-500/15 shadow-sm shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="mb-1">
                    <UserAvatar avatarId={av.id} name={user.name} size="sm" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold text-center leading-tight ${
                      selected ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {av.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      {showPasswordForm && (
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-sm text-white">
              Change Account Password
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={pwForm.currentPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                New Password (Min 8)
              </label>
              <input
                type="password"
                required
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={pwLoading}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="border border-slate-700 bg-slate-800 px-5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Editable Profile Form */}
      {editing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4"
        >
          <h3 className="font-display font-bold text-sm text-white">
            Edit Biometrics &amp; Preferences
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                min="15"
                max="100"
                required
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gender: e.target.value as "male" | "female",
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="male" className="bg-slate-900">Male</option>
                <option value="female" className="bg-slate-900">Female</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="100"
                max="260"
                required
                value={form.height}
                onChange={(e) =>
                  setForm((f) => ({ ...f, height: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="350"
                required
                value={form.weight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weight: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Waist (cm)
              </label>
              <input
                type="number"
                step="0.5"
                min="40"
                max="220"
                value={form.waist}
                onChange={(e) =>
                  setForm((f) => ({ ...f, waist: e.target.value }))
                }
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Water Target (ml)
              </label>
              <input
                type="number"
                step="250"
                min="1000"
                max="8000"
                value={form.waterGoalMl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, waterGoalMl: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Fitness Goal
              </label>
              <select
                value={form.fitnessGoal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fitnessGoal: e.target.value as any }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(GOAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Activity Level
              </label>
              <select
                value={form.activityLevel}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    activityLevel: e.target.value as any,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Diet Preference
              </label>
              <select
                value={form.dietType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dietType: e.target.value as any }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(DIET_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={form.regeneratePlans}
              onChange={(e) =>
                setForm((f) => ({ ...f, regeneratePlans: e.target.checked }))
              }
              className="w-4 h-4 accent-emerald-500 rounded"
            />
            <span>
              Regenerate my recommended Diet &amp; Workout plans to align with updated biometrics
            </span>
          </label>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              {saving ? "Saving Changes..." : "Save Profile Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="border border-slate-700 bg-slate-800 px-6 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Assessment Summary & Calculated Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-white">
              Body &amp; Lifestyle Profile
            </h3>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="divide-y divide-slate-800/80">
            {[
              { label: "Age", value: `${assessment.age} years` },
              {
                label: "Gender",
                value: assessment.gender === "female" ? "Female" : "Male",
              },
              { label: "Height", value: `${assessment.height} cm` },
              { label: "Weight", value: `${assessment.weight} kg` },
              ...(assessment.waist
                ? [{ label: "Waist", value: `${assessment.waist} cm` }]
                : []),
              {
                label: "Activity Level",
                value: ACTIVITY_LABELS[assessment.activityLevel],
              },
              {
                label: "Fitness Goal",
                value: GOAL_LABELS[assessment.fitnessGoal],
              },
              {
                label: "Workout Split",
                value: `${assessment.workoutDaysPerWeek} days/wk · ${assessment.workoutDuration} min (${assessment.workoutLocation})`,
              },
              {
                label: "Diet Type",
                value: `${DIET_LABELS[assessment.dietType]} (${assessment.mealsPerDay} meals/day)`,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center px-6 py-3 text-xs"
              >
                <span className="text-slate-400">{row.label}</span>
                <span className="text-white font-mono font-bold">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-white">
              Calculated Energy &amp; Target Metrics
            </h3>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="divide-y divide-slate-800/80">
            {[
              {
                label: "BMI Screening",
                value: `${metrics.bmi} kg/m²`,
                sub: `${metrics.bmiCategory} category`,
              },
              {
                label: "Estimated BMR",
                value: `${metrics.bmr.toLocaleString()} kcal/day`,
                sub: "Mifflin-St Jeor resting rate",
              },
              {
                label: "Estimated TDEE",
                value: `${metrics.tdee.toLocaleString()} kcal/day`,
                sub: "Total daily expenditure",
              },
              {
                label: "Daily Calorie Target",
                value: `${metrics.calorieTarget.toLocaleString()} kcal`,
                accent: true,
              },
              {
                label: "Protein Target",
                value: `${metrics.proteinTarget}g / day`,
              },
              {
                label: "Carbohydrate Target",
                value: `${metrics.carbTarget}g / day`,
              },
              { label: "Fat Target", value: `${metrics.fatTarget}g / day` },
              {
                label: "Daily Hydration Target",
                value: `${settings.waterGoalMl} ml / day`,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center px-6 py-3 text-xs"
              >
                <span className="text-slate-400">{row.label}</span>
                <div className="text-right">
                  <span
                    className={`font-mono font-bold ${
                      row.accent ? "text-emerald-400 text-sm" : "text-white"
                    }`}
                  >
                    {row.value}
                  </span>
                  {row.sub && (
                    <p className="text-slate-500 text-[10px]">{row.sub}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onResetAssessment}
          className="w-full py-3.5 border border-slate-700 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Redo Full Step-by-Step Assessment</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 rounded-xl text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of FitPlan</span>
        </button>
      </div>
    </div>
  );
}
