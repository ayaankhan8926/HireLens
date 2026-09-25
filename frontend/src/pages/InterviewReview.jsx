import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import api from "../api";

function InterviewReview() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const fetchedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!sessionId) {
      setError("Interview session ID is missing.");
      setLoading(false);
      return;
    }

    if (fetchedRef.current) {
      return;
    }

    fetchedRef.current = true;

    const fetchInterviewReview = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/interview/session/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success) {
          setSession(response.data.session || null);
          setQuestions(response.data.questions || []);

          if (response.data.questions?.length > 0) {
            setExpandedQuestion(
              response.data.questions[0].question_id
            );
          }
        } else {
          setError(
            response.data?.message ||
              "Unable to load interview review."
          );
        }
      } catch (err) {
        console.error(
          "Interview review error:",
          err
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("hirelens_token");
          localStorage.removeItem("hirelens_user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load interview review."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewReview();
  }, [navigate, sessionId]);

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

  const getScoreColor = (score) => {
    if (score >= 80) {
      return "text-emerald-300";
    }

    if (score >= 60) {
      return "text-indigo-300";
    }

    if (score >= 40) {
      return "text-amber-300";
    }

    return "text-red-300";
  };

  const getScoreBackground = (score) => {
    if (score >= 80) {
      return "bg-emerald-500/10 border-emerald-500/20";
    }

    if (score >= 60) {
      return "bg-indigo-500/10 border-indigo-500/20";
    }

    if (score >= 40) {
      return "bg-amber-500/10 border-amber-500/20";
    }

    return "bg-red-500/10 border-red-500/20";
  };

  const getPerformanceLabel = (score) => {
    if (score >= 80) {
      return "Excellent";
    }

    if (score >= 60) {
      return "Good";
    }

    if (score >= 40) {
      return "Needs Improvement";
    }

    return "Needs More Practice";
  };

  const getStatusConfig = (status) => {
    if (status === "Completed") {
      return {
        label: "Completed",
        icon: CheckCircle2,
        className:
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
      };
    }

    if (status === "In Progress") {
      return {
        label: "In Progress",
        icon: Clock3,
        className:
          "bg-amber-500/10 border-amber-500/20 text-amber-300",
      };
    }

    return {
      label: status || "Unknown",
      icon: XCircle,
      className:
        "bg-red-500/10 border-red-500/20 text-red-300",
    };
  };

  const parseExpectedTopics = (topics) => {
    if (!topics) {
      return [];
    }

    if (Array.isArray(topics)) {
      return topics;
    }

    return topics
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean);
  };

  const scoredQuestions = questions.filter(
    (question) =>
      question.score !== null &&
      question.score !== undefined
  );

  const averageQuestionScore =
    scoredQuestions.length > 0
      ? Math.round(
          scoredQuestions.reduce(
            (sum, question) =>
              sum + Number(question.score || 0),
            0
          ) / scoredQuestions.length
        )
      : Number(session?.overall_score || 0);

  const strongestQuestion =
    scoredQuestions.length > 0
      ? scoredQuestions.reduce((best, current) =>
          Number(current.score || 0) >
          Number(best.score || 0)
            ? current
            : best
        )
      : null;

  const weakestQuestion =
    scoredQuestions.length > 0
      ? scoredQuestions.reduce((worst, current) =>
          Number(current.score || 0) <
          Number(worst.score || 0)
            ? current
            : worst
        )
      : null;

  const statusConfig = getStatusConfig(
    session?.status
  );

  const StatusIcon = statusConfig.icon;

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
              Loading interview review...
            </p>

            <p className="text-slate-500 text-sm mt-2">
              Fetching your interview performance.
            </p>

          </div>

        </main>

      </div>
    );
  }

  if (error || !session) {
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
              Couldn't load interview review
            </h1>

            <p className="text-slate-400 text-sm leading-6 mb-6">
              {error ||
                "The requested interview session could not be found."}
            </p>

            <Link
              to="/interview-history"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold"
            >
              <ArrowLeft size={17} />
              Back to Interview History
            </Link>

          </div>

        </main>

      </div>
    );
  }

  const overallScore = Math.round(
    Number(session.overall_score || averageQuestionScore || 0)
  );

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
          MAIN
      ===================================================== */}

      <main className="flex-1 min-w-0 overflow-x-hidden">

        {/* HEADER */}

        <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 lg:px-10">

          <div>

            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">

              <Link
                to="/interview-history"
                className="hover:text-slate-300"
              >
                Interview History
              </Link>

              <ArrowRight size={14} />

              <span className="text-slate-300">
                Interview Review
              </span>

            </div>

            <h1 className="font-display text-xl font-bold">
              Interview Review
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

            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-300">
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

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

              <div className="max-w-2xl">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                  <Sparkles size={14} />
                  AI Interview Review
                </div>

                <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                  {session.job_title ||
                    "Interview Performance"}
                </h2>

                <p className="text-slate-400 leading-7">
                  {session.company_name
                    ? `${session.company_name} • Review your answers, scores, and AI feedback.`
                    : "Review your answers, scores, and AI feedback from this interview."}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-5">

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${statusConfig.className}`}
                  >
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </div>

                  <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
                    {session.interview_type ||
                      "Mixed"}
                  </span>

                  <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
                    {session.difficulty ||
                      "Medium"}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
                    <Clock3 size={13} />
                    {formatDate(
                      session.started_at
                    )}
                  </span>

                </div>

              </div>

              <div className="shrink-0">

                <div
                  className={`w-40 h-40 rounded-full border-[10px] border-white/5 relative flex items-center justify-center ${getScoreBackground(
                    overallScore
                  )}`}
                >

                  <div
                    className="absolute inset-[-10px] rounded-full"
                    style={{
                      background: `conic-gradient(#818cf8 ${overallScore}%, rgba(255,255,255,0.06) ${overallScore}% 100%)`,
                      WebkitMask:
                        "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)",
                      mask:
                        "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 0)",
                    }}
                  />

                  <div className="relative z-10 text-center">

                    <div
                      className={`text-4xl font-display font-bold ${getScoreColor(
                        overallScore
                      )}`}
                    >
                      {overallScore}%
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      Overall Score
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              SUMMARY STATS
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
                  Questions
                </span>

              </div>

              <div className="text-3xl font-display font-bold">
                {session.completed_questions || 0}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                of {session.total_questions || 0} answered
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

              <div className={`text-3xl font-display font-bold ${getScoreColor(averageQuestionScore)}`}>
                {averageQuestionScore}%
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Question average
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
                  Strongest
                </span>

              </div>

              <div className="text-3xl font-display font-bold text-emerald-300">
                {strongestQuestion
                  ? `${Math.round(
                      Number(
                        strongestQuestion.score
                      )
                    )}%`
                  : "—"}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Best answer
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
                  Focus
                </span>

              </div>

              <div className="text-lg font-display font-bold text-amber-300">
                {weakestQuestion
                  ? `Q${weakestQuestion.question_number}`
                  : "—"}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Area to improve
              </div>

            </div>

          </section>

          {/* =================================================
              PERFORMANCE SUMMARY
          ================================================= */}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">

            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-7">

              <div className="flex items-start justify-between mb-6">

                <div>

                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                    Performance analysis
                  </p>

                  <h3 className="font-display text-xl font-bold">
                    What your score tells you
                  </h3>

                </div>

                <BarChart3
                  size={22}
                  className="text-indigo-300"
                />

              </div>

              <div className="flex items-center justify-between mb-3">

                <span className="text-sm text-slate-400">
                  Overall interview performance
                </span>

                <span
                  className={`text-sm font-bold ${getScoreColor(
                    overallScore
                  )}`}
                >
                  {overallScore}%
                </span>

              </div>

              <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-5">

                <div
                  className="h-full rounded-full bg-indigo-400 transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, overallScore)
                    )}%`,
                  }}
                />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                  <div className="flex items-center gap-3 mb-3">

                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2
                        size={17}
                        className="text-emerald-300"
                      />
                    </div>

                    <span className="text-sm font-semibold">
                      Strongest response
                    </span>

                  </div>

                  {strongestQuestion ? (
                    <>
                      <div className="text-xs text-slate-500 mb-2">
                        Question{" "}
                        {strongestQuestion.question_number}
                      </div>

                      <p className="text-sm text-slate-300 line-clamp-3 leading-6">
                        {strongestQuestion.question_text}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No scored responses yet.
                    </p>
                  )}

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                  <div className="flex items-center gap-3 mb-3">

                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <TrendingUp
                        size={17}
                        className="text-amber-300"
                      />
                    </div>

                    <span className="text-sm font-semibold">
                      Focus area
                    </span>

                  </div>

                  {weakestQuestion ? (
                    <>
                      <div className="text-xs text-slate-500 mb-2">
                        Question{" "}
                        {weakestQuestion.question_number}
                      </div>

                      <p className="text-sm text-slate-300 line-clamp-3 leading-6">
                        {weakestQuestion.question_text}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Complete an interview to identify focus areas.
                    </p>
                  )}

                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.06] p-6 lg:p-7">

              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">

                <Sparkles
                  size={22}
                  className="text-indigo-300"
                />

              </div>

              <p className="text-xs uppercase tracking-widest text-indigo-300/70 font-semibold mb-2">
                AI assessment
              </p>

              <h3 className="font-display text-xl font-bold mb-3">
                {getPerformanceLabel(
                  overallScore
                )}
              </h3>

              <p className="text-sm text-slate-400 leading-6 mb-6">

                {overallScore >= 80
                  ? "Your responses show strong preparation. Keep practicing to maintain consistency."
                  : overallScore >= 60
                    ? "You have a solid foundation. Focus on improving clarity, depth, and technical precision."
                    : overallScore >= 40
                      ? "You have a starting foundation. Review the feedback below and practice your weaker areas."
                      : "Use this review to identify your gaps and build confidence through repeated practice."}

              </p>

              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">

                <div className="flex items-center justify-between text-xs mb-2">

                  <span className="text-slate-500">
                    Score
                  </span>

                  <span className="font-semibold">
                    {overallScore}/100
                  </span>

                </div>

                <div className="h-2 rounded-full bg-white/5 overflow-hidden">

                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, overallScore)
                      )}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              QUESTIONS
          ================================================= */}

          <section>

            <div className="flex items-end justify-between mb-5">

              <div>

                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Detailed review
                </p>

                <h2 className="font-display text-2xl font-bold">
                  Question-by-question analysis
                </h2>

              </div>

              <span className="text-sm text-slate-500 hidden sm:block">
                {questions.length} question
                {questions.length === 1
                  ? ""
                  : "s"}
              </span>

            </div>

            <div className="space-y-4">

              {questions.map((question) => {

                const questionScore =
                  question.score !== null &&
                  question.score !== undefined
                    ? Math.round(
                        Number(question.score)
                      )
                    : null;

                const isExpanded =
                  expandedQuestion ===
                  question.question_id;

                const expectedTopics =
                  parseExpectedTopics(
                    question.expected_topics
                  );

                return (
                  <div
                    key={question.question_id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden"
                  >

                    {/* QUESTION HEADER */}

                    <button
                      onClick={() =>
                        setExpandedQuestion(
                          isExpanded
                            ? null
                            : question.question_id
                        )
                      }
                      className="w-full text-left p-6 hover:bg-white/[0.02] transition"
                    >

                      <div className="flex items-start gap-4">

                        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">

                          <span className="text-sm font-bold text-indigo-300">
                            Q{question.question_number}
                          </span>

                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex flex-wrap items-center gap-2 mb-3">

                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-400">
                              {question.question_type ||
                                "Technical"}
                            </span>

                            {questionScore !== null && (
                              <span
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${getScoreBackground(
                                  questionScore
                                )} ${getScoreColor(
                                  questionScore
                                )}`}
                              >
                                {questionScore}/100
                              </span>
                            )}

                          </div>

                          <h3 className="font-semibold text-base leading-6 text-slate-100">
                            {question.question_text}
                          </h3>

                        </div>

                        <div className="shrink-0 text-slate-500">

                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}

                        </div>

                      </div>

                    </button>

                    {/* QUESTION DETAILS */}

                    {isExpanded && (

                      <div className="border-t border-white/10 p-6 space-y-5">

                        {/* SCORE */}

                        {questionScore !== null && (

                          <div
                            className={`rounded-2xl border p-5 ${getScoreBackground(
                              questionScore
                            )}`}
                          >

                            <div className="flex items-center justify-between mb-3">

                              <div>

                                <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
                                  AI evaluation
                                </div>

                                <div
                                  className={`text-2xl font-display font-bold ${getScoreColor(
                                    questionScore
                                  )}`}
                                >
                                  {questionScore}/100
                                </div>

                              </div>

                              <div className="text-right">

                                <div className="text-xs text-slate-500">
                                  Performance
                                </div>

                                <div className="text-sm font-semibold mt-1">
                                  {getPerformanceLabel(
                                    questionScore
                                  )}
                                </div>

                              </div>

                            </div>

                            <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">

                              <div
                                className="h-full rounded-full bg-indigo-400"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      questionScore
                                    )
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>

                        )}

                        {/* USER ANSWER */}

                        <div>

                          <div className="flex items-center gap-2 mb-3">

                            <MessageSquare
                              size={17}
                              className="text-indigo-300"
                            />

                            <h4 className="font-semibold">
                              Your answer
                            </h4>

                          </div>

                          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">

                            {question.user_answer ? (
                              <p className="text-sm text-slate-300 leading-7 whitespace-pre-wrap">
                                {question.user_answer}
                              </p>
                            ) : (
                              <p className="text-sm text-slate-600 italic">
                                No answer was submitted for this question.
                              </p>
                            )}

                          </div>

                        </div>

                        {/* AI FEEDBACK */}

                        <div>

                          <div className="flex items-center gap-2 mb-3">

                            <Sparkles
                              size={17}
                              className="text-violet-300"
                            />

                            <h4 className="font-semibold">
                              AI feedback
                            </h4>

                          </div>

                          <div className="rounded-2xl border border-violet-500/10 bg-violet-500/[0.04] p-5">

                            {question.feedback ? (
                              <p className="text-sm text-slate-300 leading-7 whitespace-pre-wrap">
                                {question.feedback}
                              </p>
                            ) : (
                              <p className="text-sm text-slate-600 italic">
                                No AI feedback is available for this question.
                              </p>
                            )}

                          </div>

                        </div>

                        {/* EXPECTED TOPICS */}

                        {expectedTopics.length > 0 && (

                          <div>

                            <div className="flex items-center gap-2 mb-3">

                              <Target
                                size={17}
                                className="text-amber-300"
                              />

                              <h4 className="font-semibold">
                                Expected topics
                              </h4>

                            </div>

                            <div className="flex flex-wrap gap-2">

                              {expectedTopics.map(
                                (topic, index) => (
                                  <span
                                    key={`${topic}-${index}`}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400"
                                  >
                                    {topic}
                                  </span>
                                )
                              )}

                            </div>

                          </div>

                        )}

                        {/* ANSWERED TIME */}

                        {question.answered_at && (

                          <div className="pt-2 text-xs text-slate-600 flex items-center gap-1.5">

                            <Clock3 size={13} />

                            Answered{" "}
                            {formatDateTime(
                              question.answered_at
                            )}

                          </div>

                        )}

                      </div>

                    )}

                  </div>
                );
              })}

            </div>

          </section>

          {/* =================================================
              BOTTOM ACTIONS
          ================================================= */}

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-7">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div>

                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Next step
                </p>

                <h3 className="font-display text-xl font-bold mb-2">
                  Ready to improve your score?
                </h3>

                <p className="text-sm text-slate-500 leading-6">
                  Practice another interview and compare your
                  performance with this session.
                </p>

              </div>

              <div className="flex flex-col sm:flex-row gap-3">

                <Link
                  to="/interview-history"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition font-semibold text-sm"
                >
                  <ArrowLeft size={16} />
                  Interview History
                </Link>

                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm"
                >
                  Practice Again
                  <ArrowRight size={16} />
                </Link>

              </div>

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

export default InterviewReview;