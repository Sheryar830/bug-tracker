// client/src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../api";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    const load = async () => {
      if (user?.role !== "ADMIN") return; // only fetch for admins
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get("/admin/stats", { headers });
        setStats(data);
      } catch (e) {
        setErr(e.response?.data?.message || e.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role, headers]);

  const openBySeverity = stats?.charts?.openBySeverity || [];
  const openByStatus = stats?.charts?.openByStatus || [];
  const recentIssues = stats?.recentIssues || [];
  const maxSev = openBySeverity.reduce((m, x) => Math.max(m, x.count), 0) || 1;
  const maxSt  = openByStatus.reduce((m, x) => Math.max(m, x.count), 0) || 1;

  return (
    <>
      {/* Welcome + role message */}
      <div className="alert alert-info mb-20">
        Welcome, <b>{user?.name}</b>! Your role is <b>{user?.role || "N/A"}</b>.
      </div>

      {/* ADMIN: Live stats */}
      {user?.role === "ADMIN" && (
        <div className="card bg-white p-20 pb-0 rounded-10 border border-white mb-4">
          <div className="d-flex align-items-center justify-content-between mb-20">
            <h3 className="mb-0">Admin Overview</h3>
            {loading && <span className="text-muted small">Loading…</span>}
            {err && <span className="text-danger small">{err}</span>}
          </div>

          <div className="row" style={{ "--bs-gutter-x": "20px" }}>
            {/* Total Projects */}
            <div className="col-lg-6">
              <div className="card bg-body-bg p-20 rounded-10 border border-white mb-20">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h3 className="mb-10">Total Projects</h3>
                    <h2 className="fs-26 fw-medium mb-0 lh-1">
                      {stats?.cards?.totalProjects ?? "—"}
                    </h2>
                  </div>
                  <div className="flex-shrink-0 ms-auto">
                    <div
                      className="bg-primary text-center rounded-circle d-block for-mobile-width"
                      style={{ width: 75, height: 75, lineHeight: "75px" }}
                    >
                      <img src="/images/total-projects.svg" alt="total-projects" />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center w-100" style={{ marginTop: 23 }}>
                  <p className="mb-0 fs-14">Updated</p>
                  <span className="d-flex align-content-center gap-1 bg-success bg-opacity-10 border border-success" style={{ padding: "3px 5px" }}>
                    <i className="material-symbols-outlined fs-14 text-success">check_circle</i>
                    <span className="lh-1 fs-14 text-success">now</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Open Issues */}
            <div className="col-lg-6">
              <div className="card bg-body-bg p-20 rounded-10 border border-white mb-20">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h3 className="mb-10">Open Issues</h3>
                    <h2 className="fs-26 fw-medium mb-0 lh-1">
                      {stats?.cards?.totalOpenIssues ?? "—"}
                    </h2>
                  </div>
                  <div className="flex-shrink-0 ms-auto">
                    <div
                      className="bg-warning text-center rounded-circle d-block for-mobile-width"
                      style={{ width: 75, height: 75, lineHeight: "75px" }}
                    >
                      <img src="/images/active-projects.svg" alt="open-issues" />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center w-100" style={{ marginTop: 23 }}>
                  <p className="mb-0 fs-14">Updated</p>
                  <span className="d-flex align-content-center gap-1 bg-danger bg-opacity-10 border border-danger" style={{ padding: "3px 5px" }}>
                    <i className="material-symbols-outlined fs-14 text-danger">warning</i>
                    <span className="lh-1 fs-14 text-danger">live</span>
                  </span>
                </div>
              </div>
            </div>

            {/* New This Week */}
            <div className="col-lg-6">
              <div className="card bg-body-bg p-20 rounded-10 border border-white mb-20">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h3 className="mb-10">New This Week</h3>
                    <h2 className="fs-26 fw-medium mb-0 lh-1">
                      {stats?.cards?.newThisWeek ?? "—"}
                    </h2>
                  </div>
                  <div className="flex-shrink-0 ms-auto">
                    <div
                      className="bg-info text-center rounded-circle d-block for-mobile-width"
                      style={{ width: 75, height: 75, lineHeight: "75px" }}
                    >
                      <img src="/images/completed-projects.svg" alt="new-this-week" />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center w-100" style={{ marginTop: 23 }}>
                  <p className="mb-0 fs-14">Updated</p>
                  <span className="d-flex align-content-center gap-1 bg-success bg-opacity-10 border border-success" style={{ padding: "3px 5px" }}>
                    <i className="material-symbols-outlined fs-14 text-success">trending_up</i>
                    <span className="lh-1 fs-14 text-success">7d</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Charts */}
            <div className="col-lg-6">
              <div className="card bg-body-bg p-20 rounded-10 border border-white mb-20">
                <h4 className="mb-15">Open by Severity</h4>
                <ul className="list-unstyled mb-0">
                  {openBySeverity.length === 0 && <li className="text-muted">No data</li>}
                  {openBySeverity.map((s) => (
                    <li key={s.severity} className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="small">{s.severity}</span>
                        <span className="small fw-medium">{s.count}</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className={`progress-bar`}
                          role="progressbar"
                          style={{ width: `${(s.count / maxSev) * 100}%` }}
                          aria-valuenow={s.count}
                          aria-valuemin="0"
                          aria-valuemax={maxSev}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-12">
              <div className="card bg-body-bg p-20 rounded-10 border border-white mb-20">
                <div className="row" style={{ "--bs-gutter-x": "20px" }}>
                  <div className="col-lg-6">
                    <h4 className="mb-15">Open by Status</h4>
                    <ul className="list-unstyled mb-0">
                      {openByStatus.length === 0 && <li className="text-muted">No data</li>}
                      {openByStatus.map((s) => (
                        <li key={s.status} className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span className="small">{s.status}</span>
                            <span className="small fw-medium">{s.count}</span>
                          </div>
                          <div className="progress" style={{ height: 6 }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${(s.count / maxSt) * 100}%` }}
                              aria-valuenow={s.count}
                              aria-valuemin="0"
                              aria-valuemax={maxSt}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-lg-6">
                    <h4 className="mb-15">Recent Issues</h4>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Project</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentIssues.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-muted text-center">No recent issues</td>
                            </tr>
                          )}
                          {recentIssues.map((it) => (
                            <tr key={it._id}>
                              <td className="fw-medium">{it.title}</td>
                              <td>{it.severity}</td>
                              <td>{it.status}</td>
                              <td className="small text-muted">
                                {it.projectId?.key || "—"} {it.projectId?.name ? `• ${it.projectId.name}` : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* NON-ADMIN: keep your existing static section (or show a friendly message) */}
      {user?.role !== "ADMIN" && (
        <div className="card bg-white p-20 pb-0 rounded-10 border border-white mb-4">
          <h3 className="mb-20">Projects Overview</h3>
          {/* You can keep your previous static content here for non-admins */}
          <div className="text-muted mb-3">This area will show role-specific stats.</div>
        </div>
      )}
    </>
  );
}
