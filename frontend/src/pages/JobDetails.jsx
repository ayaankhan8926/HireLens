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
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  Target,
  BookOpen,
  FileText,
  AlertCircle,
  MessageSquare,
  Send,
  Loader2,
  ClipboardCheck,
} from "lucide-react";

import api from "../api";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const cameFromApplications =
    location.state?.fromApplications === true;

  const backPath = cameFromApplications
    ? "/applications"
    : "/jobs";

  const backLabel = cameFromApplications
    ? "Back to Applications"
    : "Back to Jobs";

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [application, setApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationError, setApplicationError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchJobAndApplication = async () => {
      try {
        setLoading(true);
        setApplicationLoading(true);
        setError("");
        setApplicationError("");

        const response = await api.get("/jobs/matches", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const jobs =
          response.data?.jobs ||
          response.data?.matches ||
          response.data?.data ||
          (Array.isArray(response.data)
            ? response.data
            : []);

        const selectedJob = jobs.find(
          (item) =>
            Number(item.job_id ?? item.id) ===
            Number(jobId)
        );

        if (!selectedJob) {
          setError("Job not found.");
          return;
        }

        setJob(selectedJob);

        try {
          const applicationResponse = await api.get(
            "/applications",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const applications =
            applicationResponse.data?.applications || [];

          const existingApplication =
            applications.find(
              (item) =>
                Number(item.job_id) === Number(jobId)
            );

          setApplication(
            existingApplication || null
          );
        } catch (applicationErr) {
          console.error(
            "Application status error:",
            applicationErr
          );

          if (
            applicationErr.response?.status === 401
          ) {
            localStorage.removeItem(
              "hirelens_token"
            );
            localStorage.removeItem(
              "hirelens_user"
            );

            navigate("/login");
            return;
          }

          setApplication(null);
        }
      } catch (err) {
        console.error(
          "Job details error:",
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
            "Unable to load job details."
        );
      } finally {
        setLoading(false);
        setApplicationLoading(false);
      }
    };

    fetchJobAndApplication();
  }, [jobId, navigate]);

  const handleApply = async () => {
    if (application || applying) {
      return;
    }

    try {
      setApplying(true);
      setApplicationError("");

      const token =
        localStorage.getItem("hirelens_token");

      const response = await api.post(
        "/applications",
        {
          job_id: Number(jobId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplication(
        response.data.application || null
      );
    } catch (err) {
      console.error(
        "Apply error:",
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

      if (err.response?.status === 409) {
        setApplicationError(
          "You have already applied to this job."
        );

        try {
          const token =
            localStorage.getItem(
              "hirelens_token"
            );

          const applicationResponse =
            await api.get(
              "/applications",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          const applications =
            applicationResponse.data
              ?.applications || [];

          const existingApplication =
            applications.find(
              (item) =>
                Number(item.job_id) ===
                Number(jobId)
            );

          if (existingApplication) {
            setApplication(
              existingApplication
            );
          }
        } catch (refreshError) {
          console.error(
            "Unable to refresh application:",
            refreshError
          );
        }

        return;
      }

      setApplicationError(
        err.response?.data?.message ||
          "Unable to submit your application. Please try again."
      );
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-300">
            Loading job details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>

          <h1 className="text-xl font-semibold mb-2">
            Job unavailable
          </h1>

          <p className="text-slate-400 mb-6">
            {error ||
              "Unable to find this job."}
          </p>

          <Link
            to={backPath}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const requiredSkills =
    job.required_skills || [];

  const matchedSkills =
    job.matched_skills || [];

  const missingSkills =
    job.missing_skills || [];

  const matchScore = Number(
    job.match_score ??
      job.match_percentage ??
      job.match_percent ??
      0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <Link
            to={backPath}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            <span className="font-display text-lg font-bold">
              HireLens
            </span>
          </Link>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Job Hero */}
        <section className="bg-gradient-to-br from-indigo-500/10 via-slate-900 to-purple-500/10 border border-white/10 rounded-3xl p-8 mb-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <div className="flex items-center gap-3 mb-5">

                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <BriefcaseBusiness className="w-7 h-7 text-indigo-400" />
                </div>

                <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
                  AI Job Analysis
                </span>

              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
                {job.title}
              </h1>

              <p className="text-xl text-slate-300 mt-3">
                {job.company_name}
              </p>

              <div className="flex flex-wrap items-center gap-5 mt-5 text-slate-400">

                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                )}

                {job.job_type && (
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4" />
                    {job.job_type}
                  </div>
                )}

              </div>

            </div>

            {/* Match score */}
            <div className="min-w-[190px] rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-6">

              <p className="text-sm font-medium text-emerald-400 uppercase tracking-wider">
                Match Score
              </p>

              <p className="text-5xl font-display font-bold text-emerald-400 mt-1">
                {matchScore}%
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Based on your current skills
              </p>

            </div>

          </div>

        </section>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_375px] gap-6">

          {/* Left */}
          <div className="space-y-6">

            {/* Match breakdown */}
            <section className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden">

              <div className="p-6 border-b border-white/10">

                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Match Breakdown
                </p>

                <h2 className="text-xl font-semibold mt-1">
                  Why this job matches you
                </h2>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">

                <div className="rounded-2xl bg-slate-950 border border-white/5 p-5">

                  <p className="text-3xl font-bold">
                    {requiredSkills.length}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Required skills
                  </p>

                </div>

                <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-5">

                  <p className="text-3xl font-bold text-emerald-400">
                    {matchedSkills.length}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Skills matched
                  </p>

                </div>

                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-5">

                  <p className="text-3xl font-bold text-amber-400">
                    {missingSkills.length}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Skills to improve
                  </p>

                </div>

              </div>

            </section>

            {/* Matched skills */}
            <section className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Strong Areas
                  </p>

                  <h2 className="text-xl font-semibold">
                    Skills you already have
                  </h2>

                </div>

              </div>

              {matchedSkills.length > 0 ? (

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {matchedSkills.map(
                    (skill, index) => (
                      <div
                        key={`${skill}-${index}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                      >

                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                        <span className="text-emerald-300">
                          {skill}
                        </span>

                      </div>
                    )
                  )}

                </div>

              ) : (

                <p className="text-slate-500">
                  No matching skills found.
                </p>

              )}

            </section>

            {/* Missing skills */}
            <section className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Skill Gap
                  </p>

                  <h2 className="text-xl font-semibold">
                    Skills you should improve
                  </h2>

                </div>

              </div>

              {missingSkills.length > 0 ? (

                <div className="space-y-3">

                  {missingSkills.map(
                    (skill, index) => (
                      <div
                        key={`${skill}-${index}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/10"
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Target className="w-4 h-4 text-amber-400" />
                          </div>

                          <div>

                            <p className="font-medium text-amber-300">
                              {skill}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              Required for this role
                            </p>

                          </div>

                        </div>

                        <ArrowRight className="w-4 h-4 text-slate-600" />

                      </div>
                    )
                  )}

                </div>

              ) : (

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">

                  <p className="text-emerald-300">
                    You currently match all required skills.
                  </p>

                </div>

              )}

            </section>

            {/* Job description */}
            <section className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Opportunity
              </p>

              <h2 className="text-xl font-semibold mt-1 mb-5">
                Job description
              </h2>

              <p className="text-slate-400 leading-7">
                {job.description ||
                  "No job description is available for this position."}
              </p>

            </section>

          </div>

          {/* Right */}
          <aside className="space-y-6">

            {/* Career readiness */}
            <section className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Career Readiness
              </p>

              <h2 className="text-xl font-semibold mt-1">
                Your position
              </h2>

              <div className="mt-8">

                <div className="flex items-center justify-between mb-3">

                  <span className="text-sm text-slate-500">
                    Skill coverage
                  </span>

                  <span className="text-2xl font-bold">
                    {matchScore}%
                  </span>

                </div>

                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        matchScore,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

              <div className="space-y-3 mt-7">

                <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-950 border border-white/5">

                  <span className="text-sm text-slate-500">
                    Required skills
                  </span>

                  <span className="font-semibold">
                    {requiredSkills.length}
                  </span>

                </div>

                <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-950 border border-white/5">

                  <span className="text-sm text-slate-500">
                    Matched skills
                  </span>

                  <span className="font-semibold">
                    {matchedSkills.length}
                  </span>

                </div>

                <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-950 border border-white/5">

                  <span className="text-sm text-slate-500">
                    Missing skills
                  </span>

                  <span className="font-semibold">
                    {missingSkills.length}
                  </span>

                </div>

              </div>

            </section>

            {/* Application */}
            <section className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-indigo-500/10 border border-emerald-500/20 rounded-3xl p-6">

              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">

                {application ? (
                  <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Send className="w-5 h-5 text-emerald-400" />
                )}

              </div>

              <h2 className="text-xl font-semibold">

                {application
                  ? "Application tracked"
                  : "Ready to apply?"}

              </h2>

              <p className="text-sm text-slate-400 leading-6 mt-2 mb-5">

                {application
                  ? `Your application is currently marked as ${application.status}.`
                  : "Apply to this opportunity and track your progress directly inside HireLens."}

              </p>

              {applicationError && (

                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">

                  <p className="text-sm text-red-300">
                    {applicationError}
                  </p>

                </div>

              )}

              {applicationLoading ? (

                <div className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 text-slate-400">

                  <Loader2 className="w-4 h-4 animate-spin" />

                  Checking application...

                </div>

              ) : application ? (

                <>

                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-3">

                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />

                    <div>

                      <p className="text-sm font-semibold text-emerald-300">
                        {application.status}
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Application successfully tracked
                      </p>

                    </div>

                  </div>

                  <Link
                    to="/applications"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition font-semibold text-slate-950"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    View My Applications
                  </Link>

                </>

              ) : (

                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed transition font-semibold text-slate-950"
                >

                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Apply Now
                    </>
                  )}

                </button>

              )}

            </section>

            {/* Career actions */}
            <section className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6">

              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>

              <h2 className="text-xl font-semibold">
                Improve your chances
              </h2>

              <p className="text-sm text-slate-400 leading-6 mt-2 mb-6">
                Use HireLens AI tools to prepare specifically
                for this job opportunity.
              </p>

              {/* AI Interview */}
              <Link
                to={`/interview/${jobId}`}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 transition font-semibold mb-3 shadow-lg shadow-indigo-500/10"
              >
                <MessageSquare className="w-4 h-4" />
                Start AI Interview
              </Link>

              {/* Improve Resume */}
              <Link
                to={`/resume-improvement/${jobId}`}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold mb-3"
              >
                <FileText className="w-4 h-4" />
                Improve My Resume
              </Link>

              {/* Skill Gap */}
              <Link
                to={`/skill-gap/${jobId}`}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 transition font-medium mb-3"
              >
                <Target className="w-4 h-4" />
                Analyze Skill Gap
              </Link>

              {/* Roadmap */}
              <Link
                to={`/roadmap/${jobId}`}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 transition font-medium"
              >
                <BookOpen className="w-4 h-4" />
                Learning Roadmap
              </Link>

            </section>

            {/* Back */}
            <Link
              to={backPath}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Link>

          </aside>

        </div>

      </main>

    </div>
  );
}