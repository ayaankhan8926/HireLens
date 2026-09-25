import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Loader2,
  MessageSquare,
  PlayCircle,
  Send,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

import api from "../api";

export default function Interview() {
  const { jobId } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const historySessionId =
    location.state?.historySessionId || null;

  const isReviewMode = Boolean(historySessionId);

  const [setup, setSetup] = useState({
    interview_type: "Technical",
    difficulty: "Medium",
    total_questions: 5,
  });

  const [session, setSession] = useState(null);

  const [job, setJob] = useState(null);

  const [questions, setQuestions] = useState([]);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] = useState(null);

  const [loading, setLoading] = useState(false);

  const [reviewLoading, setReviewLoading] = useState(
    isReviewMode
  );

  const [evaluating, setEvaluating] = useState(false);

  const [completing, setCompleting] = useState(false);

  const [error, setError] = useState("");

  const [started, setStarted] = useState(false);

  const [completed, setCompleted] = useState(false);

  const [reviewMode, setReviewMode] =
    useState(isReviewMode);

  const [reviewIndex, setReviewIndex] = useState(0);

  const token = localStorage.getItem(
    "hirelens_token"
  );

  /* =========================================================
     AUTH + REVIEW SESSION LOAD
  ========================================================= */

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!historySessionId) {
      return;
    }

    const fetchReviewSession = async () => {
      try {
        setReviewLoading(true);
        setError("");

        const response = await api.get(
          `/interview/session/${historySessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Unable to load interview session."
          );
        }

        const loadedSession =
          data.session || data.interview || null;

        const loadedQuestions =
          data.questions ||
          loadedSession?.questions ||
          [];

        const loadedJob =
          data.job ||
          loadedSession?.job ||
          null;

        if (!loadedSession) {
          throw new Error(
            "Interview session details were not returned."
          );
        }

        setSession(loadedSession);

        setJob(loadedJob);

        setQuestions(
          Array.isArray(loadedQuestions)
            ? loadedQuestions
            : []
        );

        setSetup({
          interview_type:
            loadedSession.interview_type ||
            "Mixed",
          difficulty:
            loadedSession.difficulty ||
            "Medium",
          total_questions:
            Number(
              loadedSession.total_questions ||
                loadedQuestions.length ||
                5
            ),
        });

        setStarted(true);

        setCompleted(
          loadedSession.status === "Completed"
        );

        setReviewMode(true);

        setReviewIndex(0);

        setCurrentQuestionIndex(0);

        const firstQuestion =
          Array.isArray(loadedQuestions) &&
          loadedQuestions.length > 0
            ? loadedQuestions[0]
            : null;

        setAnswer(
          firstQuestion?.user_answer || ""
        );

        setEvaluation(
          firstQuestion?.score !== null &&
            firstQuestion?.score !== undefined
            ? firstQuestion
            : null
        );
      } catch (err) {
        console.error(
          "Load interview review error:",
          err
        );

        if (err.response?.status === 401) {
          localStorage.removeItem(
            "hirelens_token"
          );

          localStorage.removeItem(
            "hirelens_user"
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load interview review."
        );
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviewSession();
  }, [
    token,
    navigate,
    historySessionId,
  ]);

  /* =========================================================
     NORMAL INTERVIEW START
  ========================================================= */

  const startInterview = async () => {
    setLoading(true);

    setError("");

    try {
      const response = await api.post(
        "/interview/start",
        {
          job_id: Number(jobId),
          interview_type:
            setup.interview_type,
          difficulty:
            setup.difficulty,
          total_questions: Number(
            setup.total_questions
          ),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to start interview"
        );
      }

      setSession(data.session);

      setJob(data.job);

      setQuestions(data.questions || []);

      setCurrentQuestionIndex(0);

      setAnswer("");

      setEvaluation(null);

      setStarted(true);

      setCompleted(false);

      setReviewMode(false);

      setReviewIndex(0);
    } catch (err) {
      console.error(
        "Start interview error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "hirelens_token"
        );

        localStorage.removeItem(
          "hirelens_user"
        );

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start interview."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     NORMAL ANSWER SUBMISSION
  ========================================================= */

  const submitAnswer = async () => {
    const currentQuestion =
      questions[currentQuestionIndex];

    if (!currentQuestion) {
      return;
    }

    if (!answer.trim()) {
      setError(
        "Please write your answer before submitting."
      );

      return;
    }

    setEvaluating(true);

    setError("");

    try {
      const response = await api.put(
        `/interview/question/${currentQuestion.question_id}/answer`,
        {
          user_answer: answer.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to evaluate answer"
        );
      }

      setEvaluation(
        data.question
      );

      setSession((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          completed_questions:
            data.interview
              ?.completed_questions ??
            previous.completed_questions,
        };
      });

      setQuestions((previous) =>
        previous.map((question) =>
          question.question_id ===
          currentQuestion.question_id
            ? {
                ...question,
                user_answer:
                  answer.trim(),
                score:
                  data.question?.score,
                feedback:
                  data.question?.feedback,
                strengths:
                  data.question?.strengths,
                improvements:
                  data.question?.improvements,
              }
            : question
        )
      );
    } catch (err) {
      console.error(
        "Submit answer error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "hirelens_token"
        );

        localStorage.removeItem(
          "hirelens_user"
        );

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to evaluate your answer."
      );
    } finally {
      setEvaluating(false);
    }
  };

  /* =========================================================
     NEXT QUESTION
  ========================================================= */

  const nextQuestion = () => {
    if (
      currentQuestionIndex <
      questions.length - 1
    ) {
      const nextIndex =
        currentQuestionIndex + 1;

      setCurrentQuestionIndex(
        nextIndex
      );

      setAnswer("");

      setEvaluation(null);

      setError("");
    } else {
      completeInterview();
    }
  };

  /* =========================================================
     COMPLETE NORMAL INTERVIEW
  ========================================================= */

  const completeInterview = async () => {
    if (!session) {
      return;
    }

    setCompleting(true);

    setError("");

    try {
      const response = await api.put(
        `/interview/session/${session.session_id}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to complete interview"
        );
      }

      setSession((previous) => ({
        ...previous,
        status: "Completed",
        overall_score:
          data.overall_score,
        completed_questions:
          data.completed_questions,
      }));

      setCompleted(true);
    } catch (err) {
      console.error(
        "Complete interview error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "hirelens_token"
        );

        localStorage.removeItem(
          "hirelens_user"
        );

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to complete interview."
      );
    } finally {
      setCompleting(false);
    }
  };

  /* =========================================================
     REVIEW NAVIGATION
  ========================================================= */

  const openReviewQuestion = (
    index
  ) => {
    if (
      index < 0 ||
      index >= questions.length
    ) {
      return;
    }

    setReviewIndex(index);

    setCurrentQuestionIndex(index);

    const question =
      questions[index];

    setAnswer(
      question?.user_answer || ""
    );

    setEvaluation(
      question?.score !== null &&
        question?.score !== undefined
        ? question
        : null
    );

    setError("");
  };

  const nextReviewQuestion = () => {
    if (
      reviewIndex <
      questions.length - 1
    ) {
      openReviewQuestion(
        reviewIndex + 1
      );
    }
  };

  const previousReviewQuestion = () => {
    if (reviewIndex > 0) {
      openReviewQuestion(
        reviewIndex - 1
      );
    }
  };

  /* =========================================================
     NEW INTERVIEW
  ========================================================= */

  const startNewInterview = () => {
    navigate(`/jobs/${jobId}`);
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const currentQuestion =
    questions[currentQuestionIndex];

  const reviewQuestion =
    questions[reviewIndex];

  const progress =
    questions.length > 0
      ? Math.round(
          ((currentQuestionIndex + 1) /
            questions.length) *
            100
        )
      : 0;

  const reviewProgress =
    questions.length > 0
      ? Math.round(
          ((reviewIndex + 1) /
            questions.length) *
            100
        )
      : 0;

  const normalizeTopics = (
    topics
  ) => {
    if (Array.isArray(topics)) {
      return topics;
    }

    if (
      typeof topics === "string"
    ) {
      try {
        const parsed =
          JSON.parse(topics);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return topics
          .split(",")
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);
      }
    }

    return [];
  };

  const getScoreColor = (
    score
  ) => {
    const numericScore =
      Number(score);

    if (
      numericScore >= 80
    ) {
      return "text-emerald-300";
    }

    if (
      numericScore >= 60
    ) {
      return "text-indigo-300";
    }

    if (
      numericScore >= 40
    ) {
      return "text-amber-300";
    }

    return "text-red-300";
  };

  const getScoreBar = (
    score
  ) => {
    const numericScore =
      Number(score);

    if (
      numericScore >= 80
    ) {
      return "bg-emerald-400";
    }

    if (
      numericScore >= 60
    ) {
      return "bg-indigo-400";
    }

    if (
      numericScore >= 40
    ) {
      return "bg-amber-400";
    }

    return "bg-red-400";
  };

  if (!token) {
    return null;
  }

  /* =========================================================
     REVIEW LOADING
  ========================================================= */

  if (
    reviewMode &&
    reviewLoading
  ) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">

        <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">

          <div className="mx-auto flex max-w-7xl items-center px-6 py-5">

            <Link
              to="/dashboard"
              className="flex items-center gap-3"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
                <Sparkles size={20} />
              </div>

              <div>

                <div className="font-display text-lg font-bold">
                  HireLens
                </div>

                <div className="text-xs text-slate-400">
                  AI Interview Coach
                </div>

              </div>

            </Link>

          </div>

        </header>

        <main className="flex min-h-[calc(100vh-81px)] items-center justify-center px-6">

          <div className="text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">

              <Loader2
                size={28}
                className="animate-spin text-indigo-300"
              />

            </div>

            <h1 className="font-display text-xl font-bold">
              Loading interview review...
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Fetching your saved questions and AI feedback.
            </p>

          </div>

        </main>

      </div>
    );
  }

  /* =========================================================
     REVIEW ERROR
  ========================================================= */

  if (
    reviewMode &&
    error &&
    !session
  ) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">

        <main className="flex min-h-screen items-center justify-center px-6">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">

              <XCircle
                size={28}
                className="text-red-400"
              />

            </div>

            <h1 className="font-display text-xl font-bold">
              Couldn't load interview review
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {error}
            </p>

            <div className="mt-6 flex flex-col gap-3">

              <Link
                to="/interview-history"
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400"
              >
                <ArrowLeft size={17} />
                Back to Interview History
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10"
              >
                Dashboard
              </Link>

            </div>

          </div>

        </main>

      </div>
    );
  }

  /* =========================================================
     REVIEW SCREEN
  ========================================================= */

  if (
    reviewMode &&
    session &&
    questions.length > 0
  ) {
    const score =
      Number(
        session.overall_score || 0
      );

    const questionScore =
      reviewQuestion?.score !== null &&
      reviewQuestion?.score !== undefined
        ? Number(
            reviewQuestion.score
          )
        : null;

    const topics = normalizeTopics(
      reviewQuestion?.expected_topics
    );

    const strengths =
      Array.isArray(
        reviewQuestion?.strengths
      )
        ? reviewQuestion.strengths
        : [];

    const improvements =
      Array.isArray(
        reviewQuestion?.improvements
      )
        ? reviewQuestion.improvements
        : [];

    return (
      <div className="min-h-screen bg-slate-950 text-white">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

            <Link
              to="/dashboard"
              className="flex items-center gap-3"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
                <Sparkles size={20} />
              </div>

              <div>

                <div className="font-display text-lg font-bold">
                  HireLens
                </div>

                <div className="text-xs text-slate-400">
                  AI Interview Coach
                </div>

              </div>

            </Link>

            <Link
              to="/interview-history"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} />
              Interview History
            </Link>

          </div>

        </header>

        <main className="mx-auto max-w-7xl px-6 py-10">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="relative mb-7 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-slate-900 to-slate-900 p-7 lg:p-9">

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative">

              <div className="mb-5 flex flex-wrap items-center gap-3">

                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">

                  <Sparkles size={14} />

                  Interview Review

                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">

                  <CheckCircle2 size={14} />

                  {session.status || "Completed"}

                </span>

              </div>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    {job?.company_name ||
                      session.company_name ||
                      "HireLens Practice"}
                  </p>

                  <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">

                    {job?.title ||
                      session.job_title ||
                      "Interview Session"}

                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">

                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                      {session.interview_type ||
                        "Mixed"}
                    </span>

                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                      {session.difficulty ||
                        "Medium"}
                    </span>

                    <span className="inline-flex items-center gap-1.5">

                      <Clock3 size={14} />

                      {session.started_at
                        ? new Date(
                            session.started_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Date unavailable"}

                    </span>

                  </div>

                </div>

                <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-3xl border border-indigo-400/20 bg-indigo-500/10">

                  <span
                    className={`font-display text-4xl font-bold ${getScoreColor(
                      score
                    )}`}
                  >
                    {Math.round(score)}%
                  </span>

                  <span className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
                    Overall Score
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <section className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">

                <Target size={19} />

              </div>

              <p className="text-xs text-slate-500">
                Questions
              </p>

              <p className="mt-1 font-display text-2xl font-bold">
                {session.completed_questions ||
                  0}
                /
                {session.total_questions ||
                  questions.length}
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">

                <CheckCircle2 size={19} />

              </div>

              <p className="text-xs text-slate-500">
                Status
              </p>

              <p className="mt-1 font-display text-lg font-bold text-emerald-300">
                Completed
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">

                <BarChart3 size={19} />

              </div>

              <p className="text-xs text-slate-500">
                Interview Type
              </p>

              <p className="mt-1 font-display text-lg font-bold">
                {session.interview_type ||
                  "Mixed"}
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">

                <Zap size={19} />

              </div>

              <p className="text-xs text-slate-500">
                Difficulty
              </p>

              <p className="mt-1 font-display text-lg font-bold">
                {session.difficulty ||
                  "Medium"}
              </p>

            </div>

          </section>

          {/* =================================================
              QUESTION NAVIGATION
          ================================================= */}

          <section className="mb-7 rounded-3xl border border-white/10 bg-white/[0.03] p-5">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Question review
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Review each question and your AI evaluation.
                </p>

              </div>

              <span className="text-sm font-semibold text-indigo-300">
                {reviewIndex + 1} /{" "}
                {questions.length}
              </span>

            </div>

            <div className="flex flex-wrap gap-2">

              {questions.map(
                (question, index) => {

                  const qScore =
                    question.score !==
                      null &&
                    question.score !==
                      undefined
                      ? Number(
                          question.score
                        )
                      : null;

                  return (
                    <button
                      key={
                        question.question_id ||
                        index
                      }
                      onClick={() =>
                        openReviewQuestion(
                          index
                        )
                      }
                      className={`relative flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
                        reviewIndex ===
                        index
                          ? "border-indigo-400/40 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >

                      {index + 1}

                      {qScore !==
                        null && (
                        <span
                          className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ${getScoreBar(
                            qScore
                          )}`}
                        />
                      )}

                    </button>
                  );
                }
              )}

            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">

              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{
                  width: `${reviewProgress}%`,
                }}
              />

            </div>

          </section>

          {/* =================================================
              QUESTION + EVALUATION
          ================================================= */}

          <section className="grid gap-6 lg:grid-cols-3">

            {/* QUESTION */}

            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-7 md:p-9">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 font-semibold text-indigo-300">

                    {reviewIndex + 1}

                  </span>

                  <div>

                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Question
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {reviewQuestion?.question_type ||
                        "Interview Question"}
                    </p>

                  </div>

                </div>

                {questionScore !==
                  null && (
                  <div className="text-right">

                    <p className="text-xs text-slate-500">
                      Question Score
                    </p>

                    <p
                      className={`font-display text-2xl font-bold ${getScoreColor(
                        questionScore
                      )}`}
                    >
                      {Math.round(
                        questionScore
                      )}
                      %
                    </p>

                  </div>
                )}

              </div>

              <h2 className="mt-8 font-display text-2xl font-semibold leading-relaxed md:text-3xl">

                {reviewQuestion?.question_text ||
                  "Question unavailable."}

              </h2>

              {topics.length >
                0 && (
                <div className="mt-7 rounded-2xl border border-indigo-400/10 bg-indigo-500/5 p-5">

                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-300">

                    <Target size={16} />

                    What this question tests

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {topics.map(
                      (
                        topic,
                        index
                      ) => (
                        <span
                          key={index}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                        >
                          {topic}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* USER ANSWER */}

              <div className="mt-8">

                <div className="mb-3 flex items-center justify-between">

                  <label className="text-sm font-semibold text-slate-300">
                    Your answer
                  </label>

                  <span className="text-xs text-slate-600">
                    Saved response
                  </span>

                </div>

                <div className="min-h-[180px] whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-sm leading-7 text-slate-300">

                  {reviewQuestion?.user_answer ||
                    "No answer was recorded for this question."}

                </div>

              </div>

            </div>

            {/* AI EVALUATION */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">

                  <Sparkles size={20} />

                </div>

                <div>

                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    AI evaluation
                  </p>

                  <h3 className="font-display text-lg font-bold">
                    Performance
                  </h3>

                </div>

              </div>

              {questionScore !==
              null ? (
                <>

                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/5 p-5">

                    <div className="flex items-center justify-between">

                      <span className="text-sm text-slate-400">
                        Score
                      </span>

                      <span
                        className={`font-display text-3xl font-bold ${getScoreColor(
                          questionScore
                        )}`}
                      >
                        {Math.round(
                          questionScore
                        )}
                        %
                      </span>

                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">

                      <div
                        className={`h-full rounded-full transition-all ${getScoreBar(
                          questionScore
                        )}`}
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

                  <div className="mt-5">

                    <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                      Feedback
                    </p>

                    <p className="text-sm leading-7 text-slate-300">
                      {reviewQuestion?.feedback ||
                        "No feedback was saved for this answer."}
                    </p>

                  </div>

                  {strengths.length >
                    0 && (
                    <div className="mt-6">

                      <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
                        Strengths
                      </p>

                      <div className="space-y-3">

                        {strengths.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className="flex gap-3 text-sm leading-6 text-slate-300"
                            >

                              <CheckCircle2
                                size={
                                  17
                                }
                                className="mt-1 shrink-0 text-emerald-400"
                              />

                              <span>
                                {
                                  item
                                }
                              </span>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  {improvements.length >
                    0 && (
                    <div className="mt-6">

                      <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
                        Areas to improve
                      </p>

                      <div className="space-y-3">

                        {improvements.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className="flex gap-3 text-sm leading-6 text-slate-300"
                            >

                              <Target
                                size={
                                  17
                                }
                                className="mt-1 shrink-0 text-amber-400"
                              />

                              <span>
                                {
                                  item
                                }
                              </span>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">

                  <MessageSquare
                    size={24}
                    className="mx-auto mb-3 text-slate-500"
                  />

                  <p className="text-sm text-slate-400">
                    No AI evaluation was saved for this question.
                  </p>

                </div>
              )}

            </div>

          </section>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <section className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <button
              onClick={
                previousReviewQuestion
              }
              disabled={
                reviewIndex === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >

              <ArrowLeft size={17} />

              Previous Question

            </button>

            <div className="flex flex-col gap-3 sm:flex-row">

              {reviewIndex <
                questions.length -
                  1 ? (
                <button
                  onClick={
                    nextReviewQuestion
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-semibold transition hover:bg-indigo-400"
                >

                  Next Question

                  <ArrowRight
                    size={17}
                  />

                </button>
              ) : (
                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-semibold transition hover:bg-indigo-400"
                >

                  Practice Again

                  <PlayCircle
                    size={17}
                  />

                </Link>
              )}

            </div>

          </section>

          {/* =================================================
              BOTTOM CTA
          ================================================= */}

          <section className="mt-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.06] p-6 lg:p-7">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">

                  <Trophy
                    size={22}
                    className="text-indigo-300"
                  />

                </div>

                <div>

                  <h3 className="font-display text-xl font-bold">
                    Keep improving your interview performance
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Review your weak areas and practice another interview tailored to your target role.
                  </p>

                </div>

              </div>

              <Link
                to="/jobs"
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Explore Job Matches
                <ArrowRight size={17} />
              </Link>

            </div>

          </section>

        </main>

      </div>
    );
  }

  /* =========================================================
     NORMAL INTERVIEW HEADER
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            to="/dashboard"
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
              <Sparkles size={20} />
            </div>

            <div>

              <div className="font-display text-lg font-bold">
                HireLens
              </div>

              <div className="text-xs text-slate-400">
                AI Interview Coach
              </div>

            </div>

          </Link>

          {started &&
            !completed && (
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 md:flex">

                <Clock3 size={16} />

                <span>
                  Question{" "}
                  {currentQuestionIndex +
                    1}{" "}
                  of{" "}
                  {questions.length}
                </span>

              </div>
            )}

        </div>

      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">

            <XCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="text-sm">
              {error}
            </div>

          </div>
        )}

        {/* =================================================
            SETUP SCREEN
        ================================================= */}

        {!started && (
          <div className="mx-auto max-w-4xl">

            <Link
              to={`/jobs/${jobId}`}
              className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >

              <ArrowLeft size={16} />

              Back to Job

            </Link>

            <div className="mb-10">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">

                <Sparkles size={16} />

                AI-powered interview preparation

              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">

                Prepare for your

                <span className="text-indigo-400">
                  {" "}real interview.
                </span>

              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">

                HireLens will analyze the target role,
                required skills, and your profile to
                generate personalized interview questions
                and evaluate your answers.

              </p>

            </div>

            <div className="grid gap-6 lg:grid-cols-3">

              {/* JOB CARD */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-3">

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">

                      <BriefcaseIcon />

                    </div>

                    <div>

                      <p className="text-sm text-slate-500">
                        Target interview
                      </p>

                      <h2 className="font-display text-xl font-semibold">
                        {job?.title ||
                          "Selected Job"}
                      </h2>

                      {job?.company_name && (
                        <p className="mt-1 text-sm text-slate-500">
                          {job.company_name}
                        </p>
                      )}

                    </div>

                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">

                    <div className="flex items-center gap-2 text-sm text-slate-400">

                      <Target size={16} />

                      Personalized for your profile

                    </div>

                  </div>

                </div>

              </div>

              {/* INTERVIEW TYPE */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">

                  <Code2 size={20} />

                </div>

                <h3 className="font-display text-lg font-semibold">
                  Interview Type
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Choose what you want to practice.
                </p>

                <select
                  value={
                    setup.interview_type
                  }
                  onChange={(event) =>
                    setSetup({
                      ...setup,
                      interview_type:
                        event.target.value,
                    })
                  }
                  className="mt-5 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                >

                  <option value="Technical">
                    Technical
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Mixed">
                    Mixed
                  </option>

                </select>

              </div>

              {/* DIFFICULTY */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">

                  <Zap size={20} />

                </div>

                <h3 className="font-display text-lg font-semibold">
                  Difficulty
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Select your preparation level.
                </p>

                <select
                  value={
                    setup.difficulty
                  }
                  onChange={(event) =>
                    setSetup({
                      ...setup,
                      difficulty:
                        event.target.value,
                    })
                  }
                  className="mt-5 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                >

                  <option value="Easy">
                    Easy
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="Hard">
                    Hard
                  </option>

                </select>

              </div>

              {/* QUESTIONS */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">

                  <MessageSquare size={20} />

                </div>

                <h3 className="font-display text-lg font-semibold">
                  Questions
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  How many questions do you want?
                </p>

                <select
                  value={
                    setup.total_questions
                  }
                  onChange={(event) =>
                    setSetup({
                      ...setup,
                      total_questions:
                        Number(
                          event.target.value
                        ),
                    })
                  }
                  className="mt-5 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                >

                  <option value={3}>
                    3 Questions
                  </option>

                  <option value={5}>
                    5 Questions
                  </option>

                  <option value={7}>
                    7 Questions
                  </option>

                  <option value={10}>
                    10 Questions
                  </option>

                </select>

              </div>

            </div>

            <button
              onClick={
                startInterview
              }
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-500 px-6 py-4 font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  AI is preparing your interview...

                </>
              ) : (
                <>
                  <Sparkles size={20} />

                  Start AI Interview

                  <ChevronRight size={20} />

                </>
              )}

            </button>

            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500">

              <span>
                ✓ Personalized questions
              </span>

              <span>
                ✓ AI answer evaluation
              </span>

              <span>
                ✓ Detailed feedback
              </span>

            </div>

          </div>
        )}

        {/* =================================================
            NORMAL INTERVIEW SCREEN
        ================================================= */}

        {started &&
          !completed &&
          currentQuestion && (
            <div className="mx-auto max-w-4xl">

              {/* PROGRESS */}

              <div className="mb-8">

                <div className="mb-3 flex items-center justify-between text-sm">

                  <span className="text-slate-400">
                    Interview progress
                  </span>

                  <span className="font-medium text-white">
                    {progress}%
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">

                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

              </div>

              {/* QUESTION CARD */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-10">

                <div className="flex items-center justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 font-semibold text-indigo-300">

                      {currentQuestionIndex +
                        1}

                    </span>

                    <div>

                      <p className="text-sm text-slate-500">
                        Question
                      </p>

                      <p className="text-sm font-medium text-slate-300">
                        {currentQuestion.question_type}
                      </p>

                    </div>

                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">

                    {setup.difficulty}

                  </span>

                </div>

                <h2 className="mt-8 font-display text-2xl font-semibold leading-relaxed md:text-3xl">

                  {currentQuestion.question_text}

                </h2>

                {normalizeTopics(
                  currentQuestion.expected_topics
                ).length >
                  0 && (
                  <div className="mt-6 rounded-2xl border border-indigo-400/10 bg-indigo-500/5 p-5">

                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-300">

                      <Target size={16} />

                      What this question tests

                    </div>

                    <div className="flex flex-wrap gap-2">

                      {normalizeTopics(
                        currentQuestion.expected_topics
                      ).map(
                        (
                          topic,
                          index
                        ) => (
                          <span
                            key={index}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                          >
                            {topic}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )}

                <div className="mt-8">

                  <label className="mb-3 block text-sm font-medium text-slate-300">
                    Your answer
                  </label>

                  <textarea
                    value={answer}
                    onChange={(event) =>
                      setAnswer(
                        event.target.value
                      )
                    }
                    disabled={
                      evaluating ||
                      Boolean(
                        evaluation
                      )
                    }
                    rows={9}
                    placeholder="Explain your answer as if you were speaking to an interviewer..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-indigo-400 disabled:opacity-60"
                  />

                </div>

                {!evaluation ? (
                  <button
                    onClick={
                      submitAnswer
                    }
                    disabled={
                      evaluating ||
                      !answer.trim()
                    }
                    className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-500 px-6 py-4 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {evaluating ? (
                      <>
                        <Loader2
                          size={20}
                          className="animate-spin"
                        />

                        AI is evaluating your answer...

                      </>
                    ) : (
                      <>
                        <Send size={19} />

                        Submit Answer

                      </>
                    )}

                  </button>
                ) : (
                  <div className="mt-6">

                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/5 p-6">

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">

                            <CheckCircle2 size={17} />

                            AI Evaluation

                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            Here's how your answer performed.
                          </p>

                        </div>

                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-500/10">

                          <span className="font-display text-2xl font-bold text-emerald-300">

                            {Math.round(
                              Number(
                                evaluation.score ||
                                  0
                              )
                            )}

                          </span>

                          <span className="text-[10px] uppercase tracking-wider text-slate-500">
                            / 100
                          </span>

                        </div>

                      </div>

                      <div className="mt-6 border-t border-white/10 pt-5">

                        <p className="text-sm leading-7 text-slate-300">

                          {evaluation.feedback}

                        </p>

                      </div>

                    </div>

                    {evaluation.strengths?.length >
                      0 && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                        <h3 className="font-medium text-white">
                          Strengths
                        </h3>

                        <div className="mt-3 space-y-2">

                          {evaluation.strengths.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="flex gap-3 text-sm leading-6 text-slate-300"
                              >

                                <CheckCircle2
                                  size={
                                    17
                                  }
                                  className="mt-1 shrink-0 text-emerald-400"
                                />

                                <span>
                                  {
                                    item
                                  }
                                </span>

                              </div>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    {evaluation.improvements?.length >
                      0 && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                        <h3 className="font-medium text-white">
                          Areas to Improve
                        </h3>

                        <div className="mt-3 space-y-2">

                          {evaluation.improvements.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="flex gap-3 text-sm leading-6 text-slate-300"
                              >

                                <Target
                                  size={
                                    17
                                  }
                                  className="mt-1 shrink-0 text-amber-400"
                                />

                                <span>
                                  {
                                    item
                                  }
                                </span>

                              </div>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    <button
                      onClick={
                        nextQuestion
                      }
                      disabled={
                        completing
                      }
                      className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
                    >

                      {completing ? (
                        <>
                          <Loader2
                            size={20}
                            className="animate-spin"
                          />

                          Finishing interview...

                        </>
                      ) : currentQuestionIndex <
                        questions.length -
                          1 ? (
                        <>
                          Next Question

                          <ChevronRight
                            size={20}
                          />
                        </>
                      ) : (
                        <>
                          Complete Interview

                          <Trophy size={19} />
                        </>
                      )}

                    </button>

                  </div>
                )}

              </div>

            </div>
          )}

        {/* =================================================
            COMPLETED SCREEN
        ================================================= */}

        {completed &&
          !reviewMode && (
            <div className="mx-auto max-w-3xl">

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center md:p-12">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300">

                  <Trophy size={36} />

                </div>

                <div className="mt-6">

                  <p className="text-sm font-medium text-emerald-300">
                    Interview completed
                  </p>

                  <h1 className="mt-2 font-display text-4xl font-bold">
                    Great work.
                  </h1>

                  <p className="mx-auto mt-4 max-w-xl text-slate-400">
                    Your AI interview session has been
                    evaluated. Review your score and use
                    the feedback to improve your preparation.
                  </p>

                </div>

                <div className="mx-auto mt-8 flex h-32 w-32 flex-col items-center justify-center rounded-3xl border border-indigo-400/20 bg-indigo-500/10">

                  <span className="font-display text-4xl font-bold text-indigo-300">

                    {Math.round(
                      Number(
                        session?.overall_score ||
                          0
                      )
                    )}

                  </span>

                  <span className="text-xs uppercase tracking-widest text-slate-500">
                    Overall Score
                  </span>

                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                    <p className="text-sm text-slate-500">
                      Questions answered
                    </p>

                    <p className="mt-2 font-display text-2xl font-bold">

                      {session?.completed_questions ||
                        0}
                      /
                      {session?.total_questions ||
                        0}

                    </p>

                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                    <p className="text-sm text-slate-500">
                      Difficulty
                    </p>

                    <p className="mt-2 font-display text-2xl font-bold">
                      {session?.difficulty}
                    </p>

                  </div>

                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                  <Link
                    to="/dashboard"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-6 py-4 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                  >

                    <ArrowLeft size={18} />

                    Dashboard

                  </Link>

                  <Link
                    to="/interview-history"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
                  >

                    <BarChart3 size={18} />

                    Review History

                  </Link>

                </div>

              </div>

            </div>
          )}

      </main>

    </div>
  );
}

/* =========================================================
   SMALL ICON COMPONENT
========================================================= */

function BriefcaseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        width="20"
        height="14"
        x="2"
        y="7"
        rx="2"
      />

      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />

      <path d="M2 12h20" />
    </svg>
  );
}