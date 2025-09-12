// client/src/pages/IssuesList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";

export default function IssuesList() {
  const { token, user } = useAuth();                 // ← also get user for permission check
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null); // ← track a row being deleted
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

  // ---- Delete issue (only reporter or admin) ----
  const removeIssue = async (id) => {
    if (!window.confirm("Delete this issue? This cannot be undone.")) return;
    setRemovingId(id);
    try {
      await api.delete(`/issues/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic UI update
      setItems((arr) => arr.filter((x) => x._id !== id));
      setTotal((t) => Math.max(t - 1, 0));
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <h3 className="mb-3">Issues</h3>

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
            {["NEW", "OPEN", "IN_PROGRESS", "READY_FOR_TEST", "CLOSED", "REOPENED"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
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
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Reported</th>
              <th>Actions</th> {/* new column */}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const canDelete =
                String(it.reporterId) === String(user?.id) || user?.role === "ADMIN";

              return (
                <tr key={it._id}>
                  <td>
                    <div className="fw-medium">{it.title}</div>
                    <div className="small text-muted">{it.pageUrl}</div>
                    {(it.attachments || [])
                      .slice(0, 3)
                      .map((a, i) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="badge bg-secondary me-1 text-decoration-none"
                        >
                          {(a.name || a.url).slice(0, 20)}
                        </a>
                      ))}
                  </td>
                  <td>{it.severity}</td>
                  <td>{it.status}</td>
                  <td className="small text-muted">{it.assigneeId || "—"}</td>
                  <td className="small text-muted">
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {canDelete ? (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={removingId === it._id}
                        onClick={() => removeIssue(it._id)}
                      >
                        {removingId === it._id ? "Deleting..." : "Delete"}
                      </button>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!items.length && !loading && (
              <tr>
                <td colSpan={6} className="text-center text-muted">
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
