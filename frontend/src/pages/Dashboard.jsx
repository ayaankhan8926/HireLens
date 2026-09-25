import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

import {
  LayoutDashboard,
  FileText,
  BriefcaseBusiness,
  Target,
  Map,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Clock3,
} from "lucide-react";


function SidebarLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}


function Dashboard() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [applicationAnalytics, setApplicationAnalytics] = useState({
    total: 0,
    applied: 0,
    screening: 0,
    interviews: 0,
    offers: 0,
    rejected: 0,
    withdrawn: 0,
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [careerData, setCareerData] = useState(null);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dashboardFetchedRef = useRef(false);


  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");
    const storedUser = localStorage.getItem("hirelens_user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    if (dashboardFetchedRef.current) {
      return;
    }

    dashboardFetchedRef.current = true;

    fetchDashboardData();
  }, [navigate]);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setAnalyticsLoading(true);

      const token = localStorage.getItem("hirelens_token");

      const [
        jobsResponse,
        analyticsResponse,
        careerResponse,
        interviewResponse,
      ] = await Promise.all([
        api.get("/jobs/matches", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        api.get("/dashboard/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        api.get("/career-progress", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        api.get("/interview/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setJobs(jobsResponse.data.matches || []);

      const analytics = analyticsResponse.data;

      if (analytics?.success) {
        setApplicationAnalytics(
          analytics.applications || {
            total: 0,
            applied: 0,
            screening: 0,
            interviews: 0,
            offers: 0,
            rejected: 0,
            withdrawn: 0,
          }
        );

        setRecentApplications(
          analytics.recent_applications || []
        );
      }

      if (careerResponse.data?.success) {
        setCareerData(careerResponse.data);
      }

      if (interviewResponse.data?.success) {
        setInterviewSessions(interviewResponse.data.sessions || []);
      }

    } catch (error) {
      console.error("Dashboard data error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("hirelens_token");
        localStorage.removeItem("hirelens_user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
      setIntelligenceLoading(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("hirelens_token");
    localStorage.removeItem("hirelens_user");
    navigate("/login");
  };


  const getMatchColor = (score) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-slate-400";
  };


  const getMatchBackground = (score) => {
    if (score >= 80) return "bg-emerald-400/10";
    if (score >= 60) return "bg-amber-400/10";
    return "bg-slate-400/10";
  };


  const getApplicationStatusClass = (status) => {
    switch (status) {
      case "Applied":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";

      case "Screening":
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";

      case "Interview":
        return "bg-violet-500/10 text-violet-300 border-violet-500/20";

      case "Offer":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";

      case "Rejected":
        return "bg-red-500/10 text-red-300 border-red-500/20";

      case "Withdrawn":
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";

      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };


  const formatApplicationDate = (dateValue) => {
    if (!dateValue) {
      return "Recently";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };


  const topJobs = [...jobs]
    .sort(
      (a, b) =>
        (b.match_score || 0) -
        (a.match_score || 0)
    )
    .slice(0, 5);


  const averageMatch =
    jobs.length > 0
      ? Math.round(
          jobs.reduce(
            (total, job) =>
              total + Number(job.match_score || 0),
            0
          ) / jobs.length
        )
      : 0;


  const strongMatches = jobs.filter(
    (job) =>
      Number(job.match_score || 0) >= 70
  ).length;

  const careerReadiness = Math.round(
    Number(careerData?.career_readiness ?? 0)
  );

  const roadmapProgress = (() => {
    const roadmaps = Array.isArray(careerData?.roadmaps)
      ? careerData.roadmaps
      : [];

    const roadmapsWithSteps = roadmaps.filter(
      (roadmap) => Number(roadmap.total_steps || 0) > 0
    );

    const totalSteps = roadmapsWithSteps.reduce(
      (total, roadmap) => total + Number(roadmap.total_steps || 0),
      0
    );

    const completedSteps = roadmapsWithSteps.reduce(
      (total, roadmap) => total + Number(roadmap.completed_steps || 0),
      0
    );

    if (totalSteps > 0) {
      return Math.round((completedSteps / totalSteps) * 100);
    }

    return Math.round(Number(careerData?.roadmap_progress ?? 0));
  })();

  const roadmapCompletedSteps = Number(
    careerData?.roadmap?.completed_steps ?? 0
  );

  const roadmapTotalSteps = Number(
    careerData?.roadmap?.total_steps ?? 0
  );

  const completedInterviewSessions = interviewSessions.filter(
    (session) => session.status === "Completed"
  );

  const scoredInterviewSessions = completedInterviewSessions.filter(
    (session) => Number.isFinite(Number(session.overall_score))
  );

  const latestInterview =
    scoredInterviewSessions.length > 0
      ? [...scoredInterviewSessions].sort(
          (a, b) =>
            new Date(b.completed_at || b.started_at || 0) -
            new Date(a.completed_at || a.started_at || 0)
        )[0]
      : null;

  const latestInterviewScore = latestInterview
    ? Math.round(Number(latestInterview.overall_score))
    : null;

  const interviewAverage =
    scoredInterviewSessions.length > 0
      ? Math.round(
          scoredInterviewSessions.reduce(
            (total, session) =>
              total + Number(session.overall_score || 0),
            0
          ) / scoredInterviewSessions.length
        )
      : 0;

  const applicationPipeline =
    applicationAnalytics.screening +
    applicationAnalytics.interviews +
    applicationAnalytics.offers;


  const fullName =
    user?.full_name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "there";

  const notifications = [];

  const searchablePages = [
    { label: "Dashboard", description: "Career intelligence overview", to: "/dashboard" },
    { label: "Resume Analysis", description: "Analyze and improve your resume", to: "/resume" },
    { label: "Job Matches", description: "Find jobs matching your skills", to: "/jobs" },
    { label: "Skill Gaps", description: "See skills you need to improve", to: "/jobs" },
    { label: "Learning Roadmaps", description: "Track your personalized learning plans", to: "/roadmaps" },
    { label: "Career Progress", description: "View your career readiness", to: "/career-progress" },
    { label: "Applications", description: "Track your job applications", to: "/applications" },
    { label: "Interview History", description: "Review your interview performance", to: "/interview-history" },
    { label: "Settings", description: "Manage your profile and account", to: "/settings" },
  ];

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPages = normalizedSearch
    ? searchablePages.filter((item) =>
        `${item.label} ${item.description}`.toLowerCase().includes(normalizedSearch)
      )
    : searchablePages.slice(0, 5);

  const filteredJobs = normalizedSearch
    ? topJobs.filter((job) =>
        `${job.title || job.job_title || ""} ${job.company_name || ""} ${job.location || ""}`
          .toLowerCase()
          .includes(normalizedSearch)
      ).slice(0, 5)
    : [];

  if (applicationAnalytics.total > 0) {
    notifications.push({
      id: "applications",
      title: "Application activity",
      message: `${applicationAnalytics.total} application${applicationAnalytics.total === 1 ? "" : "s"} tracked in your pipeline.`,
      to: "/applications",
      icon: <ClipboardList size={16} />,
    });
  }

  if (latestInterview) {
    notifications.push({
      id: "interview",
      title: "Interview results ready",
      message: `Your latest interview score is ${latestInterviewScore}%.`,
      to: "/interview-history",
      icon: <Target size={16} />,
    });
  }

  if (roadmapProgress < 100) {
    notifications.push({
      id: "roadmap",
      title: "Keep your roadmap moving",
      message: `${roadmapProgress}% of your learning roadmap is complete.`,
      to: "/roadmaps",
      icon: <Map size={16} />,
    });
  }

  if (notifications.length === 0) {
    notifications.push({
      id: "welcome",
      title: "Welcome to HireLens",
      message: "Complete your profile and resume analysis to get started.",
      to: "/resume",
      icon: <Sparkles size={16} />,
    });
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="flex min-h-screen">


        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="hidden w-72 flex-col border-r border-white/10 bg-slate-950 lg:flex">

          <div className="flex h-20 items-center border-b border-white/10 px-7">

            <Link
              to="/dashboard"
              className="flex items-center gap-3"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
                <Sparkles size={20} />
              </div>

              <div>

                <h1 className="font-display text-xl font-bold">
                  Hire
                  <span className="text-indigo-400">
                    Lens
                  </span>
                </h1>

                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Career Intelligence
                </p>

              </div>

            </Link>

          </div>


          <div className="flex-1 px-4 py-6">

            <p className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Workspace
            </p>


            <nav className="space-y-1">

              <SidebarLink
                to="/dashboard"
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
              />

              <SidebarLink
                to="/resume"
                icon={<FileText size={18} />}
                label="Resume Analysis"
              />

              <SidebarLink
                to="/jobs"
                icon={<BriefcaseBusiness size={18} />}
                label="Job Matches"
              />

              <SidebarLink
                to="/jobs"
                icon={<Target size={18} />}
                label="Skill Gaps"
              />

              <SidebarLink
                to="/jobs"
                icon={<Map size={18} />}
                label="Learning Roadmap"
              />

              <SidebarLink
                to="/career-progress"
                icon={<BarChart3 size={18} />}
                label="Career Progress"
              />

              <SidebarLink
                to="/applications"
                icon={<ClipboardList size={18} />}
                label="Applications"
              />

            </nav>


            <p className="mb-3 mt-8 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Account
            </p>


            <nav className="space-y-1">

              <SidebarLink
                to="/settings"
                icon={<Settings size={18} />}
                label="Settings"
              />

            </nav>

          </div>


          <div className="border-t border-white/10 p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold text-white">
                  {fullName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email || "Candidate"}
                </p>

              </div>

            </div>


            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </aside>


        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="flex-1 overflow-hidden">


          {/* TOP BAR */}

          <header className="flex h-20 items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 backdrop-blur-xl lg:px-10">

            <div>

              <p className="text-sm text-slate-500">
                Career Intelligence
              </p>

              <h2 className="font-display text-xl font-bold text-white">
                Dashboard
              </h2>

            </div>


            <div className="flex items-center gap-3">

              <div className="relative hidden sm:block">

                <button
                  type="button"
                  onClick={() => {
                    setShowSearch((current) => !current);
                    setShowNotifications(false);
                  }}
                  aria-label="Search HireLens"
                  aria-expanded={showSearch}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <Search size={18} />
                </button>

                {showSearch && (
                  <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
                    <div className="border-b border-white/10 p-3">
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                        <Search size={17} className="shrink-0 text-slate-500" />
                        <input
                          autoFocus
                          type="text"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setShowSearch(false);
                              setSearchQuery("");
                            }
                            if (event.key === "Enter") {
                              const firstPage = filteredPages[0];
                              const firstJob = filteredJobs[0];
                              if (firstPage) {
                                navigate(firstPage.to);
                                setShowSearch(false);
                                setSearchQuery("");
                              } else if (firstJob) {
                                navigate(`/jobs/${firstJob.job_id}`);
                                setShowSearch(false);
                                setSearchQuery("");
                              }
                            }
                          }}
                          placeholder="Search jobs, pages, skills..."
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="text-xs text-slate-500 transition hover:text-white"
                            aria-label="Clear search"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto p-2">
                      {normalizedSearch && filteredPages.length > 0 && (
                        <div className="mb-2">
                          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Pages
                          </p>
                          {filteredPages.map((item) => (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => {
                                setShowSearch(false);
                                setSearchQuery("");
                              }}
                              className="block rounded-xl px-3 py-3 transition hover:bg-white/[0.05]"
                            >
                              <p className="text-sm font-semibold text-white">{item.label}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                            </Link>
                          ))}
                        </div>
                      )}

                      {normalizedSearch && filteredJobs.length > 0 && (
                        <div>
                          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Jobs
                          </p>
                          {filteredJobs.map((job) => (
                            <Link
                              key={job.job_id}
                              to={`/jobs/${job.job_id}`}
                              onClick={() => {
                                setShowSearch(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.05]"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-300">
                                {(job.company_name || "C").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                  {job.title || job.job_title}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {job.company_name || "Company"}
                                  {job.location ? ` • ${job.location}` : ""}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {!normalizedSearch && (
                        <div>
                          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            Quick access
                          </p>
                          {filteredPages.map((item) => (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => setShowSearch(false)}
                              className="block rounded-xl px-3 py-3 transition hover:bg-white/[0.05]"
                            >
                              <p className="text-sm font-semibold text-white">{item.label}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                            </Link>
                          ))}
                        </div>
                      )}

                      {normalizedSearch && filteredPages.length === 0 && filteredJobs.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <Search size={24} className="mx-auto mb-2 text-slate-600" />
                          <p className="text-sm font-medium text-slate-400">No results found</p>
                          <p className="mt-1 text-xs text-slate-600">Try a job title, company, or feature name.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>


              <div className="relative">

                <button
                  type="button"
                  onClick={() => setShowNotifications((current) => !current)}
                  aria-label="Open notifications"
                  aria-expanded={showNotifications}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:bg-white/10 hover:text-white"
                >

                  <Bell size={18} />

                  {notifications.length > 0 && (
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}

                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Notifications</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Latest HireLens activity</p>
                      </div>
                      <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold text-indigo-300">
                        {notifications.length} new
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={notification.to}
                          onClick={() => setShowNotifications(false)}
                          className="flex gap-3 border-b border-white/5 px-4 py-4 transition hover:bg-white/[0.04]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                            {notification.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {notification.message}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <Link
                      to="/career-progress"
                      onClick={() => setShowNotifications(false)}
                      className="block px-4 py-3 text-center text-xs font-semibold text-indigo-400 transition hover:bg-white/[0.03] hover:text-indigo-300"
                    >
                      View career progress
                    </Link>
                  </div>
                )}

              </div>


              <div className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
                {fullName.charAt(0).toUpperCase()}
              </div>

            </div>

          </header>


          {/* PAGE CONTENT */}

          <div className="max-h-[calc(100vh-80px)] overflow-y-auto px-6 py-8 lg:px-10">


            {/* GREETING */}

            <section className="mb-8">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

                <div>

                  <p className="mb-2 text-sm font-medium text-indigo-400">
                    Welcome back 👋
                  </p>

                  <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                    Welcome back, {fullName}.
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Here's your current career intelligence overview.
                    Track your job matches, skills and progress from one place.
                  </p>

                </div>


                <Link
                  to="/resume"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                >
                  <FileText size={17} />
                  Analyze Resume
                </Link>

              </div>

            </section>


            {/* ==================================================
                TOP STATS
            ================================================== */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">


              {/* AVERAGE MATCH */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

                <div className="mb-5 flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <TrendingUp size={19} />
                  </div>

                  <span className="text-xs font-medium text-emerald-400">
                    Live
                  </span>

                </div>

                <p className="text-sm text-slate-500">
                  Average Job Match
                </p>

                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {loading ? "--" : `${averageMatch}%`}
                </p>

              </div>


              {/* JOBS */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

                <div className="mb-5 flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <BriefcaseBusiness size={19} />
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="text-slate-600"
                  />

                </div>

                <p className="text-sm text-slate-500">
                  Jobs Analyzed
                </p>

                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {loading ? "--" : jobs.length}
                </p>

              </div>


              {/* STRONG MATCHES */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

                <div className="mb-5 flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                    <Target size={19} />
                  </div>

                  <span className="text-xs text-slate-500">
                    70%+
                  </span>

                </div>

                <p className="text-sm text-slate-500">
                  Strong Matches
                </p>

                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {loading ? "--" : strongMatches}
                </p>

              </div>


              {/* APPLICATIONS */}

              <Link
                to="/applications"
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-indigo-500/30 hover:bg-white/[0.06]"
              >

                <div className="mb-5 flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <ClipboardList size={19} />
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="text-slate-600"
                  />

                </div>

                <p className="text-sm text-slate-500">
                  Applications
                </p>

                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {analyticsLoading
                    ? "--"
                    : applicationAnalytics.total}
                </p>

              </Link>

            </section>


            {/* ==================================================
                CAREER INTELLIGENCE
            ================================================== */}

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr_1fr]">

              {/* CAREER READINESS */}
              <Link
                to="/career-progress"
                className="group rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.10] via-white/[0.04] to-white/[0.03] p-6 transition hover:border-indigo-500/40 hover:bg-indigo-500/[0.12]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300/70">
                      Career intelligence
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold text-white">
                      Career Readiness
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your current readiness across the HireLens journey.
                    </p>
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-slate-600 transition group-hover:text-indigo-300"
                  />
                </div>

                <div className="mt-6 flex items-end gap-4">
                  <div className="font-display text-4xl font-bold text-white">
                    {intelligenceLoading ? "--" : `${careerReadiness}%`}
                  </div>
                  <div className="pb-1 text-xs text-slate-500">
                    overall readiness
                  </div>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(0, careerReadiness))}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">Profile</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {intelligenceLoading ? "--" : `${Math.round(Number(careerData?.profile_progress ?? 0))}%`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">Resume</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {intelligenceLoading ? "--" : `${Math.round(Number(careerData?.resume_progress ?? 0))}%`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">Learning</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {intelligenceLoading ? "--" : `${roadmapProgress}%`}
                    </p>
                  </div>
                </div>
              </Link>

              {/* INTERVIEW PERFORMANCE */}
              <Link
                to="/interview-history"
                className="group rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6 transition hover:border-violet-500/40 hover:bg-violet-500/[0.09]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                    <Target size={19} />
                  </div>
                  <ArrowUpRight size={18} className="text-slate-600 transition group-hover:text-violet-300" />
                </div>
                <p className="mt-5 text-sm text-slate-400">Interview Performance</p>
                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {intelligenceLoading ? "--" : latestInterviewScore !== null ? `${latestInterviewScore}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {latestInterview
                    ? `${completedInterviewSessions.length} completed interview${completedInterviewSessions.length === 1 ? "" : "s"}`
                    : "Complete an interview to see your score"}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Average score</span>
                  <span className="font-semibold text-violet-300">
                    {intelligenceLoading ? "--" : scoredInterviewSessions.length > 0 ? `${interviewAverage}%` : "—"}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, latestInterviewScore || 0))}%` }}
                  />
                </div>
              </Link>

              {/* APPLICATION PIPELINE */}
              <Link
                to="/applications"
                className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 transition hover:border-emerald-500/40 hover:bg-emerald-500/[0.08]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <ClipboardList size={19} />
                  </div>
                  <ArrowUpRight size={18} className="text-slate-600 transition group-hover:text-emerald-300" />
                </div>
                <p className="mt-5 text-sm text-slate-400">Application Pipeline</p>
                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {analyticsLoading ? "--" : applicationAnalytics.total}
                </p>
                <p className="mt-1 text-xs text-slate-500">Total tracked applications</p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white/[0.04] p-2.5 text-center">
                    <p className="text-[10px] text-slate-600">Screening</p>
                    <p className="mt-1 text-sm font-bold text-amber-300">{analyticsLoading ? "--" : applicationAnalytics.screening}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2.5 text-center">
                    <p className="text-[10px] text-slate-600">Interviews</p>
                    <p className="mt-1 text-sm font-bold text-violet-300">{analyticsLoading ? "--" : applicationAnalytics.interviews}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2.5 text-center">
                    <p className="text-[10px] text-slate-600">Offers</p>
                    <p className="mt-1 text-sm font-bold text-emerald-300">{analyticsLoading ? "--" : applicationAnalytics.offers}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {analyticsLoading
                    ? "Loading pipeline..."
                    : applicationPipeline > 0
                      ? `${applicationPipeline} application${applicationPipeline === 1 ? "" : "s"} moved beyond Applied`
                      : "Start applying to build your pipeline"}
                </p>
              </Link>
            </section>


            {/* ==================================================
                MAIN GRID
            ================================================== */}

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">


              {/* TOP JOB MATCHES */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.04]">

                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                  <div>

                    <h3 className="font-display text-lg font-bold text-white">
                      Top Job Matches
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Based on your current skills
                    </p>

                  </div>


                  <Link
                    to="/jobs"
                    className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    View all
                    <ChevronRight size={16} />
                  </Link>

                </div>


                <div className="divide-y divide-white/5">

                  {loading ? (

                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                      Loading your job matches...
                    </div>

                  ) : topJobs.length === 0 ? (

                    <div className="px-6 py-12 text-center">

                      <BriefcaseBusiness
                        size={32}
                        className="mx-auto mb-3 text-slate-600"
                      />

                      <p className="text-sm text-slate-400">
                        No job matches available yet.
                      </p>

                      <Link
                        to="/resume"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
                      >
                        Analyze Resume
                      </Link>

                    </div>

                  ) : (

                    topJobs.map((job) => (

                      <Link
                        key={job.job_id}
                        to={`/jobs/${job.job_id}`}
                        className="flex flex-col gap-4 px-6 py-5 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="flex min-w-0 items-center gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 font-display text-sm font-bold text-indigo-300">
                            {(job.company_name || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>


                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-white">
                              {job.title || job.job_title}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">

                              {job.company_name || "Company"}{" "}

                              {job.location
                                ? `• ${job.location}`
                                : ""}

                            </p>

                          </div>

                        </div>


                        <div className="flex items-center gap-4">

                          <div
                            className={`rounded-lg px-3 py-2 ${getMatchBackground(
                              Number(job.match_score || 0)
                            )}`}
                          >

                            <p
                              className={`text-sm font-bold ${getMatchColor(
                                Number(job.match_score || 0)
                              )}`}
                            >
                              {Math.round(
                                Number(job.match_score || 0)
                              )}
                              %
                            </p>

                            <p className="text-[10px] text-slate-500">
                              match
                            </p>

                          </div>


                          <ChevronRight
                            size={17}
                            className="text-slate-600"
                          />

                        </div>

                      </Link>

                    ))

                  )}

                </div>

              </div>


              {/* CAREER PROGRESS */}

              <div className="space-y-6">


                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

                  <div className="mb-5 flex items-start justify-between">

                    <div>

                      <h3 className="font-display text-lg font-bold text-white">
                        Career Progress
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Your HireLens journey
                      </p>

                    </div>


                    <BarChart3
                      size={20}
                      className="text-indigo-400"
                    />

                  </div>


                  {/* RESUME */}

                  <div className="mb-5">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-sm text-slate-300">
                        Resume Analysis
                      </span>

                      <span className="text-xs font-semibold text-emerald-400">
                        100%
                      </span>

                    </div>


                    <p className="mb-2 text-[11px] text-slate-600">
                      {intelligenceLoading
                        ? "Loading roadmap progress..."
                        : roadmapTotalSteps > 0
                          ? `${roadmapCompletedSteps} of ${roadmapTotalSteps} steps completed`
                          : "No roadmap steps completed yet"}
                    </p>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: "100%" }}
                      />

                    </div>

                  </div>


                  {/* JOB MATCHING */}

                  <div className="mb-5">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-sm text-slate-300">
                        Job Matching
                      </span>

                      <span className="text-xs font-semibold text-indigo-400">
                        {jobs.length > 0 ? "Active" : "Start"}
                      </span>

                    </div>


                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: jobs.length > 0
                            ? "100%"
                            : "10%",
                        }}
                      />

                    </div>

                  </div>


                  {/* APPLICATIONS */}

                  <div className="mb-5">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-sm text-slate-300">
                        Job Applications
                      </span>

                      <span className="text-xs font-semibold text-indigo-400">

                        {analyticsLoading
                          ? "--"
                          : applicationAnalytics.total}

                      </span>

                    </div>


                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width:
                            applicationAnalytics.total > 0
                              ? "100%"
                              : "5%",
                        }}
                      />

                    </div>

                  </div>


                  {/* ROADMAP */}

                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-sm text-slate-300">
                        Learning Progress
                      </span>

                      <span className="text-xs font-semibold text-amber-400">
                        {intelligenceLoading ? "--" : `${roadmapProgress}%`}
                      </span>

                    </div>


                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(0, roadmapProgress))}%`,
                        }}
                      />

                    </div>

                  </div>


                  <Link
                    to="/career-progress"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    View Career Progress
                    <ArrowUpRight size={16} />
                  </Link>

                </div>


                {/* QUICK ACTIONS */}

                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-6">

                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Sparkles size={19} />
                  </div>


                  <h3 className="font-display text-lg font-bold text-white">
                    Improve your career profile
                  </h3>


                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Analyze your resume, discover skill gaps and build a
                    personalized learning roadmap for your target roles.
                  </p>


                  <div className="mt-5 flex flex-col gap-2">

                    <Link
                      to="/resume"
                      className="flex items-center justify-between rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      Analyze Resume
                      <ArrowUpRight size={16} />
                    </Link>


                    <Link
                      to="/jobs"
                      className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      Explore Jobs
                      <ArrowUpRight size={16} />
                    </Link>


                    <Link
                      to="/applications"
                      className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      View Applications
                      <ArrowUpRight size={16} />
                    </Link>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================================
                APPLICATION ACTIVITY
            ================================================== */}

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04]">


              <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <ClipboardList size={19} />
                    </div>


                    <div>

                      <h3 className="font-display text-lg font-bold text-white">
                        Application Activity
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Track your current job application pipeline
                      </p>

                    </div>

                  </div>

                </div>


                <Link
                  to="/applications"
                  className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                >
                  View all applications
                  <ChevronRight size={16} />
                </Link>

              </div>


              {/* APPLICATION STATS */}

              <div className="grid grid-cols-2 border-b border-white/10 md:grid-cols-5">


                <div className="border-b border-white/10 px-5 py-5 md:border-b-0 md:border-r">

                  <p className="text-xs text-slate-500">
                    Total
                  </p>

                  <p className="mt-1 font-display text-2xl font-bold text-white">
                    {analyticsLoading
                      ? "--"
                      : applicationAnalytics.total}
                  </p>

                </div>


                <div className="border-b border-white/10 px-5 py-5 md:border-b-0 md:border-r">

                  <p className="text-xs text-slate-500">
                    Applied
                  </p>

                  <p className="mt-1 font-display text-2xl font-bold text-indigo-300">
                    {analyticsLoading
                      ? "--"
                      : applicationAnalytics.applied}
                  </p>

                </div>


                <div className="border-b border-white/10 px-5 py-5 md:border-b-0 md:border-r">

                  <p className="text-xs text-slate-500">
                    Screening
                  </p>

                  <p className="mt-1 font-display text-2xl font-bold text-amber-300">
                    {analyticsLoading
                      ? "--"
                      : applicationAnalytics.screening}
                  </p>

                </div>


                <div className="border-b border-white/10 px-5 py-5 md:border-b-0 md:border-r">

                  <p className="text-xs text-slate-500">
                    Interviews
                  </p>

                  <p className="mt-1 font-display text-2xl font-bold text-violet-300">
                    {analyticsLoading
                      ? "--"
                      : applicationAnalytics.interviews}
                  </p>

                </div>


                <div className="px-5 py-5">

                  <p className="text-xs text-slate-500">
                    Offers
                  </p>

                  <p className="mt-1 font-display text-2xl font-bold text-emerald-300">
                    {analyticsLoading
                      ? "--"
                      : applicationAnalytics.offers}
                  </p>

                </div>

              </div>


              {/* RECENT APPLICATIONS */}

              <div>

                <div className="flex items-center gap-2 px-6 py-4">

                  <Clock3
                    size={16}
                    className="text-slate-500"
                  />

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Recent Applications
                  </p>

                </div>


                {analyticsLoading ? (

                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading application activity...
                  </div>

                ) : recentApplications.length === 0 ? (

                  <div className="px-6 py-10 text-center">

                    <ClipboardList
                      size={32}
                      className="mx-auto mb-3 text-slate-600"
                    />

                    <p className="text-sm text-slate-400">
                      You haven't applied to any jobs yet.
                    </p>

                    <Link
                      to="/jobs"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
                    >
                      Explore Jobs
                      <ArrowUpRight size={15} />
                    </Link>

                  </div>

                ) : (

                  <div className="divide-y divide-white/5">

                    {recentApplications.map((application) => (

                      <div
                        key={application.application_id}
                        className="flex flex-col gap-4 px-6 py-5 transition hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                      >

                        <div className="flex min-w-0 items-center gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 font-display text-sm font-bold text-indigo-300">

                            {(application.company_name || "C")
                              .charAt(0)
                              .toUpperCase()}

                          </div>


                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-white">

                              {application.title ||
                                "Untitled Position"}

                            </p>


                            <p className="mt-1 truncate text-xs text-slate-500">

                              {application.company_name ||
                                "Company"}

                              {application.location
                                ? ` • ${application.location}`
                                : ""}

                            </p>


                            <p className="mt-1 text-[11px] text-slate-600">

                              Applied{" "}
                              {formatApplicationDate(
                                application.applied_at
                              )}

                            </p>

                          </div>

                        </div>


                        <div className="flex items-center gap-3">

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getApplicationStatusClass(
                              application.status
                            )}`}
                          >
                            {application.status}
                          </span>


                          <Link
                            to={`/jobs/${application.job_id}`}
                            state={{
                              fromApplications: true,
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
                            title="View Job"
                          >
                            <ArrowUpRight size={16} />
                          </Link>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </section>


            {/* ==================================================
                JOURNEY
            ================================================== */}

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

              <div className="mb-6">

                <h3 className="font-display text-lg font-bold text-white">
                  Your HireLens Journey
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  From resume to career readiness
                </p>

              </div>


              <div className="grid gap-4 md:grid-cols-4">


                {/* STEP 1 */}

                <Link
                  to="/resume"
                  className="group rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 transition hover:bg-emerald-500/[0.08]"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 size={18} />
                    </div>

                    <span className="text-xs text-emerald-400">
                      Done
                    </span>

                  </div>


                  <h4 className="font-semibold text-white">
                    Analyze Resume
                  </h4>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Extract your skills, education and experience.
                  </p>

                </Link>


                {/* STEP 2 */}

                <Link
                  to="/jobs"
                  className="group rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5 transition hover:bg-indigo-500/[0.08]"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                      <BriefcaseBusiness size={18} />
                    </div>

                    <span className="text-xs text-indigo-400">
                      Active
                    </span>

                  </div>


                  <h4 className="font-semibold text-white">
                    Find Job Matches
                  </h4>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Discover roles that match your current profile.
                  </p>

                </Link>


                {/* STEP 3 */}

                <Link
                  to="/jobs"
                  className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.05]"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                      <Target size={18} />
                    </div>

                    <span className="text-xs text-slate-500">
                      Next
                    </span>

                  </div>


                  <h4 className="font-semibold text-white">
                    Close Skill Gaps
                  </h4>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Identify the skills required for your target roles.
                  </p>

                </Link>


                {/* STEP 4 */}

                <Link
                  to="/jobs"
                  className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.05]"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                      <Map size={18} />
                    </div>

                    <span className="text-xs text-slate-500">
                      Upcoming
                    </span>

                  </div>


                  <h4 className="font-semibold text-white">
                    Follow Roadmap
                  </h4>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Build the missing skills with a personalized roadmap.
                  </p>

                </Link>

              </div>

            </section>


            <div className="h-10" />

          </div>

        </main>

      </div>

    </div>
  );
}


export default Dashboard;