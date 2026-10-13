import { useState } from "react";
import type { AuthMode, FitnessGoal, UserBundle } from "../lib/types";
import { api, ApiError } from "../lib/api";
import {
  signInWithGoogle,
  isFirebaseConfigured,
  getFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  type FirebaseConfig,
} from "../lib/firebase";
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
  Settings,
  X,
  Check,
  ExternalLink,
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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Firebase Configuration Modal State
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [fbConfigText, setFbConfigText] = useState("");
  const [fbConfigMessage, setFbConfigMessage] = useState("");

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError("");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    if (!isFirebaseConfigured()) {
      setShowFirebaseModal(true);
      return;
    }

    setGoogleLoading(true);
    try {
      const { idToken, user: fbUser } = await signInWithGoogle();
      const bundle = await api.loginWithFirebase({
        idToken,
        name: fbUser.displayName || form.name || undefined,
        email: fbUser.email || undefined,
        photoUrl: fbUser.photoURL || undefined,
        gender: form.gender,
        initialGoal: form.initialGoal,
      });
      onAuthSuccess(bundle);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Google sign-in popup was closed before completing.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError(
          "Current domain is not authorized in Firebase Console (Authentication -> Settings -> Authorized Domains).",
        );
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || "Failed to authenticate with Firebase.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setFbConfigMessage("");
    try {
      const text = fbConfigText.trim();
      let parsed: Partial<FirebaseConfig> = {};

      if (text.startsWith("{")) {
        parsed = JSON.parse(text);
      } else {
        // Try extracting keys if pasted as key: value pairs
        const apiKeyMatch = text.match(/apiKey["']?\s*:\s*["']([^"']+)["']/);
        const authDomainMatch = text.match(/authDomain["']?\s*:\s*["']([^"']+)["']/);
        const projectIdMatch = text.match(/projectId["']?\s*:\s*["']([^"']+)["']/);
        const appIdMatch = text.match(/appId["']?\s*:\s*["']([^"']+)["']/);
        if (apiKeyMatch && projectIdMatch) {
          parsed = {
            apiKey: apiKeyMatch[1],
            authDomain: authDomainMatch?.[1] || `${projectIdMatch[1]}.firebaseapp.com`,
            projectId: projectIdMatch[1],
            appId: appIdMatch?.[1],
          };
        }
      }

      if (!parsed.apiKey || !parsed.projectId) {
        setFbConfigMessage(
          "Invalid config. Please paste your complete Firebase web configuration containing apiKey and projectId.",
        );
        return;
      }

      saveFirebaseConfig({
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket,
        messagingSenderId: parsed.messagingSenderId,
        appId: parsed.appId,
      });

      setFbConfigMessage("Firebase configuration saved successfully!");
      setTimeout(() => {
        setShowFirebaseModal(false);
        setFbConfigMessage("");
      }, 1200);
    } catch {
      setFbConfigMessage("Could not parse JSON. Please check formatting.");
    }
  };

  const handleClearFirebaseConfig = () => {
    clearFirebaseConfig();
    setFbConfigText("");
    setFbConfigMessage("Firebase configuration removed.");
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

  const configured = isFirebaseConfigured();

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
            <span>Firebase &amp; MySQL Persistent Security</span>
          </div>
          <blockquote className="text-white font-display text-3xl font-black leading-tight mb-4">
            "Every rep, every meal —{" "}
            <span className="text-emerald-400">by design.</span>"
          </blockquote>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Sign in with Google One-Click or email credentials. Your personalized nutrition,
            workout splits, and metrics are securely synced to your MySQL database.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={onBack}
              className="text-slate-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to home</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFirebaseModal(true)}
              className="text-slate-400 hover:text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Firebase Configuration"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{configured ? "Firebase Configured" : "Setup Firebase"}</span>
            </button>
          </div>

          <div className="mb-6">
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

          {/* Firebase Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm hover:border-slate-600 disabled:opacity-60 mb-6 group"
          >
            <GoogleIcon />
            <span>
              {googleLoading
                ? "Authenticating with Google..."
                : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Or with email &amp; password
            </span>
            <div className="flex-1 h-px bg-slate-800" />
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
                  ? "SIGN IN WITH EMAIL"
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

      {/* Firebase Setup Modal */}
      {showFirebaseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Settings className="w-4 h-4" />
                </div>
                <h2 className="font-display font-black text-lg text-white">
                  Connect Firebase Authentication
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFirebaseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>How to connect your Firebase Project in 60 seconds:</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>
                    Open{" "}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline inline-flex items-center gap-0.5"
                    >
                      console.firebase.google.com
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>Go to <strong>Authentication → Sign-in method</strong> and enable <strong>Google</strong>.</li>
                  <li>Go to <strong>Project Settings → General → Your apps → Web app</strong>.</li>
                  <li>Copy the <code>firebaseConfig</code> object and paste it below.</li>
                </ol>
              </div>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
                <label className="block text-xs font-mono uppercase text-slate-400">
                  Paste Firebase Config (JSON or JS Object)
                </label>
                <textarea
                  rows={6}
                  value={fbConfigText}
                  onChange={(e) => setFbConfigText(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app",\n  "appId": "1:..."\n}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />

                {fbConfigMessage && (
                  <p
                    className={`text-xs p-2.5 rounded-lg border ${
                      fbConfigMessage.includes("success")
                        ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                        : "bg-red-950/40 border-red-800/60 text-red-400"
                    }`}
                  >
                    {fbConfigMessage}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                  >
                    Save &amp; Connect Firebase
                  </button>
                  {configured && (
                    <button
                      type="button"
                      onClick={handleClearFirebaseConfig}
                      className="px-4 py-2.5 border border-slate-700 bg-slate-800 text-slate-400 hover:text-red-400 text-xs rounded-xl"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
