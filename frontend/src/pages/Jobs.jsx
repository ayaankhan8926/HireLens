import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const jobsFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScore, setSelectedScore] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  useEffect(() => {
  const token = localStorage.getItem("hirelens_token");

  if (!token) {
    navigate("/login");
    return;
  }

  if (jobsFetchedRef.current) {
    return;
  }

  jobsFetchedRef.current = true;

  loadJobs();
}, [navigate]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("hirelens_token");

      const response = await api.get("/jobs/matches", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setJobs(response.data.matches || []);
      } else {
        setError(
          response.data.message || "Unable to load job matches."
        );
      }
    } catch (error) {
      console.error("Job matches error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load job matches. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const locations = useMemo(() => {
    return [...new Set(jobs.map((job) => job.location).filter(Boolean))];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        job.title?.toLowerCase().includes(search) ||
        job.company_name?.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search) ||
        job.required_skills?.some((skill) =>
          skill.toLowerCase().includes(search)
        );

      const score = Number(job.match_score || 0);

      const matchesScore =
        selectedScore === "all" ||
        (selectedScore === "80" && score >= 80) ||
        (selectedScore === "60" && score >= 60 && score < 80) ||
        (selectedScore === "40" && score >= 40 && score < 60);

      const matchesLocation =
        selectedLocation === "all" ||
        job.location === selectedLocation;

      return matchesSearch && matchesScore && matchesLocation;
    });
  }, [jobs, searchTerm, selectedScore, selectedLocation]);

  const averageMatch =
    jobs.length > 0
      ? Math.round(
          jobs.reduce(
            (total, job) => total + Number(job.match_score || 0),
            0
          ) / jobs.length
        )
      : 0;

  const strongMatches = jobs.filter(
    (job) => Number(job.match_score) >= 80
  ).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedScore("all");
    setSelectedLocation("all");
  };

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
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Heading */}
        <section>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
            <Sparkles size={14} />
            AI Job Matching
          </div>

          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Jobs matched to you
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            HireLens compares your detected skills with job requirements and
            explains where you match and where you have gaps.
          </p>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<BriefcaseBusiness size={20} />}
            label="Jobs analyzed"
            value={loading ? "—" : jobs.length}
          />

          <StatCard
            icon={<Target size={20} />}
            label="Average match"
            value={loading ? "—" : `${averageMatch}%`}
          />

          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Strong matches"
            value={loading ? "—" : strongMatches}
          />
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search jobs, companies or skills..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50"
              />
            </div>

            {/* Match Score */}
            <div className="relative">
              <select
                value={selectedScore}
                onChange={(event) =>
                  setSelectedScore(event.target.value)
                }
                className="appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-10 text-sm text-slate-300 outline-none focus:border-indigo-500/50"
              >
                <option value="all">All match scores</option>
                <option value="80">80%+ match</option>
                <option value="60">60–79% match</option>
                <option value="40">40–59% match</option>
              </select>

              <Filter
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {/* Location */}
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(event) =>
                  setSelectedLocation(event.target.value)
                }
                className="appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-10 text-sm text-slate-300 outline-none focus:border-indigo-500/50"
              >
                <option value="all">All locations</option>

                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>

              <MapPin
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            {(searchTerm ||
              selectedScore !== "all" ||
              selectedLocation !== "all") && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={15} />
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>

            <button
              onClick={loadJobs}
              className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs font-medium transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                Opportunities
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold">
                {loading
                  ? "Finding your matches..."
                  : `${filteredJobs.length} matching opportunities`}
              </h2>
            </div>

            {!loading && (
              <p className="hidden text-sm text-slate-600 sm:block">
                Sorted by match score
              </p>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                <Sparkles
                  size={22}
                  className="animate-pulse text-indigo-400"
                />
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Analyzing your skills against available jobs...
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-500">
                <Search size={22} />
              </div>

              <h3 className="mt-4 font-semibold">
                No matching jobs found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try changing your search or filters.
              </p>

              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  onClick={() =>
                    navigate(`/jobs/${job.job_id}`)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <p className="mt-4 text-sm text-slate-500">{label}</p>

      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function JobCard({ job, onClick }) {
  const score = Number(job.match_score || 0);

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400/20 hover:bg-white/[0.04] sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Company Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <BriefcaseBusiness size={21} />
        </div>

        {/* Main Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <h3 className="font-display text-xl font-semibold transition group-hover:text-indigo-300">
                {job.title}
              </h3>

              <p className="mt-1 text-sm font-medium text-slate-400">
                {job.company_name}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} />
                  {job.location}
                </span>

                {job.job_type && (
                  <>
                    <span>•</span>
                    <span>{job.job_type}</span>
                  </>
                )}
              </div>
            </div>

            {/* Match Score */}
            <div
              className={`flex h-fit items-center gap-2 rounded-full border px-3 py-1.5 ${
                score >= 80
                  ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-400"
                  : score >= 60
                    ? "border-amber-400/15 bg-amber-400/5 text-amber-400"
                    : "border-slate-400/10 bg-slate-400/5 text-slate-400"
              }`}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  score >= 80
                    ? "bg-emerald-400"
                    : score >= 60
                      ? "bg-amber-400"
                      : "bg-slate-500"
                }`}
              />

              <span className="text-sm font-semibold">
                {Math.round(score)}% match
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            {job.description}
          </p>

          {/* Skills */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-600">
              Your matched skills
            </p>

            <div className="flex flex-wrap gap-2">
              {job.matched_skills?.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/10 bg-emerald-400/5 px-2.5 py-1.5 text-xs text-emerald-300"
                >
                  <CheckCircle2 size={12} />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {job.missing_skills?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-600">
                Skills to improve
              </p>

              <div className="flex flex-wrap gap-2">
                {job.missing_skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-amber-400/10 bg-amber-400/5 px-2.5 py-1.5 text-xs text-amber-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="hidden shrink-0 self-center text-slate-700 transition group-hover:translate-x-1 group-hover:text-indigo-400 lg:block">
          <ChevronRight size={22} />
        </div>
      </div>
    </article>
  );
}

export default Jobs;