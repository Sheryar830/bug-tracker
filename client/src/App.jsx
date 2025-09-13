// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import PrivateRoute from "./auth/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/layout/Layout";
import ReportBug from "./pages/ReportBug";
import IssuesList from "./pages/IssuesList";
import ProfileSettings from "./pages/ProfileSettings";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAllBugs from "./pages/admin/AdminAllBugs";
import AdminSettings from "./pages/admin/AdminSettings";
import MyProjects from "./pages/MyProjects";
import AssignedBugs from "./pages/dev/AssignedBugs";
import BugHistory from "./pages/dev/BugHistory";
import AdminIssueDetail from "./pages/admin/AdminIssueDetail";
import DevIssueDetail from "./pages/dev/DevIssueDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="report-bug" element={<ReportBug />} />
            <Route path="issues" element={<IssuesList />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="admin-users" element={<AdminUsers />} />
            <Route path="all-bugs" element={<AdminAllBugs />} />
            <Route path="admin-settings" element={<AdminSettings />} />
            <Route path="my-projects" element={<MyProjects />} />
            <Route path="assigned-bugs" element={<AssignedBugs/>} />
            <Route path="/dev/history" element={<BugHistory />} />
            <Route path="/all-bugs/:id" element={<AdminIssueDetail />} />
            <Route path="/dev/issues/:id" element={<DevIssueDetail />} />

            {/* add more pages here */}
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
