import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, DashboardLayout } from './components/Layouts';
import { AdminLayout } from './components/AdminLayout';
import { ThemeProvider } from './components/ThemeContext';
import { HomePage, AuthPage } from './pages/Public';
import { AdminOverview, AdminUsers, AdminJobs, AdminApprovals } from './pages/Admin';
import { OrgAdminDashboard, OrgSettings } from './pages/OrgAdmin';
import { RecruiterDashboard, CreateJob, MyJobs, Applicants, RecruiterProfile, FindInterviewers, RecruiterInterviews } from './pages/Recruiter';
import { RankedCandidates } from './pages/RankedCandidates';
import { CandidateDashboard, CandidateJobs, CandidateProfile, CandidateInterviews, CandidateApplications } from './pages/Candidate';
import { InterviewerDashboard, InterviewerProfile, InterviewerInterviews, InterviewerRequests } from './pages/Interviewer';
import InterviewRoom from './pages/InterviewRoom';

const App: React.FC = () => {
  console.log("App Component Mounting...");
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/signup" element={<AuthPage type="signup" />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Org Admin Routes */}
          <Route path="/organization" element={<DashboardLayout role="organization" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OrgAdminDashboard />} />
            <Route path="settings" element={<OrgSettings />} />
            <Route path="*" element={<Navigate to="/organization/dashboard" replace />} />
          </Route>

          {/* Recruiter Routes */}
          <Route path="/recruiter" element={<DashboardLayout role="RECRUITER" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="jobs" element={<MyJobs />} />
            <Route path="applicants" element={<Applicants />} />
            <Route path="hire-interviewer" element={<FindInterviewers />} />
            <Route path="schedule" element={<RecruiterInterviews />} />
            <Route path="profile" element={<RecruiterProfile />} />
            <Route path="ranked/:jobId" element={<RankedCandidates />} />
            <Route path="*" element={<Navigate to="/recruiter/dashboard" replace />} />
          </Route>

          {/* Candidate Routes */}
          <Route path="/candidate" element={<DashboardLayout role="CANDIDATE" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="jobs" element={<CandidateJobs />} />
            <Route path="profile" element={<CandidateProfile />} />
            <Route path="applications" element={<CandidateApplications />} />
            <Route path="interviews" element={<CandidateInterviews />} />
            <Route path="*" element={<Navigate to="/candidate/dashboard" replace />} />
          </Route>

          {/* Interviewer Routes */}
          <Route path="/interviewer" element={<DashboardLayout role="INTERVIEWER" />}>
            <Route index element={<InterviewerDashboard />} />
            <Route path="schedule" element={<InterviewerInterviews />} />
            <Route path="requests" element={<InterviewerRequests />} />
            <Route path="profile" element={<InterviewerProfile />} />
            <Route path="*" element={<Navigate to="/interviewer" replace />} />
          </Route>

          {/* Interview Room (Standalone — full-screen, no dashboard wrapper) */}
          <Route path="/interview/room/:id" element={<InterviewRoom />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
