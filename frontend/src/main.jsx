import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import App from "./App";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import SkillGap from "./pages/SkillGap";
import Roadmap from "./pages/Roadmap";
import Roadmaps from "./pages/Roadmaps";
import CareerProgress from "./pages/CareerProgress";
import Settings from "./pages/Settings";
import ResumeImprovement from "./pages/ResumeImprovement";
import Interview from "./pages/Interview";
import Applications from "./pages/Applications";
import InterviewHistory from "./pages/InterviewHistory";
import InterviewReview from "./pages/InterviewReview";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/resume"
          element={<ResumeAnalysis />}
        />

        <Route
          path="/jobs"
          element={<Jobs />}
        />

        <Route
          path="/jobs/:jobId"
          element={<JobDetails />}
        />

        <Route
          path="/skill-gap/:jobId"
          element={<SkillGap />}
        />

        <Route
          path="/roadmap/:roadmapId"
          element={<Roadmap />}
        />

        <Route
          path="/roadmaps"
          element={<Roadmaps />}
        />

        <Route
          path="/career-progress"
          element={<CareerProgress />}
        />

        <Route
          path="/applications"
          element={<Applications />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/resume-improvement/:jobId"
          element={<ResumeImprovement />}
        />

        <Route
          path="/interview/:jobId"
          element={<Interview />}
        />

        <Route
          path="/interview-history"
          element={<InterviewHistory />}
        />

        <Route
          path="/interview-review/:sessionId"
          element={<InterviewReview />}
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);