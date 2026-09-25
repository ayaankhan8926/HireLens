import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Search,
  Settings,
  Target,
  TrendingUp,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import api from "../api";

const STATUS_OPTIONS = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const STATUS_STYLES = {
  Applied: {
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    dot: "bg-blue-400",
  },
  Screening: {
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    dot: "bg-amber-400",
  },
  Interview: {
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    dot: "bg-purple-400",
  },
  Offer: {
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  Rejected: {
    badge: "bg-red-500/10 text-red-300 border-red-500/20",
    dot: "bg-red-400",
  },
  Withdrawn: {
    badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    dot: "bg-slate-400",
  },
};

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status) {
  return (
    STATUS_STYLES[status] || {
      badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",
      dot: "bg-slate-400",
    }
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Sidebar({ onLogout }) {
  const navigation = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: TrendingUp,
    },
    {
      label: "Resume Analysis",
      href: "/resume",
      icon: FileText,
    },
    {
      label: "Job Matches",
      href: "/jobs",
      icon: Target,
    },
    {
      label: "Applications",
      href: "/applications",
      icon: BriefcaseBusiness,
      active: true,
    },
    {
      label: "Learning Roadmap",
      href: "/roadmaps",
      icon: CheckCircle2,
    },
    {
      label: "Career Progress",
      href: "/career-progress",
      icon: TrendingUp,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-800 bg-slate-950 lg:block">
      <div className="flex h-full flex-col">

        <div className="border-b border-slate-800 px-6 py-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Target className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="font-display text-xl font-bold text-white">
                HireLens
              </p>

              <p className="text-[11px] text-slate-500">
                Career Intelligence
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  item.active
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          <button
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <XCircle className="h-4 w-4" />
            Logout
          </button>
        </div>

      </div>
    </aside>
  );
}

function MobileHeader({ onLogout }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-4 backdrop-blur lg:hidden">

      <Link
        to="/dashboard"
        className="flex items-center gap-2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <Target className="h-4 w-4 text-white" />
        </div>

        <span className="font-display text-lg font-bold text-white">
          HireLens
        </span>
      </Link>

      <div className="flex items-center gap-2">

        <Link
          to="/settings"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <button
          onClick={onLogout}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-red-300"
        >
          <XCircle className="h-5 w-5" />
        </button>

      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  onStatusChange,
  onSaveNotes,
  updatingId,
  savingNotesId,
}) {
  const [showStatusMenu, setShowStatusMenu] =
    useState(false);

  const [editingNotes, setEditingNotes] =
    useState(false);

  const [notes, setNotes] = useState(
    application.notes || ""
  );

  const job = application.job || {};

  const title =
    application.job_title ||
    job.title ||
    "Untitled Position";

  const company =
    application.company_name ||
    job.company_name ||
    "Unknown Company";

  const location =
    application.location ||
    job.location ||
    "Location not specified";

  const statusStyle = getStatusStyle(
    application.status
  );

  const handleSaveNotes = async () => {
    const success = await onSaveNotes(
      application.application_id,
      notes
    );

    if (success) {
      setEditingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotes(application.notes || "");
    setEditingNotes(false);
  };

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900">

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <div className="min-w-0 flex-1">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>

            <div className="min-w-0">

              <Link
                to={`/jobs/${application.job_id}`}
                state={{
                  fromApplications: true,
                }}
                className="block truncate text-lg font-semibold text-white transition hover:text-indigo-300"
              >
                {title}
              </Link>

              <p className="mt-1 text-sm font-medium text-slate-300">
                {company}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">

                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>

                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Applied{" "}
                  {formatDate(
                    application.applied_at
                  )}
                </span>

              </div>

            </div>

          </div>

        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Status dropdown */}
          <div className="relative">

            <button
              onClick={() =>
                setShowStatusMenu(
                  (current) => !current
                )
              }
              disabled={
                updatingId ===
                application.application_id
              }
              className={`flex min-w-[145px] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${statusStyle.badge}`}
            >

              <span className="flex items-center gap-2">

                {updatingId ===
                application.application_id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full ${statusStyle.dot}`}
                  />
                )}

                {application.status}

              </span>

              <ChevronDown className="h-4 w-4" />

            </button>

            {showStatusMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">

                {STATUS_OPTIONS.map(
                  (status) => {
                    const style =
                      getStatusStyle(status);

                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setShowStatusMenu(
                            false
                          );

                          if (
                            status !==
                            application.status
                          ) {
                            onStatusChange(
                              application.application_id,
                              status
                            );
                          }
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          status ===
                          application.status
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >

                        <span
                          className={`h-2 w-2 rounded-full ${style.dot}`}
                        />

                        {status}

                      </button>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* View Job */}
          <Link
            to={`/jobs/${application.job_id}`}
            state={{
              fromApplications: true,
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View Job
          </Link>

        </div>

      </div>

      {/* Notes */}
      <div className="mt-5 border-t border-slate-800 pt-5">

        {!editingNotes ? (

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

            <div className="flex min-w-0 gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                <MessageSquare className="h-4 w-4" />
              </div>

              <div className="min-w-0">

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Notes
                </p>

                {application.notes ? (
                  <p className="mt-1 text-sm leading-6 text-slate-400 whitespace-pre-wrap">
                    {application.notes}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    No notes added yet.
                  </p>
                )}

              </div>

            </div>

            <button
              onClick={() => {
                setNotes(
                  application.notes || ""
                );
                setEditingNotes(true);
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300"
            >
              {application.notes ? (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Note
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add Note
                </>
              )}
            </button>

          </div>

        ) : (

          <div>

            <div className="mb-3 flex items-center justify-between">

              <div className="flex items-center gap-2">

                <MessageSquare className="h-4 w-4 text-indigo-400" />

                <p className="text-sm font-semibold text-white">
                  {application.notes
                    ? "Edit Note"
                    : "Add Note"}
                </p>

              </div>

              <button
                onClick={handleCancelNotes}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add a note about this application..."
              rows={4}
              maxLength={2000}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs text-slate-600">
                {notes.length}/2000 characters
              </p>

              <div className="flex gap-2">

                <button
                  onClick={handleCancelNotes}
                  disabled={
                    savingNotesId ===
                    application.application_id
                  }
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveNotes}
                  disabled={
                    savingNotesId ===
                    application.application_id
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {savingNotesId ===
                  application.application_id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Note
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [savingNotesId, setSavingNotesId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const applicationsFetchedRef =
    useRef(false);

  useEffect(() => {
    const token =
      localStorage.getItem(
        "hirelens_token"
      );

    if (!token) {
      navigate("/login");
      return;
    }

    if (
      applicationsFetchedRef.current
    ) {
      return;
    }

    applicationsFetchedRef.current = true;

    loadApplications();
  }, [navigate]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "hirelens_token"
        );

      const response = await api.get(
        "/applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplications(
        response.data.applications || []
      );
    } catch (err) {
      console.error(
        "Failed to load applications:",
        err
      );

      if (
        err.response?.status === 401
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

      setError(
        err.response?.data?.message ||
          "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    applicationId,
    newStatus
  ) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      const token =
        localStorage.getItem(
          "hirelens_token"
        );

      const response = await api.put(
        `/applications/${applicationId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedApplication =
        response.data.application;

      setApplications((current) =>
        current.map((application) =>
          application.application_id ===
          applicationId
            ? {
                ...application,
                ...updatedApplication,
              }
            : application
        )
      );
    } catch (err) {
      console.error(
        "Failed to update application status:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (
    applicationId,
    notes
  ) => {
    try {
      setSavingNotesId(applicationId);
      setError("");

      const token =
        localStorage.getItem(
          "hirelens_token"
        );

      const response = await api.put(
        `/applications/${applicationId}/notes`,
        {
          notes: notes.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedApplication =
        response.data.application;

      setApplications((current) =>
        current.map((application) =>
          application.application_id ===
          applicationId
            ? {
                ...application,
                ...updatedApplication,
              }
            : application
        )
      );

      return true;
    } catch (err) {
      console.error(
        "Failed to save application notes:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save application notes."
      );

      return false;
    } finally {
      setSavingNotesId(null);
    }
  };

  const filteredApplications =
    useMemo(() => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      return applications.filter(
        (application) => {
          const job =
            application.job || {};

          const title = (
            application.job_title ||
            job.title ||
            ""
          ).toLowerCase();

          const company = (
            application.company_name ||
            job.company_name ||
            ""
          ).toLowerCase();

          const location = (
            application.location ||
            job.location ||
            ""
          ).toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            title.includes(
              normalizedSearch
            ) ||
            company.includes(
              normalizedSearch
            ) ||
            location.includes(
              normalizedSearch
            );

          const matchesStatus =
            statusFilter === "All" ||
            application.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      applications,
      searchTerm,
      statusFilter,
    ]);

  const stats = useMemo(() => {
    return {
      total: applications.length,

      applied: applications.filter(
        (item) =>
          item.status === "Applied"
      ).length,

      screening: applications.filter(
        (item) =>
          item.status === "Screening"
      ).length,

      interview: applications.filter(
        (item) =>
          item.status === "Interview"
      ).length,

      offers: applications.filter(
        (item) =>
          item.status === "Offer"
      ).length,

      rejected: applications.filter(
        (item) =>
          item.status === "Rejected"
      ).length,
    };
  }, [applications]);

  const handleLogout = () => {
    localStorage.removeItem(
      "hirelens_token"
    );

    localStorage.removeItem(
      "hirelens_user"
    );

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <Sidebar
        onLogout={handleLogout}
      />

      <MobileHeader
        onLogout={handleLogout}
      />

      <main className="lg:ml-64">

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <Link
                to="/dashboard"
                className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>

              <p className="mb-2 text-sm font-medium text-indigo-400">
                Career Management
              </p>

              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                My Applications
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Keep track of every opportunity from your first
                application to the final outcome.
              </p>

            </div>

            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:from-indigo-400 hover:to-purple-400"
            >
              <Plus className="h-4 w-4" />
              Find Jobs
            </Link>

          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <StatCard
              icon={BriefcaseBusiness}
              label="Total Applications"
              value={stats.total}
              description="All tracked applications"
            />

            <StatCard
              icon={Clock3}
              label="Applied"
              value={stats.applied}
              description="Waiting for next step"
            />

            <StatCard
              icon={Target}
              label="Screening"
              value={stats.screening}
              description="Currently under review"
            />

            <StatCard
              icon={MessageSquare}
              label="Interviews"
              value={stats.interview}
              description="Interview stage"
            />

            <StatCard
              icon={CheckCircle2}
              label="Offers"
              value={stats.offers}
              description="Offers received"
            />

          </div>

          {/* Main content */}
          <div className="mt-8">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">

              {/* Filters */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="text-lg font-semibold text-white">
                    Application Pipeline
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {filteredApplications.length} of{" "}
                    {applications.length} applications shown
                  </p>

                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <div className="relative">

                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search applications..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 sm:w-64"
                    />

                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none transition focus:border-indigo-500"
                  >

                    <option value="All">
                      All Statuses
                    </option>

                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* Error */}
              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">

                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                  <div>

                    <p className="text-sm font-medium text-red-300">
                      Something went wrong
                    </p>

                    <p className="mt-1 text-sm text-red-300/70">
                      {error}
                    </p>

                  </div>

                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex min-h-[350px] items-center justify-center">

                  <div className="flex flex-col items-center gap-3">

                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />

                    <p className="text-sm text-slate-500">
                      Loading your applications...
                    </p>

                  </div>

                </div>
              )}

              {/* Empty state */}
              {!loading &&
                applications.length === 0 && (
                  <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">

                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                      <BriefcaseBusiness className="h-9 w-9 text-indigo-400" />
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-white">
                      No applications yet
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      When you apply to a job through HireLens,
                      it will appear here so you can track your
                      complete application journey.
                    </p>

                    <Link
                      to="/jobs"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      <Search className="h-4 w-4" />
                      Explore Job Matches
                    </Link>

                  </div>
                )}

              {/* No filtered results */}
              {!loading &&
                applications.length > 0 &&
                filteredApplications.length ===
                  0 && (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                    <Search className="h-8 w-8 text-slate-600" />

                    <h3 className="mt-4 font-semibold text-white">
                      No matching applications
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or status filter.
                    </p>

                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("All");
                      }}
                      className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      Clear filters
                    </button>

                  </div>
                )}

              {/* Application list */}
              {!loading &&
                filteredApplications.length >
                  0 && (
                  <div className="mt-6 space-y-3">

                    {filteredApplications.map(
                      (application) => (
                        <ApplicationCard
                          key={
                            application.application_id
                          }
                          application={
                            application
                          }
                          onStatusChange={
                            handleStatusChange
                          }
                          onSaveNotes={
                            handleSaveNotes
                          }
                          updatingId={
                            updatingId
                          }
                          savingNotesId={
                            savingNotesId
                          }
                        />
                      )
                    )}

                  </div>
                )}

            </div>

          </div>

          {/* Bottom info */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <FileText className="h-5 w-5" />
                </div>

                <div>

                  <h3 className="font-semibold text-white">
                    Keep your applications organized
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Update your status and keep useful notes as
                    you move through each company's hiring process.
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>

                  <h3 className="font-semibold text-white">
                    Stay interview-ready
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Use HireLens AI Interview Coach to prepare when
                    an application reaches the interview stage.
                  </p>

                </div>

              </div>

            </div>

          </div>

          <footer className="py-8 text-center text-xs text-slate-600">
            HireLens · AI-powered career intelligence
          </footer>

        </div>

      </main>

    </div>
  );
}