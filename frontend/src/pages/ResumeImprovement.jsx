import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Code2,
  BookOpen,
  Download,
  Loader2,
} from "lucide-react";

import api from "../api";

export default function ResumeImprovement() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
const fetchedJobRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchImprovement = async () => {
if (fetchedJobRef.current === String(jobId)) {
  return;
}

fetchedJobRef.current = String(jobId);
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/resume-improvement/job/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(response.data);
      } catch (err) {
        console.error("Resume improvement error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load resume improvement analysis."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchImprovement();
  }, [jobId, navigate]);

  // --------------------------------------------------
  // Download improved resume PDF
  // --------------------------------------------------

  const handleDownloadPdf = async () => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDownloadingPdf(true);
      setPdfError("");

      const response = await api.get(
        `/resume-pdf/job/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      // ------------------------------------------------
      // Create downloadable PDF blob
      // ------------------------------------------------

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;

      // ------------------------------------------------
      // Try to get filename from server
      // ------------------------------------------------

      const contentDisposition =
        response.headers[
          "content-disposition"
        ];

      let filename =
        "HireLens_Improved_Resume.pdf";

      if (contentDisposition) {
        const filenameMatch =
          contentDisposition.match(
            /filename="?([^"]+)"?/i
          );

        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute(
        "download",
        filename
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        downloadUrl
      );

    } catch (err) {
      console.error(
        "Resume PDF download error:",
        err
      );

      setPdfError(
        "Unable to generate the improved resume PDF. Please try again."
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-300">
            Analyzing your resume...
          </p>

          <p className="text-sm text-slate-500 mt-2">
            Comparing your profile with the target job
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>

          <h1 className="text-xl font-semibold mb-2">
            Analysis unavailable
          </h1>

          <p className="text-slate-400 mb-6">
            {error}
          </p>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const job = data?.job || {};
  const analysis = data?.analysis || {};

  const summary = analysis.summary || {};

  const matchedSkills =
    analysis.matched_skills || [];

  const missingSkills =
    analysis.missing_skills || [];

  const missingKeywords =
    analysis.missing_keywords || [];

  const improvementPriority =
    analysis.improvement_priority || [];

  const skillsToHighlight =
    analysis.skills_to_highlight || [];

  const projectSuggestions =
    analysis.project_suggestions || [];

  const experienceSuggestions =
    analysis.experience_suggestions || [];

  const generalSuggestions =
    analysis.general_suggestions || [];

  const resumeQuality =
    analysis.resume_quality || {};

  const matchPercentage =
    summary.skill_match_percentage ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}

      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <Link
            to="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="font-display text-lg font-bold">
                HireLens
              </h1>

              <p className="text-xs text-slate-500">
                Career Intelligence
              </p>
            </div>
          </Link>

          <Link
            to="/jobs"
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>

        </div>
      </header>


      {/* Main */}

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Page heading */}

        <div className="mb-8">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            AI Resume Intelligence
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Improve Your Resume
          </h1>

          <p className="text-slate-400 mt-3 max-w-3xl text-lg">
            See exactly how your current resume aligns with this
            job and what you should improve before applying.
          </p>

        </div>


        {/* Target job card */}

        <section className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-3xl p-6 md:p-8 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <div className="flex items-center gap-3 mb-3">

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
                  <BriefcaseBusiness className="w-6 h-6 text-indigo-400" />
                </div>

                <div>

                  <p className="text-sm text-indigo-300">
                    Target Position
                  </p>

                  <h2 className="text-2xl font-bold">
                    {job.title || "Target Job"}
                  </h2>

                </div>

              </div>

              <p className="text-slate-300">
                {job.company_name || "Company"}
                {job.location
                  ? ` • ${job.location}`
                  : ""}
              </p>

              {job.job_type && (
                <p className="text-sm text-slate-500 mt-1">
                  {job.job_type}
                </p>
              )}

            </div>


            <div className="text-center lg:text-right">

              <p className="text-sm text-slate-400 mb-1">
                Current Skill Match
              </p>

              <div className="text-5xl font-display font-bold text-indigo-400">
                {matchPercentage}%
              </div>

              <p className="text-sm text-slate-500 mt-1">
                {summary.matched_skills || 0} of{" "}
                {summary.required_skills || 0} skills matched
              </p>

            </div>

          </div>

        </section>


        {/* Summary cards */}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">

            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <p className="text-sm text-slate-400">
              Matched Skills
            </p>

            <p className="text-3xl font-bold mt-1">
              {summary.matched_skills || 0}
            </p>

          </div>


          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">

            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-red-400" />
            </div>

            <p className="text-sm text-slate-400">
              Missing Skills
            </p>

            <p className="text-3xl font-bold mt-1">
              {summary.missing_skills || 0}
            </p>

          </div>


          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">

            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>

            <p className="text-sm text-slate-400">
              Missing Keywords
            </p>

            <p className="text-3xl font-bold mt-1">
              {summary.missing_keywords || 0}
            </p>

          </div>


          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">

            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>

            <p className="text-sm text-slate-400">
              Resume Focus
            </p>

            <p className="text-3xl font-bold mt-1">
              {matchPercentage}%
            </p>

          </div>

        </section>


        {/* Skills */}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Matched */}

          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  Skills You Already Have
                </h2>

                <p className="text-sm text-slate-500">
                  Highlight these clearly in your resume
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              {matchedSkills.length > 0 ? (

                matchedSkills.map((skill, index) => (

                  <span
                    key={`${skill}-${index}`}
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm"
                  >
                    {skill}
                  </span>

                ))

              ) : (

                <p className="text-slate-500">
                  No matching skills detected yet.
                </p>

              )}

            </div>

          </div>


          {/* Missing */}

          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  Skills to Improve
                </h2>

                <p className="text-sm text-slate-500">
                  These skills are required for the role
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              {missingSkills.length > 0 ? (

                missingSkills.map((skill, index) => (

                  <span
                    key={`${skill}-${index}`}
                    className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                  >
                    {skill}
                  </span>

                ))

              ) : (

                <p className="text-emerald-400">
                  Great! No missing skills detected.
                </p>

              )}

            </div>

          </div>

        </section>


        {/* Missing keywords */}

        {missingKeywords.length > 0 && (

          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 mb-8">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  Missing Resume Keywords
                </h2>

                <p className="text-sm text-slate-500">
                  Important terms that are not currently visible
                  in your resume
                </p>

              </div>

            </div>

            <div className="space-y-3">

              {missingKeywords.map((item, index) => (

                <div
                  key={index}
                  className="p-4 rounded-2xl bg-slate-950 border border-white/5"
                >

                  <div className="flex items-center justify-between gap-4">

                    <span className="font-medium text-amber-300">
                      {item.keyword}
                    </span>

                    <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300">
                      Missing
                    </span>

                  </div>

                  {item.reason && (
                    <p className="text-sm text-slate-400 mt-2">
                      {item.reason}
                    </p>
                  )}

                </div>

              ))}

            </div>

          </section>

        )}


        {/* Improvement priority */}

        {improvementPriority.length > 0 && (

          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 mb-8">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  Improvement Priority
                </h2>

                <p className="text-sm text-slate-500">
                  Focus on these areas first
                </p>

              </div>

            </div>

            <div className="space-y-3">

              {improvementPriority.map((item, index) => (

                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-white/5"
                >

                  <div>

                    <p className="font-medium capitalize">
                      {item.skill}
                    </p>

                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      item.priority === "High"
                        ? "bg-red-500/10 text-red-300"
                        : item.priority === "Medium"
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {item.priority}
                  </span>

                </div>

              ))}

            </div>

          </section>

        )}


        {/* Skills to highlight */}

        {skillsToHighlight.length > 0 && (

          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 mb-8">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-cyan-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  Skills to Highlight
                </h2>

                <p className="text-sm text-slate-500">
                  Make these skills easy for recruiters to find
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              {skillsToHighlight.map((skill, index) => (

                <span
                  key={`${skill}-${index}`}
                  className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm"
                >
                  {skill}
                </span>

              ))}

            </div>

          </section>

        )}


        {/* Project suggestions */}

        {projectSuggestions.length > 0 && (

          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 mb-8">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-purple-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  Project Improvements
                </h2>

                <p className="text-sm text-slate-500">
                  Projects that can strengthen your profile
                </p>

              </div>

            </div>

            <div className="space-y-4">

              {projectSuggestions.map((item, index) => (

                <div
                  key={index}
                  className="p-5 rounded-2xl bg-slate-950 border border-white/5"
                >

                  <p className="font-medium text-purple-300 capitalize mb-2">
                    {item.skill}
                  </p>

                  <p className="text-sm text-slate-400 leading-6">
                    {item.suggestion}
                  </p>

                </div>

              ))}

            </div>

          </section>

        )}


        {/* Experience suggestions */}

        {experienceSuggestions.length > 0 && (

          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 mb-8">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BriefcaseBusiness className="w-5 h-5 text-blue-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  Experience Improvements
                </h2>

                <p className="text-sm text-slate-500">
                  Ways to demonstrate the missing capabilities
                </p>

              </div>

            </div>

            <div className="space-y-4">

              {experienceSuggestions.map((item, index) => (

                <div
                  key={index}
                  className="p-5 rounded-2xl bg-slate-950 border border-white/5"
                >

                  <p className="font-medium text-blue-300 capitalize mb-2">
                    {item.skill}
                  </p>

                  <p className="text-sm text-slate-400 leading-6">
                    {item.suggestion}
                  </p>

                </div>

              ))}

            </div>

          </section>

        )}


        {/* General suggestions */}

        {generalSuggestions.length > 0 && (

          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 mb-8">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
              </div>

              <div>

                <h2 className="text-lg font-semibold">
                  General Resume Suggestions
                </h2>

                <p className="text-sm text-slate-500">
                  Improvements that can make your resume stronger
                </p>

              </div>

            </div>

            <div className="space-y-3">

              {generalSuggestions.map(
                (suggestion, index) => (

                  <div
                    key={index}
                    className="flex gap-3 p-4 rounded-2xl bg-slate-950 border border-white/5"
                  >

                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />

                    <p className="text-sm text-slate-300 leading-6">
                      {suggestion}
                    </p>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        {/* Resume quality */}

        <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 mb-8">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>

            <div>

              <h2 className="text-lg font-semibold">
                Resume Quality Checklist
              </h2>

              <p className="text-sm text-slate-500">
                Important resume sections detected by HireLens
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

            {[
              ["Resume Text", resumeQuality.has_resume_text],
              ["Education", resumeQuality.has_education],
              ["Experience", resumeQuality.has_experience],
              ["Projects", resumeQuality.has_projects],
              ["Certifications", resumeQuality.has_certifications],
            ].map(([label, completed]) => (

              <div
                key={label}
                className={`p-4 rounded-2xl border ${
                  completed
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-slate-950 border-white/5"
                }`}
              >

                <div className="flex items-center gap-2">

                  <CheckCircle2
                    className={`w-5 h-5 ${
                      completed
                        ? "text-emerald-400"
                        : "text-slate-600"
                    }`}
                  />

                  <span
                    className={`text-sm ${
                      completed
                        ? "text-emerald-300"
                        : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span>

                </div>

              </div>

            ))}

          </div>

        </section>


        {/* PDF error */}

        {pdfError && (

          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {pdfError}
          </div>

        )}


        {/* Bottom actions */}

        <section className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 rounded-3xl p-6 md:p-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <h2 className="font-display text-2xl font-bold">
                Ready to improve your career profile?
              </h2>

              <p className="text-slate-400 mt-2 max-w-2xl">
                Download an improved, job-focused resume or use
                your skill gaps to build a personalized learning plan.
              </p>

            </div>


            <div className="flex flex-wrap gap-3">

              {/* PDF DOWNLOAD */}

              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl transition font-medium ${
                  downloadingPdf
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 text-white"
                }`}
              >

                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Improved Resume
                  </>
                )}

              </button>


              {/* SKILL GAP */}

              <Link
                to={`/skill-gap/${jobId}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 transition font-medium"
              >
                <Target className="w-4 h-4" />
                View Skill Gap
              </Link>


              {/* ROADMAP */}

              <Link
                to={`/roadmap/${jobId}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium"
              >
                <BookOpen className="w-4 h-4" />
                Build Learning Roadmap
              </Link>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}