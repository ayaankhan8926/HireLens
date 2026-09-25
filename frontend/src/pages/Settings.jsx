import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

import {
  ArrowLeft,
  Save,
  User,
  Mail,
  MapPin,
  GraduationCap,
  BriefcaseBusiness,
  Code2,
  Share2,
  Globe,
  LogOut,
  Settings as SettingsIcon,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

function Settings() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    education: "",
    target_role: "",
    experience_years: "",
    bio: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("hirelens_token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "hirelens_token"
          )}`,
        },
      });

      const profile = response.data.profile || response.data;

      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        education: profile.education || "",
        target_role: profile.target_role || "",
        experience_years: profile.experience_years ?? "",
        bio: profile.bio || "",
        github_url: profile.github_url || "",
        linkedin_url: profile.linkedin_url || "",
        portfolio_url: profile.portfolio_url || "",
      });
    } catch (error) {
      console.error("Profile loading error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("hirelens_token");
        localStorage.removeItem("hirelens_user");
        navigate("/login");
      } else {
        setMessage("Unable to load your profile.");
        setMessageType("error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await api.put(
        "/profile",
        {
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          education: formData.education,
          target_role: formData.target_role,
          experience_years:
            formData.experience_years === ""
              ? null
              : Number(formData.experience_years),
          bio: formData.bio,
          github_url: formData.github_url,
          linkedin_url: formData.linkedin_url,
          portfolio_url: formData.portfolio_url,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "hirelens_token"
            )}`,
          },
        }
      );

      if (response.data?.user) {
        localStorage.setItem(
          "hirelens_user",
          JSON.stringify(response.data.user)
        );
      }

      setMessage("Profile updated successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Profile update error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hirelens_token");
    localStorage.removeItem("hirelens_user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <Link
            to="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <Sparkles size={20} />
            </div>

            <div>
              <h1 className="font-display text-xl font-bold">
                Hire<span className="text-indigo-400">Lens</span>
              </h1>

              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Career Intelligence
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* TITLE */}
        <div className="mb-8">

          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <SettingsIcon size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Account
              </p>

              <h1 className="font-display text-3xl font-bold text-white">
                Settings
              </h1>
            </div>

          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Manage your career profile and the information HireLens uses
            to personalize your job matches and career recommendations.
          </p>

        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading your profile...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave}>

            {/* PERSONAL INFORMATION */}
            <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04]">

              <div className="border-b border-white/10 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <User size={18} />
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold">
                      Personal Information
                    </h2>

                    <p className="text-xs text-slate-500">
                      Basic information about you
                    </p>
                  </div>

                </div>

              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">

                {/* FULL NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Full Name
                  </label>

                  <div className="relative">

                    <User
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                    />

                  </div>
                </div>

                {/* EMAIL */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-slate-900/60 px-10 py-3 text-sm text-slate-500 outline-none"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-600">
                    Email is linked to your account and cannot be changed here.
                  </p>

                </div>

                {/* PHONE */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                  />

                </div>

                {/* LOCATION */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Location
                  </label>

                  <div className="relative">

                    <MapPin
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Bengaluru, India"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                    />

                  </div>

                </div>

              </div>
            </section>

            {/* CAREER INFORMATION */}
            <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04]">

              <div className="border-b border-white/10 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <BriefcaseBusiness size={18} />
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold">
                      Career Information
                    </h2>

                    <p className="text-xs text-slate-500">
                      Help HireLens personalize your career intelligence
                    </p>
                  </div>

                </div>

              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">

                {/* EDUCATION */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Education
                  </label>

                  <div className="relative">

                    <GraduationCap
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      placeholder="e.g. B.E. Information Science"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                    />

                  </div>

                </div>

                {/* TARGET ROLE */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Target Role
                  </label>

                  <input
                    type="text"
                    name="target_role"
                    value={formData.target_role}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                  />

                </div>

                {/* EXPERIENCE */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Experience
                  </label>

                  <select
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60"
                  >
                    <option value="">Select experience</option>
                    <option value="0">Fresher / 0 years</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                    <option value="5">5+ years</option>
                  </select>

                </div>

                {/* BIO */}
                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Professional Bio
                  </label>

                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us briefly about your background, interests and career goals..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                  />

                  <p className="mt-2 text-xs text-slate-600">
                    A good bio helps build a stronger career profile.
                  </p>

                </div>

              </div>
            </section>

            {/* PROFESSIONAL LINKS */}
            <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04]">

              <div className="border-b border-white/10 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                    <Globe size={18} />
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold">
                      Professional Links
                    </h2>

                    <p className="text-xs text-slate-500">
                      Add links recruiters can use to learn more about you
                    </p>
                  </div>

                </div>

              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">

                {/* GITHUB */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    GitHub
                  </label>

                  <div className="relative">

                    <Code2
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                    />

                  </div>

                </div>

                {/* LINKEDIN */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    LinkedIn
                  </label>

                  <div className="relative">

                    <Share2
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                    />

                  </div>

                </div>

                {/* PORTFOLIO */}
                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Portfolio Website
                  </label>

                  <div className="relative">

                    <Globe
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="url"
                      name="portfolio_url"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
                    />

                  </div>

                </div>

              </div>
            </section>

            {/* SAVE SECTION */}
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                {message && (
                  <>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        messageType === "success"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      <CheckCircle2 size={18} />
                    </div>

                    <p
                      className={`text-sm ${
                        messageType === "success"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {message}
                    </p>
                  </>
                )}

              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </form>
        )}

        {/* ACCOUNT SESSION */}
        <section className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-6">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Account Session
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sign out from your current HireLens account.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={17} />
              Logout
            </button>

          </div>

        </section>

        <div className="h-10" />

      </main>
    </div>
  );
}

export default Settings;