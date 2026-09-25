import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import api from "../api";

function Roadmaps() {
  const navigate = useNavigate();

  const [roadmaps, setRoadmaps] = useState([]);
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

    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/career-progress", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success) {
          const roadmapData = Array.isArray(
            response.data?.roadmaps
          )
            ? response.data.roadmaps
            : [];

          setRoadmaps(roadmapData);
        } else {
          setError(
            response.data?.message ||
              "Unable to load your roadmaps."
          );
        }
      } catch (err) {
        console.error("Roadmaps error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("hirelens_token");
          localStorage.removeItem("hirelens_user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load your learning roadmaps."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("hirelens_token");
    localStorage.removeItem("hirelens_user");
    navigate("/login");
  };

  const getUserName = () => {
    const storedUser =
      localStorage.getItem("hirelens_user");

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

  const getRoadmapStatus = (roadmap) => {
    const status = String(
      roadmap?.status || ""
    ).toLowerCase();

    const progress = Number(
      roadmap?.progress ?? 0
    );

    if (
      progress >= 100 ||
      status === "completed"
    ) {
      return {
        label: "Completed",
        className:
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
      };
    }

    if (
      progress > 0 ||
      status === "in progress" ||
      status === "in_progress"
    ) {
      return {
        label: "In Progress",
        className:
          "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      };
    }

    return {
      label: "Not Started",
      className:
        "bg-white/5 border-white/10 text-slate-400",
    };
  };

  const getRoadmapProgress = (roadmap) => {
    const progress = Number(
      roadmap?.progress ?? 0
    );

    return Math.min(
      100,
      Math.max(0, Math.round(progress))
    );
  };

  const userName = getUserName();

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
              Loading your roadmaps...
            </p>

            <p className="text-slate-500 text-sm mt-2">
              HireLens is loading your personalized learning paths.
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
              Couldn't load roadmaps
            </h1>

            <p className="text-slate-400 text-sm leading-6 mb-6">
              {error}
            </p>

            <Link
              to="/career-progress"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold"
            >
              <ArrowLeft size={17} />
              Back to Career Progress
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* SIDEBAR */}
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
          >
            <BookOpen size={18} />
            Learning Roadmaps
          </Link>

          <Link
            to="/career-progress"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
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

      {/* MAIN */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* HEADER */}
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
                Learning Roadmaps
              </span>
            </div>

            <h1 className="font-display text-xl font-bold">
              Learning Roadmaps
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/career-progress"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition text-sm"
            >
              <TrendingUp size={16} />
              Career Progress
            </Link>

            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="px-6 lg:px-10 py-10 max-w-7xl mx-auto">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-slate-900 to-slate-900 p-7 lg:p-9 mb-8">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                <Sparkles size={14} />
                Personalized Learning
              </div>

              <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                Your Learning Roadmaps
              </h2>

              <p className="text-slate-400 leading-7 max-w-2xl">
                Personalized learning paths generated from
                your skill gaps and target job roles. Pick
                a roadmap and continue building the skills
                you need.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Map
                    size={17}
                    className="text-indigo-300"
                  />

                  {roadmaps.length}{" "}
                  {roadmaps.length === 1
                    ? "roadmap"
                    : "roadmaps"}
                </div>

                <div className="w-1 h-1 rounded-full bg-slate-700" />

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <BookOpen
                    size={17}
                    className="text-indigo-300"
                  />

                  Personalized for you
                </div>
              </div>
            </div>
          </section>

          {/* ROADMAP GRID */}
          {roadmaps.length > 0 ? (
            <section>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                    All roadmaps
                  </p>

                  <h2 className="font-display text-2xl font-bold">
                    Choose your learning path
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {roadmaps.map((roadmap) => {
                  const progress =
                    getRoadmapProgress(roadmap);

                  const status =
                    getRoadmapStatus(roadmap);

                  const totalSteps = Number(
                    roadmap?.total_steps ?? 0
                  );

                  const completedSteps = Number(
                    roadmap?.completed_steps ?? 0
                  );

                  const roadmapId =
                    roadmap?.roadmap_id;

                  return (
                    <div
                      key={roadmapId}
                      className="group rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition overflow-hidden"
                    >
                      <div className="p-6 lg:p-7">
                        {/* TITLE */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                              <BookOpen
                                size={21}
                                className="text-indigo-300"
                              />
                            </div>

                            <div>
                              <h3 className="font-display text-xl font-bold">
                                {roadmap?.target_role ||
                                  roadmap?.title ||
                                  "Learning Roadmap"}
                              </h3>

                              {roadmap?.company_name && (
                                <p className="text-sm text-slate-500 mt-1">
                                  {roadmap.company_name}
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {/* DESCRIPTION */}
                        <p className="text-sm text-slate-400 leading-6 mt-5">
                          {roadmap?.description ||
                            `Personalized learning roadmap for ${
                              roadmap?.target_role ||
                              "your target role"
                            }.`}
                        </p>

                        {/* PROGRESS */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">
                              Learning progress
                            </span>

                            <span className="text-sm font-semibold text-white">
                              {progress}%
                            </span>
                          </div>

                          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                            <span>
                              {completedSteps} of{" "}
                              {totalSteps} steps completed
                            </span>

                            <span>
                              {Math.max(
                                0,
                                totalSteps -
                                  completedSteps
                              )}{" "}
                              remaining
                            </span>
                          </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-white/10">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Target size={14} />

                            {roadmap?.target_role ||
                              "Target role"}
                          </div>

                          {roadmapId ? (
                            <Link
                              to={`/roadmap/${roadmapId}`}
                              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition text-sm font-semibold shadow-lg shadow-indigo-500/10"
                            >
                              Open Roadmap
                              <ArrowRight size={15} />
                            </Link>
                          ) : (
                            <span className="text-xs text-red-400">
                              Roadmap unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                <BookOpen
                  size={28}
                  className="text-indigo-300"
                />
              </div>

              <h2 className="font-display text-2xl font-bold mb-2">
                No learning roadmaps yet
              </h2>

              <p className="text-slate-500 max-w-md mx-auto leading-6 mb-7">
                Explore your job matches and generate a
                personalized roadmap based on the skills
                you need to develop.
              </p>

              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold"
              >
                Explore Job Matches
                <ArrowRight size={17} />
              </Link>
            </section>
          )}

          {/* BOTTOM */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <p>
              HireLens • Career Intelligence Platform
            </p>

            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} />
              Build skills. Match opportunities. Grow.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Roadmaps;