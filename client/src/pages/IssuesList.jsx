// client/src/pages/IssuesList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";

export default function IssuesList() {
  const { token, user } = useAuth(); // also get user for permission check
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null); // track a row being deleted
  const [filters, setFilters] = useState({
    mine: "reported", // '', 'reported', 'assigned'
    status: "",
    severity: "",
    q: "",
    page: 1,
    limit: 10,
  });

  const params = useMemo(() => {
    const p = { page: filters.page, limit: filters.limit };
    if (filters.mine) p.mine = filters.mine;
    if (filters.status) p.status = filters.status;
    if (filters.severity) p.severity = filters.severity;
    if (filters.q) p.q = filters.q;
    return p;
  }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/issues", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit, params.mine, params.status, params.severity, params.q]);

  const pages = Math.max(Math.ceil(total / filters.limit), 1);

  // ---- UI helpers ----
  const shortUrl = (u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return u;
    }
  };
  const clip = (s, n = 20) => (String(s || "").length > n ? String(s).slice(0, n) + "…" : s);

  const sevClass = (s) =>
    s === "Critical" ? "bg-danger" :
    s === "High"     ? "bg-warning text-dark" :
    s === "Medium"   ? "bg-info text-dark" :
    "bg-secondary";

  const statusClass = (s) => {
    switch (s) {
      case "NEW": return "bg-secondary";
      case "OPEN": return "bg-primary";
      case "IN_PROGRESS": return "bg-info text-dark";
      case "READY_FOR_TEST": return "bg-warning text-dark";
      case "REOPENED": return "bg-dark";
      case "CLOSED": return "bg-success";
      default: return "bg-secondary";
    }
  };

  // Re-init Bootstrap tooltips when items change
  useEffect(() => {
    if (!window.bootstrap?.Tooltip) return;
    const nodes = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltips = [...nodes].map((el) => new window.bootstrap.Tooltip(el));
    return () => tooltips.forEach((t) => t.dispose());
  }, [items]);

  // ---- Delete issue (only reporter or admin) ----
  const confirmDelete = async (id) => {
    const res = await Swal.fire({
      title: "Delete this issue?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
    });
    if (res.isConfirmed) removeIssue(id);
  };

  const removeIssue = async (id) => {
    setRemovingId(id);
    try {
      await api.delete(`/issues/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic UI update
      setItems((arr) => arr.filter((x) => x._id !== id));
      setTotal((t) => Math.max(t - 1, 0));
    } catch (e) {
      Swal.fire("Delete failed", e.response?.data?.message || "Please try again.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between">
        <h3 className="mb-3">Issues</h3>
        {loading && <span className="text-muted small">Loading…</span>}
      </div>

      <div className="row" style={{ "--bs-gutter-x": "14px" }}>
        <div className="col-md-2 mb-2">
          <label className="form-label">Mine</label>
          <select
            className="form-select"
            value={filters.mine}
            onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="reported">Reported by me</option>
            <option value="assigned">Assigned to me</option>
          </select>
        </div>
        <div className="col-md-2 mb-2">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          >
            <option value="">Any</option>
            {["NEW", "OPEN", "IN_PROGRESS", "READY_FOR_TEST", "CLOSED", "REOPENED"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2 mb-2">
          <label className="form-label">Severity</label>
          <select
            className="form-select"
            value={filters.severity}
            onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value, page: 1 }))}
          >
            <option value="">Any</option>
            {["Low", "Medium", "High", "Critical"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-2">
          <label className="form-label">Search</label>
          <input
            className="form-control"
            placeholder="title / description / steps"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
          />
        </div>
        <div className="col-md-2 mb-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="table-responsive mt-3">
        <table className="table align-middle">
          <thead>
            <tr>
              <th style={{ minWidth: 280 }}>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reported</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const canDelete =
                String(it.reporterId) === String(user?.id) || user?.role === "ADMIN";
              const created = it.createdAt ? new Date(it.createdAt).toLocaleString() : "—";
              const files = (it.attachments || []).map((a) =>
                typeof a === "string" ? { url: a, name: a } : a
              );

              return (
                <tr key={it._id}>
                  <td style={{ maxWidth: 520 }}>
                    <div className="fw-medium text-truncate" title={it.title}>
                      {it.title}
                    </div>

                    {it.pageUrl && (
                      <div className="small">
                        <a
                          href={it.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted text-decoration-none"
                          title={it.pageUrl}
                        >
                          <i className="ri-external-link-line me-1" />
                          {shortUrl(it.pageUrl)}
                        </a>
                      </div>
                    )}

                    {!!files.length && (
                      <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
                        {files.slice(0, 3).map((a, i) =>
                          a?.url ? (
                            <a
                              key={i}
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="badge bg-secondary text-decoration-none"
                              title={a.name || a.url}
                            >
                              <i className="ri-attachment-2" /> {clip(a.name || a.url, 22)}
                            </a>
                          ) : null
                        )}
                        {files.length > 3 && (
                          <span className="badge bg-light border text-muted" style={{ fontSize: 11 }}>
                            +{files.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className={`badge ${sevClass(it.severity)}`}>{it.severity}</span>
                  </td>

                  <td>
                    <span className={`badge ${statusClass(it.status)}`}>{it.status}</span>
                  </td>

                  {/* Reported date */}
                  <td className="small text-muted">{created}</td>

                  {/* Actions */}
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {/* <Link
                        to={`/issues/${it._id}`}
                        className="btn btn-icon btn-outline-secondary"
                        title="View details"
                        data-bs-toggle="tooltip"
                        data-bs-title="View details"
                        aria-label="View details"
                      >
                        <i className="ri-eye-line" />
                      </Link> */}

                      {canDelete ? (
                        <button
                          className="btn btn-icon btn-outline-danger"
                          disabled={removingId === it._id}
                          onClick={() => confirmDelete(it._id)}
                          title="Delete"
                          data-bs-toggle="tooltip"
                          data-bs-title="Delete"
                          aria-label="Delete"
                        >
                          {removingId === it._id ? (
                            <i className="ri-loader-4-line ri-spin" />
                          ) : (
                            <i className="ri-delete-bin-6-line" />
                          )}
                        </button>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!items.length && !loading && (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No issues found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex align-items-center gap-2 mt-2">
        <span className="text-muted small">Total: {total}</span>
        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Prev
          </button>
          <span className="small d-inline-block px-2">
            Page {filters.page} / {pages}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={filters.page >= pages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </button>
          <select
            className="form-select form-select-sm"
            style={{ width: 80 }}
            value={filters.limit}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                limit: Number(e.target.value),
                page: 1,
              }))
            }
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
