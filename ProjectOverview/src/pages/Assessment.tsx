import { useState } from "react";
import type { AssessmentData, FitnessGoal } from "../lib/types";
import { AVATAR_OPTIONS, UserAvatar } from "../components/Avatar";
import {
  Zap,
  Dumbbell,
  Home,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface Props {
  userName: string;
  initialGoal?: FitnessGoal;
  initialGender?: "male" | "female";
  existingAssessment?: AssessmentData | null;
  onComplete: (data: AssessmentData) => Promise<void> | void;
  onCancel?: () => void;
}

const STEPS = [
  "Personal & Avatar",
  "Body & Lifestyle",
  "Fitness Goal",
  "Workout Preferences",
  "Diet Preferences",
];

const GOALS: { id: FitnessGoal; label: string; desc: string }[] = [
  { id: "fatLoss", label: "Fat Loss", desc: "20% calorie deficit with elevated protein for steady fat reduction" },
  { id: "cutting", label: "Cutting", desc: "25% deficit focused on preserving lean muscle mass during strict definition" },
  { id: "muscleGain", label: "Muscle Gain", desc: "10% calorie surplus paired with progressive resistance training" },
  { id: "leanBulk", label: "Lean Bulk", desc: "5% controlled calorie surplus to minimize adipose accumulation" },
  { id: "recomposition", label: "Body Recomposition", desc: "Slight deficit (5%) with high protein to lose fat while building muscle" },
  { id: "maintenance", label: "Maintenance", desc: "Match calculated TDEE to stabilize current body composition" },
  { id: "generalFitness", label: "General Fitness", desc: "Balanced energy intake for cardiovascular health and general stamina" },
];

const EQUIPMENT_OPTIONS = [
  "Dumbbells",
  "Barbell",
  "Pull-up bar",
  "Resistance bands",
  "Bench",
  "Squat rack",
  "Cable machine",
  "Kettlebell",
  "Treadmill",
];

const FOOD_PREFS = [
  "Rice",
  "Roti",
  "Oats",
  "Eggs",
  "Chicken",
  "Fish",
  "Paneer",
  "Soya chunks",
  "Dal",
  "Chana",
  "Fruits",
  "Nuts",
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-slate-500 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  min,
  max,
  placeholder,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-900 text-white">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function Assessment({
  userName,
  initialGoal,
  initialGender,
  existingAssessment,
  onComplete,
  onCancel,
}: Props) {
  const defaultGender = existingAssessment?.gender ?? initialGender ?? "male";
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AssessmentData>(
    existingAssessment ?? {
      age: 25,
      gender: defaultGender,
      avatarId: defaultGender === "female" ? "female_athlete" : "male_athlete",
      height: 170,
      weight: 70,
      waist: undefined,
      activityLevel: "moderate",
      fitnessGoal: initialGoal ?? "generalFitness",
      experienceLevel: "beginner",
      workoutLocation: "gym",
      equipment: ["Dumbbells", "Barbell", "Bench"],
      workoutDaysPerWeek: 4,
      workoutDuration: 60,
      dietType: "nonVegetarian",
      mealsPerDay: 3,
      foodPreferences: ["Rice", "Roti", "Dal", "Fruits"],
    },
  );

  const set = <K extends keyof AssessmentData>(k: K, v: AssessmentData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    if (error) setError("");
  };

  const toggleArr = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const validateCurrentStep = (): boolean => {
    if (step === 0) {
      if (!data.age || data.age < 15 || data.age > 100) {
        setError("Please enter a valid age between 15 and 100 years.");
        return false;
      }
    }
    if (step === 1) {
      if (!data.height || data.height < 100 || data.height > 260) {
        setError("Please enter a valid height between 100 cm and 260 cm.");
        return false;
      }
      if (!data.weight || data.weight < 30 || data.weight > 350) {
        setError("Please enter a valid weight between 30 kg and 350 kg.");
        return false;
      }
      if (data.waist !== undefined && (data.waist < 40 || data.waist > 220)) {
        setError("Waist circumference must be between 40 cm and 220 cm (or leave blank).");
        return false;
      }
    }
    return true;
  };

  const next = async () => {
    setError("");
    if (!validateCurrentStep()) return;

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    try {
      await onComplete(data);
    } catch (err: any) {
      setError(err?.message || "Failed to save assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const prev = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const genderAvatars = AVATAR_OPTIONS.filter((a) => a.gender === data.gender);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Header */}
      <div className="border-b border-slate-800 bg-[#0f172a]/95 px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <span className="text-emerald-400 font-black text-xl font-display">FIT</span>
          <span className="font-black text-xl font-display text-white">PLAN</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">
            Athlete: <span className="text-white font-bold">{userName}</span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 md:px-12 pt-8 pb-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-3">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i <= step ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-slate-400 text-xs font-medium">{STEPS[step]}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 md:px-12 py-8 max-w-2xl mx-auto w-full">
        <h2 className="font-display font-black text-3xl text-white mb-6">
          {STEPS[step]}
        </h2>

        <div className="space-y-6 flex-1">
          {/* Step 0: Personal Info & Avatar */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age (years)" hint="15 – 100 years">
                  <Input
                    type="number"
                    value={data.age}
                    onChange={(v) => set("age", Number(v))}
                    min={15}
                    max={100}
                  />
                </Field>
                <Field label="Gender">
                  <Select
                    value={data.gender}
                    onChange={(v) => {
                      const nextGender = v as "male" | "female";
                      set("gender", nextGender);
                      set(
                        "avatarId",
                        nextGender === "female" ? "female_athlete" : "male_athlete",
                      );
                    }}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ]}
                  />
                </Field>
              </div>

              <Field
                label="Choose Your Profile Avatar"
                hint="Select a male or female persona to represent your training profile"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {genderAvatars.map((av) => {
                    const active = data.avatarId === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => set("avatarId", av.id)}
                        className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                          active
                            ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="mb-2">
                          <UserAvatar avatarId={av.id} name={userName} size="md" />
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            active ? "text-emerald-400" : "text-slate-300"
                          }`}
                        >
                          {av.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </>
          )}

          {/* Step 1: Body & Lifestyle */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Height (cm)" hint="100 – 260 cm">
                  <Input
                    type="number"
                    value={data.height}
                    onChange={(v) => set("height", Number(v))}
                    min={100}
                    max={260}
                  />
                </Field>
                <Field label="Current Weight (kg)" hint="30 – 350 kg">
                  <Input
                    type="number"
                    value={data.weight}
                    onChange={(v) => set("weight", Number(v))}
                    min={30}
                    max={350}
                  />
                </Field>
              </div>
              <Field label="Waist Circumference (cm)" hint="Optional (40 – 220 cm for body-fat estimation)">
                <Input
                  type="number"
                  value={data.waist ?? ""}
                  onChange={(v) => set("waist", v ? Number(v) : undefined)}
                  placeholder="Optional (e.g. 82)"
                  min={40}
                  max={220}
                />
              </Field>
              <Field label="Daily Activity Level">
                <Select
                  value={data.activityLevel}
                  onChange={(v) =>
                    set("activityLevel", v as AssessmentData["activityLevel"])
                  }
                  options={[
                    { value: "sedentary", label: "Sedentary (desk job, minimal exercise)" },
                    { value: "light", label: "Lightly active (1–3 training days/week)" },
                    { value: "moderate", label: "Moderately active (3–5 training days/week)" },
                    { value: "active", label: "Very active (6–7 training days/week)" },
                    { value: "veryActive", label: "Extremely active (heavy labor + 2x daily training)" },
                  ]}
                />
              </Field>
            </>
          )}

          {/* Step 2: Fitness Goal */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => set("fitnessGoal", g.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    data.fitnessGoal === g.id
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold text-sm ${
                        data.fitnessGoal === g.id ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {g.label}
                    </span>
                    {data.fitnessGoal === g.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-slate-400 text-xs mt-1">{g.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Workout Preferences */}
          {step === 3 && (
            <>
              <Field label="Experience Level">
                <div className="grid grid-cols-3 gap-3">
                  {(["beginner", "intermediate", "advanced"] as const).map(
                    (lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => set("experienceLevel", lvl)}
                        className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          data.experienceLevel === lvl
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ),
                  )}
                </div>
              </Field>

              <Field label="Workout Location">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { loc: "home", label: "Home Training", icon: Home },
                      { loc: "gym", label: "Gym Facility", icon: Dumbbell },
                    ] as const
                  ).map(({ loc, label, icon: Icon }) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => set("workoutLocation", loc)}
                      className={`py-3.5 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        data.workoutLocation === loc
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </Field>

              {data.workoutLocation === "gym" && (
                <Field label="Available Equipment">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "equipment",
                          data.equipment.length === EQUIPMENT_OPTIONS.length
                            ? []
                            : [...EQUIPMENT_OPTIONS],
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        data.equipment.length === EQUIPMENT_OPTIONS.length
                          ? "border-emerald-500 bg-emerald-500 text-slate-950"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {data.equipment.length === EQUIPMENT_OPTIONS.length
                        ? "Clear all"
                        : "Select all"}
                    </button>
                    {EQUIPMENT_OPTIONS.map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() =>
                          set("equipment", toggleArr(data.equipment, eq))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          data.equipment.includes(eq)
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Workout Days / Week">
                  <Select
                    value={String(data.workoutDaysPerWeek)}
                    onChange={(v) => set("workoutDaysPerWeek", Number(v))}
                    options={[2, 3, 4, 5, 6].map((n) => ({
                      value: String(n),
                      label: `${n} days / week`,
                    }))}
                  />
                </Field>
                <Field label="Session Duration">
                  <Select
                    value={String(data.workoutDuration)}
                    onChange={(v) => set("workoutDuration", Number(v))}
                    options={[
                      { value: "30", label: "30 minutes" },
                      { value: "45", label: "45 minutes" },
                      { value: "60", label: "60 minutes" },
                      { value: "90", label: "90 minutes" },
                    ]}
                  />
                </Field>
              </div>
            </>
          )}

          {/* Step 4: Diet Preferences */}
          {step === 4 && (
            <>
              <Field label="Diet Type">
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: "vegetarian", label: "Vegetarian" },
                      { id: "eggetarian", label: "Eggetarian" },
                      { id: "nonVegetarian", label: "Non-Veg" },
                    ] as { id: AssessmentData["dietType"]; label: string }[]
                  ).map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => set("dietType", dt.id)}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                        data.dietType === dt.id
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Meals Per Day">
                <Select
                  value={String(data.mealsPerDay)}
                  onChange={(v) => set("mealsPerDay", Number(v))}
                  options={[2, 3, 4, 5, 6].map((n) => ({
                    value: String(n),
                    label: `${n} meals / day`,
                  }))}
                />
              </Field>

              <Field label="Food Preferences" hint="Select staple foods you enjoy consuming regularly">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "foodPreferences",
                        data.foodPreferences.length === FOOD_PREFS.length
                          ? []
                          : [...FOOD_PREFS],
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      data.foodPreferences.length === FOOD_PREFS.length
                        ? "border-emerald-500 bg-emerald-500 text-slate-950"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {data.foodPreferences.length === FOOD_PREFS.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                  {FOOD_PREFS.map((fp) => (
                    <button
                      key={fp}
                      type="button"
                      onClick={() =>
                        set("foodPreferences", toggleArr(data.foodPreferences, fp))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        data.foodPreferences.includes(fp)
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {fp}
                    </button>
                  ))}
                </div>
              </Field>
            </>
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
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0 || submitting}
            className="text-slate-400 hover:text-white text-xs font-mono uppercase tracking-wider disabled:opacity-30 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>
          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3.5 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center gap-2"
          >
            <span>
              {submitting
                ? "Generating Custom Plan..."
                : step === STEPS.length - 1
                  ? "Generate My Custom Plan"
                  : "Next Step"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
