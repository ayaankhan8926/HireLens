import {
  Award,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
  Upload,
  UserRound,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function ResumeAnalysis() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    loadLatestResume();
  }, [navigate]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("hirelens_token")}`,
  });

  const loadLatestResume = async () => {
    setLoadingExisting(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const fileName = file.name.toLowerCase();

    const validExtension =
      fileName.endsWith(".pdf") || fileName.endsWith(".docx");

    if (!validExtension || !allowedTypes.includes(file.type)) {
      setError("Please upload a PDF or DOCX resume.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select your resume first.");
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("resume", selectedFile);

      const response = await api.post("/resume/upload", formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data.success) {
        setError(response.data.message || "Resume upload failed.");
        return;
      }

      const uploadedResumeId = response.data.resume_id;

      setResumeId(uploadedResumeId);

      setSuccess(
        "Resume uploaded successfully. Starting AI analysis..."
      );

      await analyzeResume(uploadedResumeId);
    } catch (error) {
      console.error("Resume upload error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to upload your resume. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const analyzeResume = async (id = resumeId) => {
    if (!id) {
      setError("Resume ID is missing.");
      return;
    }

    setError("");
    setAnalyzing(true);

    try {
      const response = await api.get(`/resume/${id}/analyze`, {
        headers: getAuthHeaders(),
      });

      if (!response.data.success) {
        setError(response.data.message || "Resume analysis failed.");
        return;
      }

      setAnalysis(response.data);
      setSuccess("Resume analyzed successfully.");
    } catch (error) {
      console.error("Resume analysis error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to analyze your resume. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setResumeId(null);
    setAnalysis(null);
    setError("");
    setSuccess("");
  };

  const careerProfile = analysis?.career_profile;
  const detectedSkills = analysis?.analysis?.skills || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
              <Target size={20} />
            </div>

            <span className="font-display text-xl font-bold">
              Hire<span className="text-indigo-400">Lens</span>
            </span>
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Page Heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
            <Sparkles size={14} />
            AI Resume Intelligence
          </div>

          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Resume Analysis
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Upload your resume and HireLens will extract your skills,
            education, experience, projects, certifications, and career
            profile.
          </p>
        </div>

        {/* Upload Section */}
        {!analysis && (
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <div className="mb-7">
                  <h2 className="font-display text-xl font-semibold">
                    Upload your resume
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Supported formats: PDF and DOCX
                  </p>
                </div>

                <label className="group flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 text-center transition hover:border-indigo-400/40 hover:bg-indigo-400/[0.03]">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 transition group-hover:scale-105 group-hover:bg-indigo-500/15">
                    <Upload size={28} />
                  </div>

                  <h3 className="mt-5 font-semibold">
                    Drop your resume here
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    or click to browse from your computer
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-600">
                    <FileText size={14} />
                    PDF / DOCX
                  </div>
                </label>

                {selectedFile && (
                  <div className="mt-5 flex items-center justify-between rounded-xl border border-indigo-400/10 bg-indigo-400/5 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        <FileText size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {selectedFile.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={resetUpload}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {success}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading || analyzing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3.5 font-semibold shadow-lg shadow-indigo-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploading || analyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {uploading
                        ? "Uploading resume..."
                        : "Analyzing resume..."}
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Analyze Resume with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* What we analyze */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                What we analyze
              </p>

              <h2 className="mt-2 font-display text-xl font-semibold">
                Build your career profile
              </h2>

              <div className="mt-6 space-y-4">
                <AnalysisItem
                  icon={<Target size={18} />}
                  title="Skills"
                  description="Programming, tools and technical skills"
                />

                <AnalysisItem
                  icon={<GraduationCap size={18} />}
                  title="Education"
                  description="Degrees and academic background"
                />

                <AnalysisItem
                  icon={<BriefcaseBusiness size={18} />}
                  title="Experience"
                  description="Professional and practical experience"
                />

                <AnalysisItem
                  icon={<FileText size={18} />}
                  title="Projects"
                  description="Academic and personal projects"
                />

                <AnalysisItem
                  icon={<Award size={18} />}
                  title="Certifications"
                  description="Courses and professional certifications"
                />
              </div>
            </div>
          </section>
        )}

        {/* Loading Existing State */}
        {loadingExisting && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Preparing resume analysis...
          </div>
        )}

        {/* Analysis Results */}
        {analysis && careerProfile && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>
                  <p className="font-semibold text-emerald-300">
                    Resume analysis complete
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    HireLens successfully built your initial career profile.
                  </p>
                </div>
              </div>

              <button
                onClick={resetUpload}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                Analyze another resume
              </button>
            </div>

            {/* Profile Strength */}
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Profile completeness
                    </p>

                    <p className="mt-2 font-display text-4xl font-bold">
                      {careerProfile.profile_completeness}%
                    </p>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-500/30 text-sm font-bold text-indigo-300">
                    {careerProfile.profile_completeness}
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{
                      width: `${careerProfile.profile_completeness}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <p className="text-sm text-slate-500">Skills detected</p>

                <p className="mt-2 font-display text-4xl font-bold">
                  {careerProfile.skill_count}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Technical skills extracted from your resume
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <p className="text-sm text-slate-500">Resume status</p>

                <div className="mt-3 flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={20} />
                  <span className="font-semibold">Analyzed</span>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  Your career profile is ready for job matching.
                </p>
              </div>
            </section>

            {/* Skills */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Target size={19} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    Detected skills
                  </p>

                  <h2 className="mt-1 font-display text-xl font-semibold">
                    Your technical skill set
                  </h2>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {detectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl border border-indigo-400/10 bg-indigo-400/5 px-3.5 py-2 text-sm font-medium text-indigo-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Profile Details */}
            <section className="grid gap-5 lg:grid-cols-2">
              <ProfileSection
                icon={<GraduationCap size={19} />}
                title="Education"
                content={careerProfile.education?.summary}
                emptyText="No education information detected."
              />

              <ProfileSection
                icon={<BriefcaseBusiness size={19} />}
                title="Experience"
                content={careerProfile.experience?.summary}
                emptyText="No experience information detected."
              />

              <ProfileSection
                icon={<FileText size={19} />}
                title="Projects"
                content={careerProfile.projects?.summary}
                emptyText="No project information detected."
              />

              <ProfileSection
                icon={<Award size={19} />}
                title="Certifications"
                content={careerProfile.certifications?.summary}
                emptyText="No certification information detected."
              />
            </section>

            {/* Next Step */}
            <section className="rounded-3xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Sparkles size={18} />
                    <span className="text-sm font-semibold">
                      What's next?
                    </span>
                  </div>

                  <h2 className="mt-2 font-display text-2xl font-bold">
                    Discover jobs that match your skills.
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Now that HireLens understands your profile, explore
                    opportunities and see exactly where your skills match or
                    fall short.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/jobs")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400"
                >
                  Explore job matches
                  <Target size={17} />
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function AnalysisItem({ icon, title, description }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-indigo-400">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function ProfileSection({ icon, title, content, emptyText }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          {icon}
        </div>

        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-black/10 p-4">
        {content ? (
          <p className="whitespace-pre-line text-sm leading-7 text-slate-400">
            {content}
          </p>
        ) : (
          <p className="text-sm text-slate-600">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalysis;