// client/src/components/layout/Sidebar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState({
    dashboard: true,
    social: false,
    settings: false,
    multi: false,
  });

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const linkCls = ({ isActive }) => `menu-link${isActive ? " active" : ""}`;
  const doLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <>
      {/* Logo */}
      <div className="logo position-relative d-flex align-items-center justify-content-between">
        <NavLink
          to="/"
          className="d-block text-decoration-none position-relative"
        >
          <img src="/images/logo-icon.png" alt="logo-icon" />
          <span className="logo-text text-secondary fw-semibold">Tracker</span>
        </NavLink>
      </div>

      {/* Sidebar */}
      <aside
        id="layout-menu"
        className="layout-menu menu-vertical menu active"
        data-simplebar=""
      >
        <ul className="menu-inner">
          {/* ================== ADMIN ================== */}
          {user?.role === "ADMIN" && (
            <>
              <li className="menu-title small text-uppercase">
                <span className="menu-title-text">ADMIN</span>
              </li>

              {/* Dashboard group */}
              <li className={`menu-item ${open.dashboard ? "open" : ""}`}>
                <button
                  type="button"
                  className="menu-link menu-toggle bg-transparent border-0 w-100 text-start"
                  onClick={() => toggle("dashboard")}
                  aria-expanded={open.dashboard}
                >
                  <span className="material-symbols-outlined menu-icon">
                    dashboard
                  </span>
                  <span className="title">Dashboard</span>
                </button>
                <ul
                  className="menu-sub"
                  style={{ display: open.dashboard ? "block" : "none" }}
                >
                  <li className="menu-item">
                    <NavLink to="/" end className={linkCls}>
                      Overview
                    </NavLink>
                  </li>
                </ul>
              </li>
              <li className="menu-item">
                <NavLink to="/admin-users" className={linkCls}>
                  <span className="material-symbols-outlined menu-icon">
                    group
                  </span>
                  <span className="title">Users</span>
                </NavLink>
              </li>
              {/* Projects */}
              <li className="menu-item">
                <NavLink to="/projects" className={linkCls}>
                  <span className="material-symbols-outlined menu-icon">
                    apps
                  </span>
                  <span className="title">Projects</span>
                </NavLink>
              </li>

              {/* Bug Management */}
              <li className="menu-item">
                <NavLink to="/all-bugs" className={linkCls}>
                  <span className="material-symbols-outlined menu-icon">
                    bug_report
                  </span>
                  <span className="title">All Bugs</span>
                </NavLink>
              </li>
             
            </>
          )}

          {/* ================== TESTER ================== */}
          {user?.role === "TESTER" && (
            <>
              <li className="menu-title small text-uppercase">
                <span className="menu-title-text">TESTER</span>
              </li>
              <li className={`menu-item ${open.social ? "open" : ""}`}>
                <button
                  type="button"
                  className="menu-link menu-toggle bg-transparent border-0 w-100 text-start"
                  onClick={() => toggle("social")}
                  aria-expanded={open.social}
                >
                  <span className="material-symbols-outlined menu-icon">
                    bug_report
                  </span>
                  <span className="title">Bugs</span>
                </button>
                <ul
                  className="menu-sub"
                  style={{ display: open.social ? "block" : "none" }}
                >
                  <li className="menu-item">
                    <NavLink to="/report-bug" className={linkCls}>
                      Report Bug
                    </NavLink>
                  </li>
                  <li className="menu-item">
                    <NavLink to="/issues" className={linkCls}>
                      My Reports
                    </NavLink>
                  </li>
                </ul>
              </li>
              <li className="menu-item">
                <NavLink to="/my-projects" className={linkCls}>
                  <span className="material-symbols-outlined menu-icon">
                    folder
                  </span>
                  <span className="title">My Projects</span>
                </NavLink>
              </li>
            </>
          )}

          {/* ================== DEVELOPER ================== */}
          {user?.role === "DEVELOPER" && (
            <>
              <li className="menu-title small text-uppercase">
                <span className="menu-title-text">DEVELOPER</span>
              </li>
              <li className="menu-item">
                <NavLink to="/assigned-bugs" className={linkCls}>
                  <span className="material-symbols-outlined menu-icon">
                    assignment
                  </span>
                  <span className="title">Assigned Bugs</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/dev/history" className={linkCls}>
                  <span className="material-symbols-outlined menu-icon">
                    history
                  </span>
                  <span className="title">Bug History</span>
                </NavLink>
              </li>
            </>
          )}

          {/* ================== COMMON (All Roles) ================== */}
          <li className={`menu-item ${open.settings ? "open" : ""}`}>
            <button
              type="button"
              className="menu-link menu-toggle bg-transparent border-0 w-100 text-start"
              onClick={() => toggle("settings")}
              aria-expanded={open.settings}
            >
              <span className="material-symbols-outlined menu-icon">
                settings
              </span>
              <span className="title">setting</span>
            </button>
            <ul
              className="menu-sub"
              style={{ display: open.settings ? "block" : "none" }}
            >
              <li className="menu-item">
                <NavLink to="/profile" className={linkCls}>
                  My Profile
                </NavLink>
              </li>
            </ul>
          </li>
          <li className="menu-item">
            <button
              className="menu-link bg-transparent border-0 w-100 text-start"
              onClick={doLogout}
            >
              <span className="material-symbols-outlined menu-icon">
                logout
              </span>
              <span className="title">Logout</span>
            </button>
          </li>
        </ul>
      </aside>
    </>
  );
}
