import { useRef, useState } from "react";
import type {
  MealPlan,
  FoodItem,
  NutritionLogEntry,
  FitnessMetrics,
} from "../lib/types";
import { FOOD_MAP, FOODS } from "../lib/data";
import { api } from "../lib/api";
import {
  Utensils,
  Sliders,
  RotateCcw,
  Plus,
  Trash2,
  Camera,
  Check,
  X,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  ArrowRight,
  Flame,
} from "lucide-react";

interface Props {
  meals: MealPlan[];
  metrics: FitnessMetrics;
  nutritionLogs: NutritionLogEntry[];
  onMealsChange: (meals: MealPlan[]) => Promise<void> | void;
  onRegenerateDiet: () => Promise<void> | void;
  onUpdateTargets: (targets: {
    calorieTarget?: number;
    proteinTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
    resetToCalculated?: boolean;
  }) => Promise<void> | void;
  onLogFood: (payload: any) => Promise<void> | void;
  onDeleteLog: (logId: number) => Promise<void> | void;
}

interface DetectedFood {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodAnalysis {
  mealName: string;
  foods: DetectedFood[];
  note?: string;
}

const EMPTY_FOOD: DetectedFood = {
  name: "",
  servingSize: "1 serving",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

const getMealTotals = (foods: DetectedFood[]) =>
  foods.reduce(
    (total, food) => ({
      calories: total.calories + Number(food.calories || 0),
      protein: total.protein + Number(food.protein || 0),
      carbs: total.carbs + Number(food.carbs || 0),
      fat: total.fat + Number(food.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

const prepareImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("We couldn't read that image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error("That image format isn't supported."));
      image.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("We couldn't prepare that image."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded-md font-semibold"
      style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
    >
      {label}: {Math.round(value)}g
    </span>
  );
}

function ReplacementModal({
  food,
  onClose,
  onReplace,
}: {
  food: FoodItem;
  onClose: () => void;
  onReplace: (newFoodId: string) => void;
}) {
  const explicitReplacements = (food.replacements || [])
    .map((id) => FOOD_MAP[id])
    .filter(Boolean);
  const categoryFallbacks = FOODS.filter(
    (f) => f.id !== food.id && f.category === food.category,
  );
  const replacements =
    explicitReplacements.length > 0 ? explicitReplacements : categoryFallbacks;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-black text-xl text-white">Substitute Food</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-400 text-xs mb-5">
          Swapping out: <strong className="text-emerald-400">{food.name}</strong> ({food.servingSize})
        </p>
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {replacements.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onReplace(r.id)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all text-left group"
            >
              <div>
                <p className="font-bold text-sm text-slate-200 group-hover:text-emerald-300 transition-colors">
                  {r.name}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{r.servingSize}</p>
              </div>
              <div className="text-right text-xs text-slate-400 font-mono">
                <div className="font-bold text-white">{r.calories} kcal</div>
                <div className="text-[11px] text-slate-500">
                  P: {r.protein}g · C: {r.carbs}g
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2.5 border border-slate-700 bg-slate-800/60 rounded-xl text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Diet({
  meals,
  metrics,
  nutritionLogs,
  onMealsChange,
  onRegenerateDiet,
  onUpdateTargets,
  onLogFood,
  onDeleteLog,
}: Props) {
  const [activeTab, setActiveTab] = useState<"plan" | "log">("plan");
  const [replacing, setReplacing] = useState<{
    mealIdx: number;
    foodIdx: number;
    food: FoodItem;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Editable Targets Modal State
  const [editingTargets, setEditingTargets] = useState(false);
  const [targetForm, setTargetForm] = useState({
    calorieTarget: String(metrics.calorieTarget),
    proteinTarget: String(metrics.proteinTarget),
    carbTarget: String(metrics.carbTarget),
    fatTarget: String(metrics.fatTarget),
  });
  const [savingTargets, setSavingTargets] = useState(false);

  // Add Custom Food to Log / Plan State
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);
  const [customFood, setCustomFood] = useState({
    mealName: "Breakfast",
    foodName: "",
    servingSize: "1 serving",
    quantity: "1",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  // Smart Meal Photo Scanner State
  const [scanPreview, setScanPreview] = useState("");
  const [scanImage, setScanImage] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [scanError, setScanError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 3500);
  };

  const recalcMeal = (foods: { food: FoodItem; quantity: number }[]) => {
    return foods.reduce(
      (acc, { food, quantity }) => ({
        cal: acc.cal + food.calories * quantity,
        prot: acc.prot + food.protein * quantity,
        carb: acc.carb + food.carbs * quantity,
        fat: acc.fat + food.fat * quantity,
      }),
      { cal: 0, prot: 0, carb: 0, fat: 0 },
    );
  };

  const doReplace = async (
    mealIdx: number,
    foodIdx: number,
    newFoodId: string,
  ) => {
    const newFood = FOOD_MAP[newFoodId];
    if (!newFood) return;
    const updated = meals.map((meal, mi) => {
      if (mi !== mealIdx) return meal;
      const newFoods = meal.foods.map((f, fi) =>
        fi === foodIdx ? { ...f, food: newFood } : f,
      );
      const totals = recalcMeal(newFoods);
      return {
        ...meal,
        foods: newFoods,
        totalCalories: Math.round(totals.cal),
        totalProtein: Math.round(totals.prot),
        totalCarbs: Math.round(totals.carb),
        totalFat: Math.round(totals.fat),
      };
    });
    setReplacing(null);
    await onMealsChange(updated);
    notify(`Substituted with ${newFood.name}`);
  };

  const adjustQuantity = async (
    mealIdx: number,
    foodIdx: number,
    delta: number,
  ) => {
    const updated = meals.map((meal, mi) => {
      if (mi !== mealIdx) return meal;
      const newFoods = meal.foods.map((f, fi) => {
        if (fi !== foodIdx) return f;
        const nextQty = Math.max(0.25, Math.round((f.quantity + delta) * 4) / 4);
        return { ...f, quantity: nextQty };
      });
      const totals = recalcMeal(newFoods);
      return {
        ...meal,
        foods: newFoods,
        totalCalories: Math.round(totals.cal),
        totalProtein: Math.round(totals.prot),
        totalCarbs: Math.round(totals.carb),
        totalFat: Math.round(totals.fat),
      };
    });
    await onMealsChange(updated);
  };

  const handleLogPlannedMeal = async (meal: MealPlan) => {
    const items = meal.foods.map(({ food, quantity }) => ({
      mealName: meal.mealName,
      foodName: food.name,
      servingSize: food.servingSize,
      quantity,
      calories: Math.round(food.calories * quantity),
      protein: Math.round(food.protein * quantity * 10) / 10,
      carbs: Math.round(food.carbs * quantity * 10) / 10,
      fat: Math.round(food.fat * quantity * 10) / 10,
    }));
    await onLogFood({ mealName: meal.mealName, items });
    notify(`Logged ${meal.mealName} (${meal.totalCalories} kcal) to today's food log.`);
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTargets(true);
    try {
      await onUpdateTargets({
        calorieTarget: Number(targetForm.calorieTarget),
        proteinTarget: Number(targetForm.proteinTarget),
        carbTarget: Number(targetForm.carbTarget),
        fatTarget: Number(targetForm.fatTarget),
      });
      setEditingTargets(false);
      notify("Macronutrient targets successfully updated in database.");
    } finally {
      setSavingTargets(false);
    }
  };

  const handleResetTargets = async () => {
    setSavingTargets(true);
    try {
      await onUpdateTargets({ resetToCalculated: true });
      setEditingTargets(false);
      notify("Nutrition targets reset to Mifflin-St Jeor formula estimates.");
    } finally {
      setSavingTargets(false);
    }
  };

  const handleCustomFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFood.foodName.trim() || !customFood.calories) return;
    await onLogFood({
      mealName: customFood.mealName,
      foodName: customFood.foodName.trim(),
      servingSize: customFood.servingSize.trim() || "1 serving",
      quantity: Number(customFood.quantity) || 1,
      calories: Number(customFood.calories) || 0,
      protein: Number(customFood.protein) || 0,
      carbs: Number(customFood.carbs) || 0,
      fat: Number(customFood.fat) || 0,
    });
    setCustomFood({
      mealName: "Breakfast",
      foodName: "",
      servingSize: "1 serving",
      quantity: "1",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
    setShowCustomFoodForm(false);
    notify("Custom food item saved to your nutrition log.");
  };

  const closeScanner = () => {
    if (isAnalyzing) return;
    setIsScannerOpen(false);
    setScanPreview("");
    setScanImage("");
    setAnalysis(null);
    setScanError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setScanError("");
    setAnalysis(null);
    try {
      const result = await api.analyzeMealImage(imageData);
      setAnalysis(result);
    } catch (error: any) {
      setScanError(error?.message || "Could not analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsScannerOpen(true);
    if (!file.type.startsWith("image/")) {
      setScanError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    try {
      const prepared = await prepareImage(file);
      setScanPreview(prepared);
      setScanImage(prepared);
      await analyzeImage(prepared);
    } catch (error: any) {
      setScanError(error?.message || "Could not process that photo.");
    }
  };

  const saveAnalyzedMealToPlan = async () => {
    if (!analysis || analysis.foods.length === 0) return;
    const totals = getMealTotals(analysis.foods);
    const timestamp = Date.now();
    const meal: MealPlan = {
      mealName: analysis.mealName.trim() || "Scanned Meal",
      foods: analysis.foods.map((food, index) => ({
        quantity: 1,
        food: {
          id: `scan-${timestamp}-${index}`,
          name: food.name.trim(),
          servingSize: food.servingSize.trim() || "1 serving",
          calories: Number(food.calories) || 0,
          protein: Number(food.protein) || 0,
          carbs: Number(food.carbs) || 0,
          fat: Number(food.fat) || 0,
          dietTypes: ["vegetarian", "eggetarian", "nonVegetarian"],
          category: "scanned",
          replacements: [],
        },
      })),
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein),
      totalCarbs: Math.round(totals.carbs),
      totalFat: Math.round(totals.fat),
    };
    await onMealsChange([...meals, meal]);
    await onLogFood({
      mealName: meal.mealName,
      items: analysis.foods.map((f) => ({
        mealName: meal.mealName,
        foodName: f.name.trim(),
        servingSize: f.servingSize.trim() || "1 serving",
        quantity: 1,
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fat: Number(f.fat) || 0,
      })),
    });
    closeScanner();
    notify("Scanned meal appended to plan and logged to today's intake!");
  };

  const plannedTotals = meals.reduce(
    (acc, m) => ({
      cal: acc.cal + m.totalCalories,
      prot: acc.prot + m.totalProtein,
      carb: acc.carb + m.totalCarbs,
      fat: acc.fat + m.totalFat,
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 },
  );

  const loggedTotals = nutritionLogs.reduce(
    (acc, l) => ({
      cal: acc.cal + l.calories,
      prot: acc.prot + l.protein,
      carb: acc.carb + l.carbs,
      fat: acc.fat + l.fat,
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 },
  );

  const activeSummary = activeTab === "plan" ? plannedTotals : loggedTotals;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-emerald-400 font-mono text-[11px] mb-1">
            <Utensils className="w-3 h-3" />
            <span>NUTRITION SYSTEM</span>
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white">
            Diet &amp; Nutrition Planner
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Fine-tune daily macronutrient targets, swap ingredients, and log foods.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              setTargetForm({
                calorieTarget: String(metrics.calorieTarget),
                proteinTarget: String(metrics.proteinTarget),
                carbTarget: String(metrics.carbTarget),
                fatTarget: String(metrics.fatTarget),
              });
              setEditingTargets((v) => !v);
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit Targets</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await onRegenerateDiet();
              notify("Diet plan refreshed to match current targets!");
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage("")}
            className="text-emerald-400/80 hover:text-emerald-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editable Nutrition Targets Panel */}
      {editingTargets && (
        <form
          onSubmit={handleSaveTargets}
          className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-black text-lg text-white">
                Customize Daily Macro Targets
              </h2>
              <p className="text-xs text-slate-400">
                Formula estimations: {metrics.tdee} kcal TDEE · BMR {metrics.bmr} kcal
              </p>
            </div>
            {metrics.isCustomTargets && (
              <button
                type="button"
                onClick={handleResetTargets}
                disabled={savingTargets}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                Reset to Mifflin-St Jeor
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { key: "calorieTarget", label: "Calories (kcal)", min: 1000, max: 8000 },
              { key: "proteinTarget", label: "Protein (g)", min: 20, max: 500 },
              { key: "carbTarget", label: "Carbs (g)", min: 0, max: 1000 },
              { key: "fatTarget", label: "Fat (g)", min: 10, max: 350 },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  {field.label}
                </label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  required
                  value={(targetForm as any)[field.key]}
                  onChange={(e) =>
                    setTargetForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={savingTargets}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              {savingTargets ? "Saving Targets..." : "Save Custom Targets"}
            </button>
            <button
              type="button"
              onClick={() => setEditingTargets(false)}
              className="border border-slate-700 bg-slate-800 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("plan")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "plan"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Recommended Meal Plan ({meals.length} meals)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("log")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "log"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Today's Consumed Log ({nutritionLogs.length} items)</span>
        </button>
      </div>

      {/* Macro Summary Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: activeTab === "plan" ? "Planned Calories" : "Logged Calories",
            value: Math.round(activeSummary.cal),
            target: metrics.calorieTarget,
            unit: "kcal",
            color: "#10b981",
          },
          {
            label: activeTab === "plan" ? "Planned Protein" : "Logged Protein",
            value: Math.round(activeSummary.prot),
            target: metrics.proteinTarget,
            unit: "g",
            color: "#38bdf8",
          },
          {
            label: activeTab === "plan" ? "Planned Carbs" : "Logged Carbs",
            value: Math.round(activeSummary.carb),
            target: metrics.carbTarget,
            unit: "g",
            color: "#a78bfa",
          },
          {
            label: activeTab === "plan" ? "Planned Fat" : "Logged Fat",
            value: Math.round(activeSummary.fat),
            target: metrics.fatTarget,
            unit: "g",
            color: "#fb923c",
          },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p
              className="font-mono font-black text-xl"
              style={{ color: item.color }}
            >
              {item.value}
              <span className="text-xs font-normal text-slate-400 ml-1">
                / {item.target} {item.unit}
              </span>
            </p>
            <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((item.value / Math.max(1, item.target)) * 100),
                  )}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* TAB 1: RECOMMENDED MEAL PLAN */}
      {activeTab === "plan" && (
        <div className="space-y-4">
          {meals.map((meal, mi) => (
            <div
              key={`${meal.mealName}-${mi}`}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-black text-lg text-white">
                    {meal.mealName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleLogPlannedMeal(meal)}
                    className="text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Log as Eaten</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {meal.totalCalories} kcal
                  </span>
                  <MacroPill label="P" value={meal.totalProtein} color="#38bdf8" />
                  <MacroPill label="C" value={meal.totalCarbs} color="#a78bfa" />
                  <MacroPill label="F" value={meal.totalFat} color="#fb923c" />
                </div>
              </div>
              <div className="divide-y divide-slate-800/80">
                {meal.foods.map(({ food, quantity }, fi) => (
                  <div
                    key={`${food.id}-${fi}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-800/20 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-200">{food.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {quantity} × {food.servingSize}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(mi, fi, -0.25)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Decrease portion"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-slate-200">
                          {quantity}×
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(mi, fi, 0.25)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Increase portion"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right hidden sm:block min-w-[90px]">
                        <p className="font-mono text-xs font-bold text-white">
                          {Math.round(food.calories * quantity)} kcal
                        </p>
                        <p className="text-slate-500 text-[11px] font-mono">
                          P:{Math.round(food.protein * quantity)}g C:{Math.round(food.carbs * quantity)}g
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setReplacing({ mealIdx: mi, foodIdx: fi, food })
                        }
                        className="text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
                      >
                        Swap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: DAILY CONSUMED FOOD LOG */}
      {activeTab === "log" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-black text-xl text-white">
              Today's Logged Foods
            </h2>
            <button
              type="button"
              onClick={() => setShowCustomFoodForm((v) => !v)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Food</span>
            </button>
          </div>

          {showCustomFoodForm && (
            <form
              onSubmit={handleCustomFoodSubmit}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
            >
              <h3 className="font-display font-bold text-sm text-white mb-4">
                Log Custom Food or Snack
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Meal Timing
                  </label>
                  <select
                    value={customFood.mealName}
                    onChange={(e) =>
                      setCustomFood((f) => ({ ...f, mealName: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Mid-Morning Snack">Mid-Morning Snack</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Evening Snack">Evening Snack</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Post-Workout">Post-Workout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scrambled Eggs on Toast"
                    value={customFood.foodName}
                    onChange={(e) =>
                      setCustomFood((f) => ({ ...f, foodName: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Portion Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 whole eggs + 2 slices"
                    value={customFood.servingSize}
                    onChange={(e) =>
                      setCustomFood((f) => ({
                        ...f,
                        servingSize: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { key: "calories", label: "Calories (kcal) *" },
                  { key: "protein", label: "Protein (g)" },
                  { key: "carbs", label: "Carbs (g)" },
                  { key: "fat", label: "Fat (g)" },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required={item.key === "calories"}
                      value={(customFood as any)[item.key]}
                      onChange={(e) =>
                        setCustomFood((f) => ({
                          ...f,
                          [item.key]: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Save to Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomFoodForm(false)}
                  className="border border-slate-700 bg-slate-800 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {nutritionLogs.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500 mb-3">
                <Utensils className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-base text-slate-200">
                No meals logged yet today
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click &ldquo;Log as Eaten&rdquo; from your recommended meal plan or add a custom food item above.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
              {nutritionLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {log.mealName}
                    </span>
                    <p className="font-bold text-sm text-slate-200 mt-1">{log.foodName}</p>
                    <p className="text-xs text-slate-500">
                      {log.quantity} × {log.servingSize}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <p className="text-sm font-bold text-white">
                        {log.calories} kcal
                      </p>
                      <p className="text-[11px] text-slate-400">
                        P:{log.protein}g · C:{log.carbs}g · F:{log.fat}g
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteLog(log.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                      title="Delete log entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {replacing && (
        <ReplacementModal
          food={replacing.food}
          onClose={() => setReplacing(null)}
          onReplace={(id) =>
            doReplace(replacing.mealIdx, replacing.foodIdx, id)
          }
        />
      )}

      {/* Floating Smart Meal Photo Scanner Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelected}
        className="sr-only"
        aria-label="Upload meal photo"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-2xl bg-emerald-500 text-slate-950 px-5 py-3.5 font-bold shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
      >
        <Camera className="w-4 h-4" />
        <span className="text-xs">Scan Meal Photo</span>
      </button>

      {/* Smart Meal Scanner Modal */}
      {isScannerOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm md:items-center md:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl md:rounded-3xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  SMART MEAL SCANNER
                </p>
                <h2 className="font-display text-lg font-black text-white">
                  {isAnalyzing ? "Analyzing Meal Image..." : "Review Scanned Meal"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scanPreview && (
              <div className="mb-4 aspect-video overflow-hidden rounded-2xl bg-slate-950 border border-slate-800">
                <img
                  src={scanPreview}
                  alt="Scanned meal"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-6">
                <div className="inline-block animate-spin text-emerald-400 mb-2">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  Estimating ingredients and macronutrients...
                </p>
              </div>
            )}

            {scanError && !isAnalyzing && (
              <div className="rounded-xl bg-red-950/40 border border-red-800/60 p-4 text-center">
                <p className="text-xs text-red-400 font-semibold">{scanError}</p>
                <button
                  type="button"
                  onClick={() =>
                    scanImage
                      ? analyzeImage(scanImage)
                      : fileInputRef.current?.click()
                  }
                  className="mt-3 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Retry Scan
                </button>
              </div>
            )}

            {analysis && !isAnalyzing && (
              <div className="space-y-4">
                {analysis.note && (
                  <p className="text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{analysis.note}</span>
                  </p>
                )}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Meal Name
                  </label>
                  <input
                    value={analysis.mealName}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, mealName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-bold text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {analysis.foods.map((f, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={f.name}
                        placeholder="Food name"
                        onChange={(e) => {
                          const next = [...analysis.foods];
                          next[idx] = { ...f, name: e.target.value };
                          setAnalysis({ ...analysis, foods: next });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white"
                      />
                      <input
                        value={f.servingSize}
                        placeholder="Portion size"
                        onChange={(e) => {
                          const next = [...analysis.foods];
                          next[idx] = { ...f, servingSize: e.target.value };
                          setAnalysis({ ...analysis, foods: next });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(["calories", "protein", "carbs", "fat"] as const).map(
                        (k) => (
                          <div key={k}>
                            <span className="block text-[10px] font-mono uppercase text-slate-500">
                              {k}
                            </span>
                            <input
                              type="number"
                              value={f[k]}
                              onChange={(e) => {
                                const next = [...analysis.foods];
                                next[idx] = {
                                  ...f,
                                  [k]: Math.max(0, Number(e.target.value)),
                                };
                                setAnalysis({ ...analysis, foods: next });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white"
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAnalysis({
                      ...analysis,
                      foods: [...analysis.foods, { ...EMPTY_FOOD }],
                    })
                  }
                  className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  + Add Another Food Item
                </button>
                <button
                  type="button"
                  onClick={saveAnalyzedMealToPlan}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  Save &amp; Log Scanned Meal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
