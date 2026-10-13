import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ProgressEntry } from "../lib/types";
import {
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Scale,
  Activity,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Calculator,
  Download,
} from "lucide-react";

interface Props {
  progress: ProgressEntry[];
  onAddEntry: (entry: {
    weight: number;
    waist?: number;
    bodyFatPct?: number;
    workoutCompleted: boolean;
    isoDate?: string;
    notes?: string;
  }) => Promise<void> | void;
  onDeleteEntry: (entryId: number) => Promise<void> | void;
  startWeight: number;
}

type DateFilter = "all" | "7" | "30" | "90";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs shadow-2xl text-slate-100">
      <p className="text-slate-400 font-mono text-[11px] mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono font-bold text-sm">
          {p.name}: {p.value}
          {p.dataKey === "weight" ? " kg" : p.dataKey === "waist" ? " cm" : "%"}
        </p>
      ))}
    </div>
  );
}

export default function Progress({
  progress,
  onAddEntry,
  onDeleteEntry,
  startWeight,
}: Props) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [form, setForm] = useState({
    weight: "",
    waist: "",
    bodyFatPct: "",
    isoDate: new Date().toISOString().slice(0, 10),
    workoutCompleted: false,
    notes: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // US Navy Body Fat Calculator State
  const [showNavyModal, setShowNavyModal] = useState(false);
  const [navyGender, setNavyGender] = useState<"male" | "female">("male");
  const [navyHeight, setNavyHeight] = useState("175");
  const [navyNeck, setNavyNeck] = useState("38");
  const [navyWaist, setNavyWaist] = useState("84");
  const [navyHip, setNavyHip] = useState("95");
  const [calculatedBf, setCalculatedBf] = useState<number | null>(null);

  const calculateNavyBf = () => {
    const h = parseFloat(navyHeight);
    const n = parseFloat(navyNeck);
    const w = parseFloat(navyWaist);
    const hip = parseFloat(navyHip);
    if (!h || !n || !w || w <= n) return;
    let bf = 0;
    if (navyGender === "male") {
      bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      if (w + hip <= n) return;
      bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.22100 * Math.log10(h)) - 450;
    }
    const val = Math.round(Math.max(3, Math.min(60, bf)) * 10) / 10;
    setCalculatedBf(val);
  };

  const applyCalculatedBf = () => {
    if (calculatedBf !== null) {
      setForm((f) => ({
        ...f,
        waist: navyWaist || f.waist,
        bodyFatPct: calculatedBf.toString(),
      }));
      setShowNavyModal(false);
      setShowForm(true);
    }
  };

  const exportProgressCsv = () => {
    if (!progress.length) return;
    const headers = ["Date", "Weight_kg", "Waist_cm", "Body_Fat_pct", "Workout_Completed", "Notes"];
    const rows = progress.map((p) => [
      p.isoDate || p.date,
      p.weight,
      p.waist ?? "",
      p.bodyFatPct ?? "",
      p.workoutCompleted ? "YES" : "NO",
      `"${(p.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fitplan_progress_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = useMemo(() => {
    if (dateFilter === "all") return progress;
    const days = Number(dateFilter);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    return progress.filter((entry) => !entry.isoDate || entry.isoDate >= cutoffIso);
  }, [progress, dateFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const w = Number(form.weight);
    if (!w || w < 30 || w > 350) {
      setError("Please enter a valid weight between 30 kg and 350 kg.");
      return;
    }
    if (form.waist && (Number(form.waist) < 40 || Number(form.waist) > 220)) {
      setError("Waist measurement must be between 40 cm and 220 cm.");
      return;
    }

    setSubmitting(true);
    try {
      await onAddEntry({
        weight: w,
        waist: form.waist ? Number(form.waist) : undefined,
        bodyFatPct: form.bodyFatPct ? Number(form.bodyFatPct) : undefined,
        workoutCompleted: form.workoutCompleted,
        isoDate: form.isoDate || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({
        weight: "",
        waist: "",
        bodyFatPct: "",
        isoDate: new Date().toISOString().slice(0, 10),
        workoutCompleted: false,
        notes: "",
      });
      setShowForm(false);
    } catch (err: any) {
      setError(err?.message || "Could not save progress measurement.");
    } finally {
      setSubmitting(false);
    }
  };

  const current =
    filteredData.length > 0
      ? filteredData[filteredData.length - 1]
      : progress[progress.length - 1];
  const first =
    filteredData.length > 0 ? filteredData[0] : progress[0];
  const weightChange =
    current && first
      ? Math.round((current.weight - first.weight) * 10) / 10
      : 0;
  const workoutsCompleted = filteredData.filter((d) => d.workoutCompleted).length;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-emerald-400 font-mono text-[11px] mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>PROGRESS &amp; METRICS</span>
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white">
            Body Analytics &amp; Trends
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Persisted progress records filtered in real-time from your MySQL database.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportProgressCsv}
            disabled={!progress.length}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 disabled:opacity-40 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Download your progress history as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNavyModal(true)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Calculate body fat % using US Navy anthropometric equation"
          >
            <Calculator className="w-3.5 h-3.5 text-sky-400" />
            <span>Body Fat Calc</span>
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Measurement</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(
            [
              { id: "all", label: "All Time" },
              { id: "90", label: "Last 90 Days" },
              { id: "30", label: "Last 30 Days" },
              { id: "7", label: "Last 7 Days" },
            ] as { id: DateFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDateFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilter === f.id
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-400">
          Displaying {filteredData.length} measurement{filteredData.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Log Form */}
      {showForm && (
        <form
          onSubmit={submit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-sm text-white">
              Record New Biometric Measurement
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={form.isoDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isoDate: e.target.value }))
                }
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="350"
                value={form.weight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weight: e.target.value }))
                }
                placeholder="e.g. 74.5"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Body Fat (%)
                </label>
                <button
                  type="button"
                  onClick={() => setShowNavyModal(true)}
                  className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline"
                >
                  Estimate
                </button>
              </div>
              <input
                type="number"
                step="0.1"
                min="2"
                max="65"
                value={form.bodyFatPct}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bodyFatPct: e.target.value }))
                }
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Check-in Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Post-cardio morning weigh-in"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={form.workoutCompleted}
              onChange={(e) =>
                setForm((f) => ({ ...f, workoutCompleted: e.target.checked }))
              }
              className="w-4 h-4 accent-emerald-500 rounded"
            />
            <span>Workout session executed on this date</span>
          </label>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {submitting ? "Saving Entry..." : "Save Measurement"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-slate-700 bg-slate-800 px-5 py-2 text-slate-400 hover:text-white text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* US Navy Body Fat Estimator Modal */}
      {showNavyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-400" />
                <h3 className="font-display font-bold text-base text-white">
                  US Navy Body Fat Calculator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNavyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates body fat percentage using the standardized US Navy anthropometric equation from circumference measurements.
            </p>

            <div className="flex gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setNavyGender("male")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  navyGender === "male"
                    ? "bg-sky-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Male Formula
              </button>
              <button
                type="button"
                onClick={() => setNavyGender("female")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  navyGender === "female"
                    ? "bg-sky-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Female Formula
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="120"
                  max="250"
                  value={navyHeight}
                  onChange={(e) => setNavyHeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Neck Circumference (cm)
                </label>
                <input
                  type="number"
                  min="20"
                  max="70"
                  value={navyNeck}
                  onChange={(e) => setNavyNeck(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Waist at Navel (cm)
                </label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={navyWaist}
                  onChange={(e) => setNavyWaist(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              {navyGender === "female" && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Hips at Widest (cm)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="220"
                    value={navyHip}
                    onChange={(e) => setNavyHip(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={calculateNavyBf}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20"
            >
              Calculate Estimated Body Fat
            </button>

            {calculatedBf !== null && (
              <div className="bg-slate-950 border border-sky-500/30 rounded-xl p-4 text-center space-y-2">
                <p className="text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                  Estimated Body Fat
                </p>
                <p className="font-mono font-black text-3xl text-sky-400">
                  {calculatedBf}%
                </p>
                <button
                  type="button"
                  onClick={applyCalculatedBf}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Log Form</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
            Latest Weight
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-black text-2xl text-white">
              {current?.weight ?? startWeight}
            </span>
            <span className="text-xs text-slate-400 font-mono">kg</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
            Net Change
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className={`font-mono font-black text-2xl ${
                weightChange <= 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {weightChange > 0 ? `+${weightChange}` : weightChange}
            </span>
            <span className="text-xs text-slate-400 font-mono">kg</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
            Training Consistency
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-black text-2xl text-white">
              {workoutsCompleted}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {filteredData.length} days
            </span>
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500 mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="font-display font-bold text-base text-slate-200">
            No progress entries in this time range
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &ldquo;+ Log Measurement&rdquo; above to record your weight, waist measurement, and training adherence.
          </p>
        </div>
      ) : (
        <>
          {/* Weight Chart */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-black text-lg text-white">
                Body Weight Trajectory (kg)
              </h2>
              <span className="text-xs font-mono text-emerald-400">
                {current?.weight} kg Current
              </span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart
                data={filteredData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981", stroke: "#0b0f19", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#34d399" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Waist Chart */}
          {filteredData.some((d) => d.waist) && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-black text-lg text-white">
                  Waist Circumference (cm)
                </h2>
                <span className="text-xs font-mono text-sky-400">
                  Adipose distribution trend
                </span>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart
                  data={filteredData.filter((d) => d.waist)}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="waist"
                    name="Waist"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#38bdf8", stroke: "#0b0f19", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#7dd3fc" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Log History */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h2 className="font-display font-bold text-sm text-white">
                Biometric Measurement History
              </h2>
            </div>
            <div className="divide-y divide-slate-800/80">
              {[...filteredData].reverse().map((entry, i) => (
                <div
                  key={entry.id ?? `${entry.date}-${i}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-200">{entry.date}</p>
                      {entry.isoDate && (
                        <span className="text-[11px] font-mono text-slate-500">
                          ({entry.isoDate})
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {entry.waist ? `Waist: ${entry.waist} cm · ` : ""}
                      {entry.bodyFatPct ? `Body Fat: ${entry.bodyFatPct}% · ` : ""}
                      {entry.notes || "Check-in logged"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-white text-sm">
                      {entry.weight} kg
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                        entry.workoutCompleted
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                      {entry.workoutCompleted ? "✓ Trained" : "Rest day"}
                    </span>
                    {entry.id && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id!)}
                        className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
