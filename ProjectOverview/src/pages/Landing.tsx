import {
  Zap,
  Utensils,
  Dumbbell,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Heart,
} from "lucide-react";

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const features = [
  {
    icon: Utensils,
    title: "Precision Nutrition",
    desc: "Personalized calorie, protein, carbohydrate, and fat targets calculated via Mifflin-St Jeor.",
    badge: "Macros",
  },
  {
    icon: Dumbbell,
    title: "Intelligent Workouts",
    desc: "Science-backed resistance & conditioning splits adapted for gym or home training.",
    badge: "Splits",
  },
  {
    icon: TrendingUp,
    title: "Real Progress Tracking",
    desc: "Monitor weight, body measurements, and volume logs with zero synthetic data.",
    badge: "Analytics",
  },
  {
    icon: Sparkles,
    title: "Instant Food Swaps",
    desc: "Flexible macro-matched food alternatives tailored to vegetarian, eggetarian, or non-veg diets.",
    badge: "Flexible",
  },
];

const steps = [
  {
    n: "01",
    title: "Secure Account",
    desc: "Register with industry-standard bcrypt encryption and private session security.",
  },
  {
    n: "02",
    title: "Biometric Assessment",
    desc: "Enter age, gender, height, weight, activity level, and target fitness objective.",
  },
  {
    n: "03",
    title: "Instant Algorithm Plan",
    desc: "Receive customized daily meal splits and structured exercise programs generated in seconds.",
  },
  {
    n: "04",
    title: "Log & Dominate",
    desc: "Record daily intake, log workout sessions, track water hydration, and watch your metrics evolve.",
  },
];

const benefits = [
  "Validated Mifflin-St Jeor BMR & TDEE formulas",
  "Tailored vegetarian, eggetarian, and non-vegetarian diet options",
  "Dynamic Home and Gym workout split variations",
  "Food replacement suggestions with exact macro matching",
  "7 specialized fitness targets (Fat Loss, Bulking, Recomp, etc.)",
  "Persistent MySQL database with zero mock data",
];

const workoutBenefits = [
  {
    number: "01",
    title: "Cardiovascular Resilience",
    desc: "Regular movement improves heart health, resting heart rate, and metabolic efficiency.",
  },
  {
    number: "02",
    title: "Musculoskeletal Strength",
    desc: "Progressive resistance training builds lean mass, protects joint integrity, and boosts bone density.",
  },
  {
    number: "03",
    title: "Cognitive & Mood Clarity",
    desc: "Consistent exercise stimulates dopamine & endorphins, relieving stress and improving sleep hygiene.",
  },
  {
    number: "04",
    title: "Longevity & Metabolic Health",
    desc: "Regulates insulin sensitivity, lipid profiles, and preserves functional independence as you age.",
  },
];

export default function Landing({ onGetStarted, onLogin }: Props) {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-slate-800/80 bg-[#0b0f19]/85 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <span className="text-emerald-400 font-black text-2xl tracking-tight font-display">
            FIT
          </span>
          <span className="font-black text-2xl tracking-tight font-display text-white">
            PLAN
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onLogin}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Log in
          </button>
          <button
            onClick={onGetStarted}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1778828494354-9b717d36dc99?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=2000"
            alt="Gym background"
            className="w-full h-full object-cover opacity-20 filter grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#0b0f19]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Fitness Intelligence</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-white">
              YOUR BODY.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                YOUR PLAN.
              </span>
              <br />
              REAL RESULTS.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              FitPlan calculates your exact calorie and macro requirements, then
              constructs custom diet and training splits tailored to your biometrics,
              dietary preferences, and lifestyle.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onGetStarted}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 font-black text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>START YOUR ASSESSMENT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white px-8 py-4 font-bold text-sm rounded-xl bg-slate-800/40 hover:bg-slate-800/80 transition-all"
              >
                Sign In
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>MySQL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Mifflin-St Jeor Engine</span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-2xl backdrop-blur-xl">
              <div className="overflow-hidden rounded-2xl relative aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1649789248266-ef1c7f744f6f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900"
                  alt="Athletes training in a gym"
                  className="h-full w-full object-cover filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="inline-block px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold uppercase mb-2">
                    Evidence-Based System
                  </div>
                  <h3 className="font-display text-2xl font-black text-white">
                    Built for Consistency & Longevity
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    No starvation diets. No randomized routines. Real progress.
                  </p>
                </div>
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-4 -right-4 bg-slate-800/95 border border-slate-700/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Heart className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Metabolic Target</p>
                  <p className="text-sm font-bold text-white">100% Macro Precision</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase mb-3">
            COMPLETE ARCHITECTURE
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-black text-white">
            Engineered for Serious Transformation
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-slate-900/60 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-6 transition-all hover:translate-y-[-2px] group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 border border-slate-700 group-hover:border-emerald-500/40 flex items-center justify-center text-emerald-400 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2 text-white group-hover:text-emerald-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Health / Science Section */}
      <section className="px-6 py-12 md:px-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 px-6 py-16 text-slate-100 md:px-12 md:py-20">
          <div className="relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 items-center">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-emerald-400">
                SCIENTIFIC RATIONALE
              </p>
              <h2 className="mb-6 font-display text-3xl md:text-5xl font-black leading-tight text-white">
                Exercise changes more than just your physique.
              </h2>
              <p className="text-sm leading-7 text-slate-400 max-w-md">
                Decades of peer-reviewed clinical research confirm that regular progressive exercise
                dramatically lowers the risk of chronic conditions, boosts insulin sensitivity, and improves
                cognitive performance.
              </p>

              <div className="mt-8 flex items-end gap-4 border-t border-slate-800 pt-6">
                <span className="font-display text-5xl font-black text-emerald-400">
                  150
                </span>
                <div className="pb-1">
                  <p className="font-bold text-white text-sm">minutes per week</p>
                  <p className="text-xs text-slate-400">
                    WHO clinical baseline for optimal cardiovascular longevity
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {workoutBenefits.map((benefit) => (
                <article
                  key={benefit.number}
                  className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 transition-colors hover:border-emerald-500/30"
                >
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {benefit.number}
                  </span>
                  <h3 className="mb-2 mt-4 font-display text-lg font-bold text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-xs leading-6 text-slate-400">
                    {benefit.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase mb-3">
            SEAMLESS PROTOCOL
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-black text-white">
            How FitPlan Works
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.n}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative hover:border-slate-700 transition-colors"
            >
              <div className="font-mono text-emerald-500/30 text-3xl font-black mb-3">
                {step.n}
              </div>
              <h3 className="font-display font-bold text-lg mb-2 text-white">
                {step.title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Checklist */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase mb-3">
              ZERO GUESSWORK
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-black mb-6 text-white">
              No shortcuts.
              <br />
              No randomness.
            </h2>
            <ul className="space-y-3.5">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm font-medium">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=600&fit=crop&auto=format"
              alt="Person training"
              className="w-full h-full object-cover opacity-70 filter contrast-125"
            />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 text-center px-6 border-y border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4 text-white">
            Ready to upgrade your training?
          </h2>
          <p className="text-slate-400 mb-8 text-base">
            Your personalized nutritional targets and exercise split take less than 2 minutes to generate.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-4 font-black text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          >
            <span>CREATE YOUR PLAN NOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#090d16] border-t border-slate-800/80 px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            </div>
            <span className="text-emerald-400 font-black text-lg font-display">FIT</span>
            <span className="font-black text-lg font-display text-white">PLAN</span>
          </div>
          <p className="text-slate-500 text-xs text-center md:text-right max-w-md leading-relaxed">
            Disclaimer: Recommendations are generated based on mathematical formulas (Mifflin-St Jeor) and are for educational & fitness planning purposes. Consult a physician before beginning any strenuous workout regimen.
          </p>
        </div>
      </footer>
    </div>
  );
}
