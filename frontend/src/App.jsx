import {
  ArrowRight,
  BriefcaseBusiness,
  FileSearch,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
            <Target size={22} />
          </div>

          <span className="font-display text-2xl font-bold tracking-tight">
            Hire<span className="text-indigo-400">Lens</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#about" className="transition hover:text-white">
            About
          </a>
        </div>

        <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10">
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="pointer-events-none absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center lg:px-8 lg:pb-32 lg:pt-28">
            <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-300">
              <Sparkles size={16} />
              AI-powered career intelligence
            </div>

            <h1 className="font-display mx-auto max-w-5xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Find the right job.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Build the right skills.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-400">
              HireLens analyzes your resume, understands your skills, matches
              you with relevant opportunities, and shows you exactly what to
              improve.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="group flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold shadow-xl shadow-indigo-500/20 transition hover:bg-indigo-400">
                Analyze my resume
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-slate-200 transition hover:bg-white/10">
                Explore HireLens
              </button>
            </div>
          </div>
        </section>

        {/* Feature preview */}
        <section id="features" className="border-y border-white/5 bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                One intelligent platform
              </p>

              <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
                Your career, understood.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                From your first resume upload to interview preparation,
                HireLens brings the important pieces of your job search
                together.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<FileSearch size={22} />}
                title="Resume Intelligence"
                description="Extract skills, projects, education and experience from your resume."
              />

              <FeatureCard
                icon={<BriefcaseBusiness size={22} />}
                title="Job Matching"
                description="Compare your profile with job requirements and discover relevant opportunities."
              />

              <FeatureCard
                icon={<Target size={22} />}
                title="Skill Gap Analysis"
                description="See exactly which skills you need to improve for your target role."
              />

              <FeatureCard
                icon={<TrendingUp size={22} />}
                title="Career Roadmap"
                description="Turn your skill gaps into a structured path for career growth."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                How it works
              </p>

              <h2 className="font-display mt-3 text-4xl font-bold leading-tight">
                Stop guessing what employers want.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-400">
                HireLens connects your profile with real job requirements and
                turns the differences into actionable insights.
              </p>

              <div className="mt-8 space-y-5">
                <Step number="01" title="Upload your resume" />
                <Step number="02" title="Analyze your skills" />
                <Step number="03" title="Match with opportunities" />
                <Step number="04" title="Build your skill roadmap" />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Profile strength</p>
                    <p className="mt-1 text-3xl font-bold">78%</p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-indigo-500/30 text-sm font-bold text-indigo-400">
                    78
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  <Progress label="Java" value="90%" />
                  <Progress label="SQL" value="76%" />
                  <Progress label="React" value="58%" />
                  <Progress label="Docker" value="35%" />
                </div>

                <div className="mt-7 rounded-xl border border-indigo-400/10 bg-indigo-400/5 p-4">
                  <p className="text-sm font-semibold text-indigo-300">
                    Recommended next step
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Improve your Docker and React skills for your target role.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="about" className="px-6 pb-24">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/15 to-violet-500/5 px-6 py-16 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Your next opportunity starts with understanding where you are.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Build your profile. Understand your gaps. Prepare smarter.
            </p>

            <button className="mt-8 rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-200">
              Get started with HireLens
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <p>
            © 2026 Hire<span className="text-slate-300">Lens</span>
          </p>

          <p>AI-powered career intelligence platform</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-white/[0.05]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition group-hover:bg-indigo-500 group-hover:text-white">
        {icon}
      </div>

      <h3 className="mt-5 font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}

function Step({ number, title }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-bold text-indigo-400">{number}</span>
      <div className="h-px flex-1 bg-white/10" />
      <span className="font-medium text-slate-200">{title}</span>
    </div>
  )
}

function Progress({ label, value }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">{value}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          style={{ width: value }}
        />
      </div>
    </div>
  )
}

export default App