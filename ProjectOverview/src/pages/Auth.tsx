import { useState } from "react";
import type { AuthMode, FitnessGoal, UserBundle } from "../lib/types";
import { api, ApiError } from "../lib/api";
import {
  Zap,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";

interface Props {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  onAuthSuccess: (bundle: UserBundle) => void;
  onBack: () => void;
}

const INITIAL_GOALS: { value: FitnessGoal; label: string }[] = [
  { value: "generalFitness", label: "General Fitness & Wellbeing" },
  { value: "fatLoss", label: "Fat Loss (Calorie Deficit)" },
  { value: "cutting", label: "Cutting (Preserve Muscle)" },
  { value: "muscleGain", label: "Muscle Gain (Strength & Size)" },
  { value: "leanBulk", label: "Lean Bulk (Controlled Surplus)" },
  { value: "recomposition", label: "Body Recomposition" },
  { value: "maintenance", label: "Weight Maintenance" },
];

export default function Auth({
  mode,
  onModeChange,
  onAuthSuccess,
  onBack,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    gender: "male" as "male" | "female",
    initialGoal: "generalFitness" as FitnessGoal,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailClean = form.email.trim().toLowerCase();
    if (!emailClean || !form.password) {
      setError("Please fill in your email and password.");
      return;
    }

    if (mode === "register") {
      if (form.name.trim().length < 2) {
        setError("Please enter your full name (at least 2 characters).");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (form.password !== form.confirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const bundle = await api.register({
          name: form.name.trim(),
          email: emailClean,
          password: form.password,
          confirm: form.confirm,
          gender: form.gender,
          initialGoal: form.initialGoal,
        });
        onAuthSuccess(bundle);
      } else {
        const bundle = await api.login({
          email: emailClean,
          password: form.password,
        });
        onAuthSuccess(bundle);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Left branding panel */}
      <div
        className="hidden md:flex flex-1 flex-col justify-between p-12 bg-cover bg-center relative border-r border-slate-800"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=1000&fit=crop&auto=format)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <span className="text-emerald-400 font-black text-2xl font-display tracking-tight">
            FIT
          </span>
          <span className="font-black text-2xl font-display text-white tracking-tight">
            PLAN
          </span>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Persistent Storage</span>
          </div>
          <blockquote className="text-white font-display text-3xl font-black leading-tight mb-4">
            "Every rep, every meal —{" "}
            <span className="text-emerald-400">by design.</span>"
          </blockquote>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Your personalized nutrition, workout splits, and body metrics are securely
            persisted in your database so you can track consistent progress over time.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={onBack}
            className="mb-8 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </button>

          <div className="mb-8">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4 fill-emerald-400" />
              </div>
              <span className="text-emerald-400 font-black text-xl font-display">FIT</span>
              <span className="font-black text-xl font-display text-white">PLAN</span>
            </div>
            <h1 className="font-display font-black text-3xl text-white mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === "login"
                ? "Sign in to access your personalized diet, workouts, and progress."
                : "Register to build and save your personalized fitness plan."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      autoComplete="name"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pl-10"
                    />
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                      Profile Gender
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="male" className="bg-slate-900 text-white">Male</option>
                      <option value="female" className="bg-slate-900 text-white">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                      Initial Goal
                    </label>
                    <select
                      value={form.initialGoal}
                      onChange={(e) => set("initialGoal", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      {INITIAL_GOALS.map((g) => (
                        <option key={g.value} value={g.value} className="bg-slate-900 text-white">
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@domain.com"
                  autoComplete="email"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pl-10"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={
                    mode === "register" ? "Minimum 8 characters" : "••••••••"
                  }
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pl-10"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirm}
                    onChange={(e) => set("confirm", e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pl-10"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="text-red-400 text-xs bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? mode === "login"
                  ? "SIGNING IN..."
                  : "CREATING ACCOUNT..."
                : mode === "login"
                  ? "SIGN IN TO DASHBOARD"
                  : "CREATE ACCOUNT & START ASSESSMENT"}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setError("");
                onModeChange(mode === "login" ? "register" : "login");
              }}
              className="text-emerald-400 font-semibold hover:underline ml-1"
            >
              {mode === "login" ? "Register now" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
