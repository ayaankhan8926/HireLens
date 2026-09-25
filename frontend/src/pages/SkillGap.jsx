import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Target,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Brain,
  TrendingUp,
  Loader2,
} from "lucide-react";

import api from "../api";

function SkillGap() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSkillGap = async () => {
      try {
        const token = localStorage.getItem("hirelens_token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await api.get(`/skill-gap/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setData(response.data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Unable to load skill gap analysis."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSkillGap();
  }, [jobId, navigate]);

  const generateRoadmap = async () => {
    try {
      const token = localStorage.getItem("hirelens_token");

      if (!token) {
        navigate("/login");
        return;
      }

      setGeneratingRoadmap(true);
      setError("");

      const response = await api.get(`/roadmap/job/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const roadmapId =
        response.data?.roadmap?.roadmap_id;

      if (!roadmapId) {
        throw new Error(
          "Roadmap ID was not returned by the server."
        );
      }

      navigate(`/roadmap/${roadmapId}`);
    } catch (err) {
      console.error("Roadmap generation error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to generate learning roadmap."
      );
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing your skill gap...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-amber-400" />

          <h1 className="text-2xl font-display font-bold mb-2">
            Something went wrong
          </h1>

          <p className="text-slate-400 mb-6">
            {error}
          </p>

          <button
            onClick={() => navigate("/jobs")}
            className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const job = data?.job || {};

  // Backend returns the analysis inside data.skill_gap
  const skillGap = data?.skill_gap || {};

  const matchedSkills = skillGap?.matched_skills || [];
  const missingSkills = skillGap?.missing_skills || [];

  const requiredSkills = data?.required_skills || [];

  const gapPercentage =
    skillGap?.gap_percentage ??
    (requiredSkills.length > 0
      ? Math.round(
          (missingSkills.length / requiredSkills.length) * 100
        )
      : 0);

  const readiness = Math.max(0, 100 - gapPercentage);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#020617]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>

            <span className="font-display font-bold text-lg">
              Hire<span className="text-indigo-400">Lens</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Error banner */}
        {error && data && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Hero */}
        <section className="mb-8">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            AI Skill Gap Analysis
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-3">
            {job.title || "Target Role"}
          </h1>

          <p className="text-slate-400 text-lg">
            Understand exactly what you already know and what you
            need to learn for this role.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          {/* Readiness */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1120] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-500">
                  Career readiness
                </p>

                <p className="text-4xl font-display font-bold mt-1">
                  {readiness}%
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
            </div>

            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                style={{ width: `${readiness}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Based on your current skill coverage
            </p>
          </div>

          {/* Matched */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">
                  Skills you already have
                </p>

                <p className="text-4xl font-display font-bold mt-1 text-emerald-400">
                  {matchedSkills.length}
                </p>
              </div>

              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <p className="text-sm text-slate-500">
              of {requiredSkills.length} required skills
            </p>
          </div>

          {/* Missing */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">
                  Skills to develop
                </p>

                <p className="text-4xl font-display font-bold mt-1 text-amber-400">
                  {missingSkills.length}
                </p>
              </div>

              <Brain className="w-10 h-10 text-amber-400" />
            </div>

            <p className="text-sm text-slate-500">
              {gapPercentage}% skill gap remaining
            </p>
          </div>
        </section>

        {/* Skill comparison */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Existing */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1120] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                    Strong areas
                  </p>

                  <h2 className="text-xl font-display font-bold">
                    Skills you already have
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              {matchedSkills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchedSkills.map((skill, index) => (
                    <div
                      key={`${skill}-${index}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />

                      <span className="text-sm font-medium">
                        {skill}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  No matched skills found.
                </p>
              )}
            </div>
          </div>

          {/* Missing */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1120] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                    Skill gap
                  </p>

                  <h2 className="text-xl font-display font-bold">
                    Skills you should improve
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              {missingSkills.length > 0 ? (
                <div className="space-y-3">
                  {missingSkills.map((skill, index) => (
                    <div
                      key={`${skill}-${index}`}
                      className="flex items-center justify-between px-4 py-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Target className="w-4 h-4 text-amber-400" />
                        </div>

                        <div>
                          <p className="font-semibold">
                            {skill}
                          </p>

                          <p className="text-xs text-slate-500 mt-0.5">
                            Required for this role
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-amber-400">
                        Improve
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3" />

                  <p className="font-semibold">
                    No skill gaps detected
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    You currently match all required skills.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Required skills */}
        <section className="rounded-2xl border border-white/10 bg-[#0b1120] p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                Role requirements
              </p>

              <h2 className="text-xl font-display font-bold">
                Required skills for {job.title || "this role"}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {requiredSkills.map((skill, index) => {
              const isMatched = matchedSkills.includes(skill);

              return (
                <div
                  key={`${skill}-${index}`}
                  className={`px-4 py-2.5 rounded-full border text-sm font-medium ${
                    isMatched
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {isMatched ? "✓ " : "○ "}
                  {skill}
                </div>
              );
            })}
          </div>
        </section>

        {/* Roadmap CTA */}
        {missingSkills.length > 0 && (
          <section className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.10] to-violet-500/[0.05] p-7">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-indigo-400 mb-3">
                  <Sparkles className="w-5 h-5" />

                  <span className="text-sm font-semibold uppercase tracking-wider">
                    Personalized next step
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                  Turn your skill gap into a learning roadmap
                </h2>

                <p className="text-slate-400 leading-relaxed">
                  HireLens can create a structured learning path based
                  on the skills you're missing for this specific role.
                </p>
              </div>

              <button
                onClick={generateRoadmap}
                disabled={generatingRoadmap}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generatingRoadmap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating roadmap...
                  </>
                ) : (
                  <>
                    Generate learning roadmap
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* No skill gap */}
        {missingSkills.length === 0 && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-7">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-xl font-display font-bold">
                  You're ready for this role
                </h2>

                <p className="text-slate-400 mt-1">
                  Your current skills cover all the required skills
                  for this position.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default SkillGap;