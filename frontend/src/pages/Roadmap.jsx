import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  Sparkles,
  Target,
  Circle,
} from "lucide-react";

import api from "../api";

function Roadmap() {
  const { roadmapId } = useParams();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStep, setUpdatingStep] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/roadmap/id/${roadmapId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;

        if (!data?.success) {
          setError(
            data?.message || "Unable to load roadmap."
          );
          return;
        }

        setRoadmap(data?.roadmap || null);
        setSteps(data?.steps || []);
      } catch (err) {
        console.error("Roadmap loading error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("hirelens_token");
          localStorage.removeItem("hirelens_user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load roadmap."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [roadmapId, navigate]);

  const updateStepStatus = async (stepId, status) => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setUpdatingStep(stepId);

      await api.put(
        `/roadmap/step/${stepId}`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await api.get(
        `/roadmap/id/${roadmapId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (data?.success) {
        setRoadmap(data?.roadmap || null);
        setSteps(data?.steps || []);
      }
    } catch (err) {
      console.error(
        "Roadmap step update error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update roadmap step."
      );
    } finally {
      setUpdatingStep(null);
    }
  };

  const completedSteps = steps.filter(
    (step) => step.status === "Completed"
  ).length;

  const totalSteps = steps.length;

  const progress =
    roadmap?.progress !== undefined
      ? Number(roadmap.progress)
      : totalSteps > 0
        ? Math.round(
            (completedSteps / totalSteps) * 100
          )
        : 0;

  const getStepIcon = (status) => {
    if (status === "Completed") {
      return (
        <CheckCircle2
          size={19}
          className="text-emerald-300"
        />
      );
    }

    if (status === "In Progress") {
      return (
        <Clock3
          size={19}
          className="text-indigo-300"
        />
      );
    }

    return (
      <Circle
        size={19}
        className="text-slate-500"
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={42}
            className="animate-spin text-indigo-400 mx-auto mb-5"
          />

          <p className="text-slate-300 font-medium">
            Loading your learning roadmap...
          </p>

          <p className="text-slate-500 text-sm mt-2">
            HireLens is preparing your personalized path.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <Target
              size={28}
              className="text-red-400"
            />
          </div>

          <h1 className="text-2xl font-display font-bold mb-3">
            Roadmap unavailable
          </h1>

          <p className="text-slate-400 leading-6 mb-7">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* TOP BAR */}
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 lg:px-10">
        <Link
          to="/career-progress"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={18} />
          Back to Career Progress
        </Link>

        <Link
          to="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles size={19} />
          </div>

          <span className="font-display font-bold text-lg">
            HireLens
          </span>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        {/* HERO */}
        <section className="mb-8">
          <div className="flex items-center gap-2 text-sm text-indigo-300 font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={16} />
            Personalized Learning Roadmap
          </div>

          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {roadmap?.title ||
              `${roadmap?.target_role || "Career"} Learning Roadmap`}
          </h1>

          <p className="text-slate-400 text-lg leading-7 max-w-3xl">
            {roadmap?.description ||
              "A structured learning path designed to help you close your skill gap and become more prepared for your target role."}
          </p>
        </section>

        {/* PROGRESS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-500 mb-1">
                  Overall progress
                </p>

                <div className="text-4xl font-display font-bold">
                  {Math.round(progress)}%
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                {progress >= 100
                  ? "Completed"
                  : completedSteps > 0
                    ? "In Progress"
                    : "Not Started"}
              </div>
            </div>

            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, progress)
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <span>
                {completedSteps} of {totalSteps} steps completed
              </span>

              <span>
                {Math.max(
                  0,
                  totalSteps - completedSteps
                )}{" "}
                remaining
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
              <Target
                size={20}
                className="text-indigo-300"
              />
            </div>

            <p className="text-sm text-slate-500 mb-2">
              Target role
            </p>

            <h2 className="font-display text-xl font-bold">
              {roadmap?.target_role ||
                "Target Role"}
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {totalSteps} learning milestones
            </p>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-6 lg:px-7 py-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <BookOpen
                  size={21}
                  className="text-indigo-300"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-1">
                  Step-by-step path
                </p>

                <h2 className="font-display text-xl font-bold">
                  Build the missing skills
                </h2>
              </div>
            </div>
          </div>

          {steps.length === 0 ? (
            <div className="py-20 px-6 text-center">
              <BookOpen
                size={52}
                className="text-slate-600 mx-auto mb-5"
              />

              <h3 className="text-xl font-bold mb-2">
                No roadmap steps yet
              </h3>

              <p className="text-slate-500">
                There are currently no learning steps available for this roadmap.
              </p>
            </div>
          ) : (
            <div className="p-6 lg:p-7 space-y-4">
              {steps.map((step, index) => {
                const isCompleted =
                  step.status === "Completed";

                const isUpdating =
                  updatingStep === step.step_id;

                return (
                  <div
                    key={step.step_id}
                    className={`relative rounded-2xl border p-5 lg:p-6 transition ${
                      isCompleted
                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                        : "border-white/10 bg-slate-950/40"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                      {/* NUMBER */}
                      <div
                        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center border font-semibold ${
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-lg">
                            {step.title ||
                              step.step_title ||
                              `Step ${index + 1}`}
                          </h3>

                          {step.skill_name && (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                              {step.skill_name}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-400 leading-6">
                          {step.description ||
                            `Learn and practice ${
                              step.title ||
                              "this skill"
                            }.`}
                        </p>

                        <div className="flex items-center gap-5 mt-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Clock3 size={14} />
                            {step.estimated_hours ??
                              4}{" "}
                            hours
                          </span>

                          <span className="flex items-center gap-1.5">
                            {getStepIcon(step.status)}
                            {step.status ||
                              "Not Started"}
                          </span>
                        </div>
                      </div>

                      {/* ACTION */}
                      <div className="shrink-0">
                        {step.status ===
                        "Completed" ? (
                          <button
                            onClick={() =>
                              updateStepStatus(
                                step.step_id,
                                "Not Started"
                              )
                            }
                            disabled={isUpdating}
                            className="w-full lg:w-auto px-5 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 transition font-semibold text-sm disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <span className="flex items-center gap-2">
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                                Updating...
                              </span>
                            ) : (
                              "Completed"
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              updateStepStatus(
                                step.step_id,
                                "Completed"
                              )
                            }
                            disabled={isUpdating}
                            className="w-full lg:w-auto px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold text-sm disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <span className="flex items-center gap-2">
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                                Updating...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                Mark complete
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Roadmap;