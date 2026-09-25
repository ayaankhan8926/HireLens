import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Rocket,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import api from "../api";

function CareerProgress() {
  const navigate = useNavigate();

  const [careerData, setCareerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (fetchedRef.current) {
      return;
    }

    fetchedRef.current = true;

    const fetchCareerProgress = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/career-progress", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success) {
          setCareerData(response.data);
        } else {
          setError(
            response.data?.message ||
              "Unable to load career progress."
          );
        }
      } catch (err) {
        console.error("Career progress error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("hirelens_token");
          localStorage.removeItem("hirelens_user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load career progress."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCareerProgress();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("hirelens_token");
    localStorage.removeItem("hirelens_user");
    navigate("/login");
  };

  const getUserName = () => {
    const storedUser = localStorage.getItem("hirelens_user");

    if (!storedUser) {
      return "Candidate";
    }

    try {
      const user = JSON.parse(storedUser);

      return (
        user.full_name ||
        user.name ||
        user.email?.split("@")[0] ||
        "Candidate"
      );
    } catch {
      return "Candidate";
    }
  };

  const userName = getUserName();

  const careerReadiness = Math.round(
    Number(careerData?.career_readiness ?? 0)
  );

  const strongMatches = Number(
    careerData?.strong_job_matches ?? 0
  );

  const jobsAnalyzed = Number(
    careerData?.jobs_analyzed ?? 0
  );

  const profileProgress = Math.round(
    Number(careerData?.profile_progress ?? 0)
  );

  const resumeProgress = Math.round(
    Number(careerData?.resume_progress ?? 0)
  );

  const roadmapProgress = Math.round(
    Number(careerData?.roadmap_progress ?? 0)
  );

  const roadmapExists = Boolean(
    careerData?.roadmap?.exists
  );

  const roadmapTotalSteps = Number(
    careerData?.roadmap?.total_steps ?? 0
  );

  const roadmapCompletedSteps = Number(
    careerData?.roadmap?.completed_steps ?? 0
  );

  /*
   * =========================================================
   * APPLICATION ANALYTICS
   * =========================================================
   */

  const applicationAnalytics =
    careerData?.application_analytics || {};

  const totalApplications = Number(
    applicationAnalytics.total ?? 0
  );

  const appliedApplications = Number(
    applicationAnalytics.applied ?? 0
  );

  const screeningApplications = Number(
    applicationAnalytics.screening ?? 0
  );

  const interviewApplications = Number(
    applicationAnalytics.interviews ?? 0
  );

  const offerApplications = Number(
    applicationAnalytics.offers ?? 0
  );

  const rejectedApplications = Number(
    applicationAnalytics.rejected ?? 0
  );

  /*
   * =========================================================
   * INTERVIEW ANALYTICS
   * =========================================================
   */

  const interviewAnalytics =
    careerData?.interview_analytics || {};

  const totalInterviewSessions = Number(
    interviewAnalytics.total_sessions ?? 0
  );

  const completedInterviewSessions = Number(
    interviewAnalytics.completed_sessions ?? 0
  );

  const inProgressInterviewSessions = Number(
    interviewAnalytics.in_progress_sessions ?? 0
  );

  const averageInterviewScore = Math.round(
    Number(interviewAnalytics.average_score ?? 0)
  );

  const bestInterviewScore = Math.round(
    Number(interviewAnalytics.best_score ?? 0)
  );

  const currentRoadmapId =
    careerData?.roadmap?.roadmap_id ?? null;

  const getReadinessMessage = () => {
    if (careerReadiness >= 80) {
      return "You're looking well prepared for your target roles.";
    }

    if (careerReadiness >= 60) {
      return "You're making strong progress. A few focused improvements can move you further.";
    }

    if (careerReadiness >= 40) {
      return "Your foundation is building. Focus on your skill gaps and roadmap next.";
    }

    return "Start by strengthening your profile, resume, and core job skills.";
  };

  const progressItems = [
    {
      title: "Profile",
      description: "Complete your career profile",
      progress: profileProgress,
      icon: User,
      link: "/settings",
    },
    {
      title: "Resume",
      description: "Upload and analyze your resume",
      progress: resumeProgress,
      icon: FileText,
      link: "/resume",
    },
    {
      title: "Job Matching",
      description: "Explore jobs that match your skills",
      progress:
        jobsAnalyzed > 0
          ? Math.min(
              100,
              Math.round((jobsAnalyzed / 12) * 100)
            )
          : 0,
      icon: BriefcaseBusiness,
      link: "/jobs",
    },
    {
      title: "Learning Roadmap",
      description: roadmapExists
        ? `${roadmapCompletedSteps} of ${roadmapTotalSteps} steps completed`
        : "Build your personalized roadmap",
      progress: roadmapProgress,
      icon: BookOpen,
      link: currentRoadmapId
        ? `/roadmap/${currentRoadmapId}`
        : "/roadmaps",
    },
  ];

  const journeySteps = [
    {
      number: 1,
      title: "Build your profile",
      description:
        "Add your education, target role, experience and career details.",
      completed: profileProgress >= 100,
      link: "/settings",
    },
    {
      number: 2,
      title: "Analyze your resume",
      description:
        "Let HireLens identify your skills, projects and experience.",
      completed: resumeProgress >= 100,
      link: "/resume",
    },
    {
      number: 3,
      title: "Explore job matches",
      description:
        "Compare your profile against available job requirements.",
      completed: jobsAnalyzed > 0,
      link: "/jobs",
    },
    {
      number: 4,
      title: "Close your skill gaps",
      description:
        "Identify missing skills and follow your personalized learning path.",
      completed: roadmapProgress >= 100,
      link: "/roadmaps",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/10 bg-slate-950 flex-col">
          <div className="h-20 px-6 flex items-center border-b border-white/10">
            <Link
              to="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
                <Sparkles size={19} />
              </div>

              <div>
                <div className="font-display font-bold text-lg">
                  HireLens
                </div>

                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Career Intelligence
                </div>
              </div>
            </Link>
          </div>
        </aside>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-indigo-400 animate-spin mx-auto mb-5" />

            <p className="text-slate-300 font-medium">
              Loading career progress...
            </p>

            <p className="text-slate-500 text-sm mt-2">
              HireLens is analyzing your career data.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white/[0.04] border border-white/10 rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <XCircle
                className="text-red-400"
                size={28}
              />
            </div>

            <h1 className="text-xl font-bold mb-2">
              Couldn't load career progress
            </h1>

            <p className="text-slate-400 text-sm leading-6 mb-6">
              {error}
            </p>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/10 bg-slate-950 flex-col">

        <div className="h-20 px-6 flex items-center border-b border-white/10">
          <Link
            to="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={19} />
            </div>

            <div>
              <div className="font-display font-bold text-lg">
                HireLens
              </div>

              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Career Intelligence
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">

          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            to="/resume"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <FileText size={18} />
            Resume Analysis
          </Link>

          <Link
            to="/jobs"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <BriefcaseBusiness size={18} />
            Job Matches
          </Link>

          <Link
            to="/jobs"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <Target size={18} />
            Skill Gaps
          </Link>

          <Link
            to="/roadmaps"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <BookOpen size={18} />
            Learning Roadmaps
          </Link>

          <Link
            to="/applications"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <BriefcaseBusiness size={18} />
            Applications
          </Link>

          <Link
            to="/career-progress"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
          >
            <TrendingUp size={18} />
            Career Progress
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <Settings size={18} />
            Settings
          </Link>

        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/5 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="flex-1 min-w-0 overflow-x-hidden">

        {/* TOP BAR */}

        <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 lg:px-10">

          <div>

            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">

              <Link
                to="/dashboard"
                className="hover:text-slate-300"
              >
                Dashboard
              </Link>

              <ChevronRight size={14} />

              <span className="text-slate-300">
                Career Progress
              </span>

            </div>

            <h1 className="font-display text-xl font-bold">
              Career Progress
            </h1>

          </div>

          <div className="flex items-center gap-3">

            <Link
              to="/settings"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition text-sm"
            >
              <Settings size={16} />
              Settings
            </Link>

            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>

          </div>

        </header>

        <div className="px-6 lg:px-10 py-8 max-w-7xl mx-auto">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-slate-900 to-slate-900 p-7 lg:p-9 mb-7">

            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

              <div className="max-w-2xl">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                  <Sparkles size={14} />
                  Career Intelligence
                </div>

                <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                  Keep building,{" "}
                  <span className="text-indigo-400">
                    {userName.split(" ")[0]}
                  </span>
                </h2>

                <p className="text-slate-400 leading-7 max-w-xl">
                  {getReadinessMessage()}
                </p>

              </div>

              <div className="shrink-0">

                <div className="w-36 h-36 rounded-full border-[10px] border-white/5 relative flex items-center justify-center">

                  <div
                    className="absolute inset-[-10px] rounded-full"
                    style={{
                      background: `conic-gradient(#818cf8 ${careerReadiness}%, rgba(255,255,255,0.06) ${careerReadiness}% 100%)`,
                      WebkitMask:
                        "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)",
                      mask:
                        "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)",
                    }}
                  />

                  <div className="text-center relative z-10">

                    <div className="text-3xl font-display font-bold">
                      {careerReadiness}%
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1">
                      Readiness
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              TOP STATS
          ================================================= */}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">

                  <TrendingUp
                    size={20}
                    className="text-indigo-300"
                  />

                </div>

                <span className="text-xs text-slate-500">
                  Overall
                </span>

              </div>

              <div className="text-3xl font-display font-bold">
                {careerReadiness}%
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Career readiness
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">

                  <Award
                    size={20}
                    className="text-emerald-300"
                  />

                </div>

                <span className="text-xs text-slate-500">
                  80%+ match
                </span>

              </div>

              <div className="text-3xl font-display font-bold">
                {strongMatches}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Strong job matches
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">

                  <BarChart3
                    size={20}
                    className="text-blue-300"
                  />

                </div>

                <span className="text-xs text-slate-500">
                  Analyzed
                </span>

              </div>

              <div className="text-3xl font-display font-bold">
                {jobsAnalyzed}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Jobs analyzed
              </div>

            </div>

          </section>

          {/* =================================================
              CAREER PROGRESS
          ================================================= */}

          <section className="mb-8">

            <div className="flex items-end justify-between mb-4">

              <div>

                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Your journey
                </p>

                <h2 className="font-display text-2xl font-bold">
                  Career progress
                </h2>

              </div>

              <div className="text-sm text-slate-500">
                Keep moving forward
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

              {progressItems.map((item) => {

                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    to={item.link}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] p-5 transition"
                  >

                    <div className="flex items-start justify-between mb-5">

                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon size={19} />
                      </div>

                      <span className="text-sm font-semibold text-slate-300">
                        {item.progress}%
                      </span>

                    </div>

                    <h3 className="font-semibold mb-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-5 min-h-[40px]">
                      {item.description}
                    </p>

                    <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">

                      <div
                        className="h-full rounded-full bg-indigo-400 transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, item.progress)
                          )}%`,
                        }}
                      />

                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs">

                      <span className="text-slate-500">
                        {item.progress >= 100
                          ? "Completed"
                          : "In progress"}
                      </span>

                      <ChevronRight
                        size={15}
                        className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition"
                      />

                    </div>

                  </Link>
                );
              })}

            </div>

          </section>

          {/* =================================================
              CAREER ACTIVITY
          ================================================= */}

          <section className="mb-8">

            <div className="flex items-end justify-between mb-4">

              <div>

                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Career activity
                </p>

                <h2 className="font-display text-2xl font-bold">
                  Your career signals
                </h2>

              </div>

              <span className="text-sm text-slate-500 hidden sm:block">
                Applications + interview readiness
              </span>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* APPLICATION PIPELINE */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">

                <div className="p-6 border-b border-white/10">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-4">

                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">

                        <BriefcaseBusiness
                          size={22}
                          className="text-indigo-300"
                        />

                      </div>

                      <div>

                        <h3 className="font-display text-xl font-bold">
                          Application Pipeline
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          Track your progress across job opportunities.
                        </p>

                      </div>

                    </div>

                    <Link
                      to="/applications"
                      className="hidden sm:inline-flex items-center gap-1 text-sm text-indigo-300 hover:text-indigo-200 transition"
                    >
                      View all
                      <ArrowRight size={15} />
                    </Link>

                  </div>

                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3">

                  <div className="p-5 border-b sm:border-r border-white/10">

                    <div className="text-xs text-slate-500 mb-2">
                      Total
                    </div>

                    <div className="text-2xl font-display font-bold">
                      {totalApplications}
                    </div>

                  </div>

                  <div className="p-5 border-b sm:border-r border-white/10">

                    <div className="text-xs text-slate-500 mb-2">
                      Applied
                    </div>

                    <div className="text-2xl font-display font-bold text-indigo-300">
                      {appliedApplications}
                    </div>

                  </div>

                  <div className="p-5 border-b border-white/10">

                    <div className="text-xs text-slate-500 mb-2">
                      Screening
                    </div>

                    <div className="text-2xl font-display font-bold text-amber-300">
                      {screeningApplications}
                    </div>

                  </div>

                  <div className="p-5 sm:border-r border-white/10">

                    <div className="text-xs text-slate-500 mb-2">
                      Interviews
                    </div>

                    <div className="text-2xl font-display font-bold text-violet-300">
                      {interviewApplications}
                    </div>

                  </div>

                  <div className="p-5 sm:border-r border-white/10">

                    <div className="text-xs text-slate-500 mb-2">
                      Offers
                    </div>

                    <div className="text-2xl font-display font-bold text-emerald-300">
                      {offerApplications}
                    </div>

                  </div>

                  <div className="p-5">

                    <div className="text-xs text-slate-500 mb-2">
                      Rejected
                    </div>

                    <div className="text-2xl font-display font-bold text-red-300">
                      {rejectedApplications}
                    </div>

                  </div>

                </div>

                <div className="p-5 border-t border-white/10">

                  <Link
                    to="/applications"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition text-sm font-semibold text-slate-300"
                  >
                    Manage Applications
                    <ArrowRight size={16} />
                  </Link>

                </div>

              </div>

              {/* INTERVIEW READINESS */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">

                <div className="p-6 border-b border-white/10">

                  <div className="flex items-start gap-4">

                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">

                      <Target
                        size={22}
                        className="text-violet-300"
                      />

                    </div>

                    <div>

                      <h3 className="font-display text-xl font-bold">
                        Interview Readiness
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        Your performance across AI interview sessions.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="p-6">

                  <div className="grid grid-cols-2 gap-4 mb-6">

                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">

                      <div className="text-xs text-slate-500 mb-2">
                        Sessions
                      </div>

                      <div className="text-2xl font-display font-bold">
                        {totalInterviewSessions}
                      </div>

                    </div>

                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">

                      <div className="text-xs text-slate-500 mb-2">
                        Completed
                      </div>

                      <div className="text-2xl font-display font-bold text-emerald-300">
                        {completedInterviewSessions}
                      </div>

                    </div>

                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">

                      <div className="text-xs text-slate-500 mb-2">
                        Average Score
                      </div>

                      <div className="text-2xl font-display font-bold text-indigo-300">
                        {averageInterviewScore}%
                      </div>

                    </div>

                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">

                      <div className="text-xs text-slate-500 mb-2">
                        Best Score
                      </div>

                      <div className="text-2xl font-display font-bold text-amber-300">
                        {bestInterviewScore}%
                      </div>

                    </div>

                  </div>

                  <div className="mb-6">

                    <div className="flex items-center justify-between mb-2">

                      <span className="text-sm text-slate-400">
                        Interview performance
                      </span>

                      <span className="text-sm font-semibold text-slate-300">
                        {averageInterviewScore}%
                      </span>

                    </div>

                    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">

                      <div
                        className="h-full rounded-full bg-violet-400 transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              averageInterviewScore
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-slate-500">
                      {inProgressInterviewSessions} interview
                      {inProgressInterviewSessions === 1
                        ? ""
                        : "s"} in progress
                    </span>

                    <Link
                      to="/jobs"
                      className="inline-flex items-center gap-1.5 text-violet-300 hover:text-violet-200 transition font-medium"
                    >
                      Practice Interview
                      <ArrowRight size={15} />
                    </Link>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              ROADMAP QUICK ACCESS
          ================================================= */}

          <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.08] to-violet-500/[0.04] p-6 lg:p-7 mb-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">

                  <BookOpen
                    size={22}
                    className="text-indigo-300"
                  />

                </div>

                <div>

                  <p className="text-xs uppercase tracking-widest text-indigo-300/70 font-semibold mb-2">
                    Learning Center
                  </p>

                  <h2 className="font-display text-xl lg:text-2xl font-bold mb-2">
                    Your personalized learning roadmaps
                  </h2>

                  <p className="text-sm text-slate-400 leading-6 max-w-2xl">
                    Explore all the learning paths generated for
                    your matched job roles and continue building
                    the skills you need.
                  </p>

                </div>

              </div>

              <Link
                to="/roadmaps"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm shadow-lg shadow-indigo-500/10"
              >
                View All Roadmaps
                <ArrowRight size={17} />
              </Link>

            </div>

          </section>

          {/* =================================================
              JOURNEY + NEXT ACTION
          ================================================= */}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* JOURNEY */}

            <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-7">

              <div className="flex items-center justify-between mb-7">

                <div>

                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                    Road to readiness
                  </p>

                  <h2 className="font-display text-xl font-bold">
                    Your HireLens journey
                  </h2>

                </div>

                <Rocket
                  size={22}
                  className="text-indigo-300"
                />

              </div>

              <div className="space-y-6">

                {journeySteps.map((step, index) => (

                  <div
                    key={step.number}
                    className="relative flex gap-4"
                  >

                    {index !== journeySteps.length - 1 && (
                      <div className="absolute left-[19px] top-10 bottom-[-25px] w-px bg-white/10" />
                    )}

                    <div
                      className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center border ${
                        step.completed
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-500"
                      }`}
                    >

                      {step.completed ? (
                        <CheckCircle2 size={19} />
                      ) : (
                        <Circle size={18} />
                      )}

                    </div>

                    <div className="flex-1 pb-1">

                      <Link
                        to={step.link}
                        className="font-semibold hover:text-indigo-300 transition"
                      >
                        {step.title}
                      </Link>

                      <p className="text-sm text-slate-500 mt-1 leading-6">
                        {step.description}
                      </p>

                    </div>

                    <Link
                      to={step.link}
                      className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition"
                    >
                      <ArrowRight size={16} />
                    </Link>

                  </div>

                ))}

              </div>

            </div>

            {/* NEXT ACTION */}

            <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.06] p-6 lg:p-7 flex flex-col">

              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">

                <Target
                  size={22}
                  className="text-indigo-300"
                />

              </div>

              <p className="text-xs uppercase tracking-widest text-indigo-300/70 font-semibold mb-2">
                Recommended next step
              </p>

              <h2 className="font-display text-xl font-bold mb-3">

                {roadmapExists
                  ? roadmapProgress >= 100
                    ? "Your roadmap is complete"
                    : "Continue your learning roadmap"
                  : resumeProgress < 100
                    ? "Analyze your resume"
                    : "Explore your job matches"}

              </h2>

              <p className="text-sm text-slate-400 leading-6 mb-7">

                {roadmapExists
                  ? roadmapProgress >= 100
                    ? "You've completed your current learning path. Explore more job matches and continue improving your profile."
                    : "Continue completing the skills and learning steps identified for your target role."
                  : resumeProgress < 100
                    ? "Upload and analyze your resume to unlock deeper skill insights and personalized job matching."
                    : "Review your matched jobs to identify your next skill-building opportunities."}

              </p>

              <div className="mt-auto">

                <Link
                  to="/roadmaps"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm"
                >
                  View All Roadmaps
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/dashboard"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition font-semibold text-sm text-slate-300 mt-3"
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </Link>

              </div>

            </div>

          </section>

          {/* FOOTER */}

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">

            <p>
              HireLens • Career Intelligence Platform
            </p>

            <div className="flex items-center gap-2">
              <GraduationCap size={14} />
              Build skills. Match opportunities. Grow.
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default CareerProgress;