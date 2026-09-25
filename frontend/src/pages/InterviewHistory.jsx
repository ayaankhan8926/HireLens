import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  PlayCircle,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import api from "../api";

function InterviewHistory() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

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

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/interview/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success) {
          setSessions(response.data.sessions || []);
        } else {
          setError(
            response.data?.message ||
              "Unable to load interview history."
          );
        }
      } catch (err) {
        console.error("Interview history error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("hirelens_token");
          localStorage.removeItem("hirelens_user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load interview history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("hirelens_token");
    localStorage.removeItem("hirelens_user");
    navigate("/login");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScore = (session) => {
    const score = Number(session.overall_score);

    if (!Number.isFinite(score)) {
      return null;
    }

    return Math.round(score);
  };

  const getStatusStyle = (status) => {
    if (status === "Completed") {
      return {
        wrapper:
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
        icon: CheckCircle2,
      };
    }

    if (status === "In Progress") {
      return {
        wrapper:
          "bg-amber-500/10 border-amber-500/20 text-amber-300",
        icon: Clock3,
      };
    }

    return {
      wrapper:
        "bg-red-500/10 border-red-500/20 text-red-300",
      icon: XCircle,
    };
  };

  const filteredSessions = sessions.filter((session) => {
    if (filter === "All") {
      return true;
    }

    return session.status === filter;
  });

  const completedSessions = sessions.filter(
    (session) => session.status === "Completed"
  );

  const inProgressSessions = sessions.filter(
    (session) => session.status === "In Progress"
  );

  const scoredSessions = completedSessions.filter(
    (session) => getScore(session) !== null
  );

  const averageScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce(
            (sum, session) => sum + getScore(session),
            0
          ) / scoredSessions.length
        )
      : 0;

  const bestScore =
    scoredSessions.length > 0
      ? Math.max(
          ...scoredSessions.map((session) =>
            getScore(session)
          )
        )
      : 0;

  const totalQuestions = sessions.reduce(
    (sum, session) =>
      sum + Number(session.total_questions || 0),
    0
  );

  const answeredQuestions = sessions.reduce(
    (sum, session) =>
      sum + Number(session.completed_questions || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">

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

        </aside>

        <main className="flex-1 flex items-center justify-center">

          <div className="text-center">

            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-indigo-400 animate-spin mx-auto mb-5" />

            <p className="text-slate-300 font-medium">
              Loading interview history...
            </p>

            <p className="text-slate-500 text-sm mt-2">
              Fetching your previous interview sessions.
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
              Couldn't load interview history
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <TrendingUp size={18} />
            Career Progress
          </Link>

          <Link
            to="/interview-history"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
          >
            <Target size={18} />
            Interview History
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
          MAIN CONTENT
      ===================================================== */}

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
                Interview History
              </span>

            </div>

            <h1 className="font-display text-xl font-bold">
              Interview History
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
              <User size={17} />
            </div>

          </div>

        </header>

        <div className="px-6 lg:px-10 py-8 max-w-7xl mx-auto">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-slate-900 to-slate-900 p-7 lg:p-9 mb-7">

            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">

              <div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                  <Sparkles size={14} />
                  AI Interview Coach
                </div>

                <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                  Your interview journey
                </h2>

                <p className="text-slate-400 leading-7 max-w-2xl">
                  Review your previous AI interview sessions,
                  track your performance, and identify where you
                  can improve before your next opportunity.
                </p>

              </div>

              <Link
                to="/jobs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm shrink-0"
              >
                Practice Interview
                <ArrowRight size={17} />
              </Link>

            </div>

          </section>

          {/* =================================================
              STATS
          ================================================= */}

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
                  <Target
                    size={20}
                    className="text-indigo-300"
                  />
                </div>

                <span className="text-xs text-slate-500">
                  Total
                </span>

              </div>

              <div className="text-3xl font-display font-bold">
                {sessions.length}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Interview sessions
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2
                    size={20}
                    className="text-emerald-300"
                  />
                </div>

                <span className="text-xs text-slate-500">
                  Completed
                </span>

              </div>

              <div className="text-3xl font-display font-bold text-emerald-300">
                {completedSessions.length}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Finished sessions
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                  <BarChart3
                    size={20}
                    className="text-violet-300"
                  />
                </div>

                <span className="text-xs text-slate-500">
                  Average
                </span>

              </div>

              <div className="text-3xl font-display font-bold text-violet-300">
                {averageScore}%
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Overall performance
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                  <TrendingUp
                    size={20}
                    className="text-amber-300"
                  />
                </div>

                <span className="text-xs text-slate-500">
                  Best
                </span>

              </div>

              <div className="text-3xl font-display font-bold text-amber-300">
                {bestScore}%
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Highest interview score
              </div>

            </div>

          </section>

          {/* =================================================
              PERFORMANCE OVERVIEW
          ================================================= */}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">

            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

              <div className="flex items-start justify-between mb-6">

                <div>

                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                    Performance overview
                  </p>

                  <h3 className="font-display text-xl font-bold">
                    Interview preparation
                  </h3>

                </div>

                <BarChart3
                  size={22}
                  className="text-indigo-300"
                />

              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                  <div className="text-sm text-slate-500 mb-2">
                    Questions attempted
                  </div>

                  <div className="text-2xl font-display font-bold">
                    {answeredQuestions}
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    of {totalQuestions} generated
                  </div>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                  <div className="text-sm text-slate-500 mb-2">
                    In progress
                  </div>

                  <div className="text-2xl font-display font-bold text-amber-300">
                    {inProgressSessions.length}
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    active sessions
                  </div>

                </div>

              </div>

              <div>

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm text-slate-400">
                    Average interview score
                  </span>

                  <span className="text-sm font-semibold text-slate-200">
                    {averageScore}%
                  </span>

                </div>

                <div className="h-3 rounded-full bg-white/5 overflow-hidden">

                  <div
                    className="h-full rounded-full bg-violet-400 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, averageScore)
                      )}%`,
                    }}
                  />

                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.06] p-6 flex flex-col">

              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">

                <Sparkles
                  size={22}
                  className="text-indigo-300"
                />

              </div>

              <p className="text-xs uppercase tracking-widest text-indigo-300/70 font-semibold mb-2">
                Keep improving
              </p>

              <h3 className="font-display text-xl font-bold mb-3">
                Practice makes progress
              </h3>

              <p className="text-sm text-slate-400 leading-6 mb-6">
                Use HireLens AI interviews to practice technical,
                HR, and mixed interviews for your target roles.
              </p>

              <div className="mt-auto">

                <Link
                  to="/jobs"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm"
                >
                  Start New Interview
                  <PlayCircle size={17} />
                </Link>

              </div>

            </div>

          </section>

          {/* =================================================
              FILTERS
          ================================================= */}

          <section className="mb-5">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Your sessions
                </p>

                <h2 className="font-display text-2xl font-bold">
                  Interview history
                </h2>

              </div>

              <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/10">

                {[
                  "All",
                  "Completed",
                  "In Progress",
                  "Abandoned",
                ].map((option) => (

                  <button
                    key={option}
                    onClick={() => setFilter(option)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                      filter === option
                        ? "bg-indigo-500 text-white"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {option}
                  </button>

                ))}

              </div>

            </div>

          </section>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {filteredSessions.length === 0 && (

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">

              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">

                <Target
                  size={28}
                  className="text-indigo-300"
                />

              </div>

              <h3 className="font-display text-xl font-bold mb-2">
                No interview sessions found
              </h3>

              <p className="text-slate-500 text-sm max-w-md mx-auto leading-6 mb-6">
                {filter === "All"
                  ? "Start your first AI interview to begin tracking your interview preparation."
                  : `There are no ${filter.toLowerCase()} interview sessions yet.`}
              </p>

              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm"
              >
                Find a Job to Practice
                <ArrowRight size={17} />
              </Link>

            </div>

          )}

          {/* =================================================
              SESSION CARDS
          ================================================= */}

          {filteredSessions.length > 0 && (

            <div className="space-y-4">

              {filteredSessions.map((session) => {

                const score = getScore(session);

                const statusStyle = getStatusStyle(
                  session.status
                );

                const StatusIcon = statusStyle.icon;

                const total = Number(
                  session.total_questions || 0
                );

                const completed = Number(
                  session.completed_questions || 0
                );

                const questionProgress =
                  total > 0
                    ? Math.round(
                        (completed / total) * 100
                      )
                    : 0;

                return (
                  <div
                    key={session.session_id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.045] transition overflow-hidden"
                  >

                    <div className="p-6">

                      <div className="flex flex-col xl:flex-row xl:items-center gap-6">

                        {/* JOB INFO */}

                        <div className="flex items-start gap-4 flex-1 min-w-0">

                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">

                            <BriefcaseBusiness
                              size={21}
                              className="text-indigo-300"
                            />

                          </div>

                          <div className="min-w-0">

                            <h3 className="font-display text-lg font-bold truncate">
                              {session.job_title ||
                                "General Interview"}
                            </h3>

                            <p className="text-sm text-slate-400 mt-1">
                              {session.company_name ||
                                "HireLens Practice"}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">

                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 size={13} />
                                {formatDate(
                                  session.started_at
                                )}
                              </span>

                              <span>
                                {session.interview_type ||
                                  "Mixed"}
                              </span>

                              <span>
                                {session.difficulty ||
                                  "Medium"}
                              </span>

                            </div>

                          </div>

                        </div>

                        {/* SCORE */}

                        <div className="xl:w-32">

                          <div className="text-xs text-slate-500 mb-2">
                            Overall score
                          </div>

                          <div className="text-3xl font-display font-bold">

                            {score !== null ? (
                              <span
                                className={
                                  score >= 80
                                    ? "text-emerald-300"
                                    : score >= 60
                                      ? "text-indigo-300"
                                      : score >= 40
                                        ? "text-amber-300"
                                        : "text-red-300"
                                }
                              >
                                {score}%
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                —
                              </span>
                            )}

                          </div>

                        </div>

                        {/* STATUS */}

                        <div className="xl:w-40">

                          <div className="text-xs text-slate-500 mb-2">
                            Status
                          </div>

                          <div
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${statusStyle.wrapper}`}
                          >

                            <StatusIcon size={14} />

                            {session.status}

                          </div>

                        </div>

                        {/* QUESTIONS */}

                        <div className="xl:w-40">

                          <div className="text-xs text-slate-500 mb-2">
                            Questions
                          </div>

                          <div className="text-sm font-semibold">
                            {completed} / {total}
                          </div>

                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">

                            <div
                              className="h-full rounded-full bg-indigo-400"
                              style={{
                                width: `${Math.min(
                                  100,
                                  questionProgress
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* ACTION */}

                        <div>

                          {session.status ===
                          "Completed" ? (

                            <Link
                              to={`/interview-review/${session.session_id}`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition text-sm font-semibold shadow-lg shadow-indigo-500/10"
                            >
                              <Eye size={15} />
                              Review Interview
                              <ArrowRight size={15} />
                            </Link>

                          ) : (

                            <Link
                              to={`/interview/${session.job_id}`}
                              state={{
                                historySessionId:
                                  session.session_id,
                              }}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition text-sm font-semibold"
                            >

                              {session.status ===
                              "In Progress"
                                ? "Continue"
                                : "Practice Again"}

                              <ArrowRight size={15} />

                            </Link>

                          )}

                        </div>

                      </div>

                    </div>

                    {/* FOOTER */}

                    <div className="px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">

                      <span>
                        Session #{session.session_id}
                      </span>

                      <span>
                        Started{" "}
                        {formatDateTime(
                          session.started_at
                        )}
                      </span>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

          {/* =================================================
              BOTTOM CTA
          ================================================= */}

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-7">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">

                  <Target
                    size={22}
                    className="text-violet-300"
                  />

                </div>

                <div>

                  <h3 className="font-display text-xl font-bold mb-2">
                    Ready for another round?
                  </h3>

                  <p className="text-sm text-slate-500 leading-6">
                    Choose a matched job and practice a fresh
                    AI-powered interview tailored to that role.
                  </p>

                </div>

              </div>

              <Link
                to="/jobs"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm"
              >
                Explore Job Matches
                <ArrowRight size={17} />
              </Link>

            </div>

          </section>

          {/* FOOTER */}

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">

            <p>
              HireLens • AI Interview Coach
            </p>

            <div className="flex items-center gap-2">
              <BookOpen size={14} />
              Practice. Improve. Perform.
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default InterviewHistory;