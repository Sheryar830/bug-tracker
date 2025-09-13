// client/src/pages/developer/AssignedBugs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import { Link } from "react-router-dom";

const STATUSES_FOR_DEV = ["OPEN", "IN_PROGRESS", "READY_FOR_TEST"];

export default function AssignedBugs() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    projectId: "",
    page: 1,
    limit: 20,
  });

  const pages = Math.max(Math.ceil(total / filters.limit), 1);

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const params = { ...filters };
      Object.keys(params).forEach(
        (k) => (params[k] === "" || params[k] == null) && delete params[k]
      );
      const { data } = await api.get("/dev/issues", { headers, params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/admin/projects", { headers }); // for filter
      setProjects(data || []);
    } catch (_) {}
  };

  useEffect(() => {
    loadProjects(); // eslint-disable-next-line
  }, []);
  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [filters.page, filters.limit, filters.status, filters.projectId]);

  // Re-init Bootstrap tooltips whenever the table items change
  useEffect(() => {
    if (!window.bootstrap?.Tooltip) return;
    const nodes = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltips = [...nodes].map((el) => new window.bootstrap.Tooltip(el));
    return () => tooltips.forEach((t) => t.dispose());
  }, [items]);

  const onSearch = () => setFilters((f) => ({ ...f, page: 1 }));
  const onSearchKey = (e) => {
    if (e.key === "Enter") onSearch();
  };

  const patchRow = async (id, patch) => {
    setMsg("");
    try {
      await api.patch(`/dev/issues/${id}`, patch, { headers });
      await load();
      setMsg("Updated");
    } catch (e) {
      setMsg(e.response?.data?.message || "Update failed");
    }
  };

  // --- UI helpers ---
  const shortUrl = (u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return u;
    }
  };
  const badgeLabel = (t) =>
    String(t || "").length > 18 ? String(t).slice(0, 18) + "…" : String(t || "");
  const tinyBadgeStyle = {
    maxWidth: 140,
    display: "inline-block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "11px",
    padding: "4px 6px",
  };

  const sevClass = (s) =>
    s === "Critical" ? "bg-danger" :
    s === "High"     ? "bg-warning text-dark" :
    s === "Medium"   ? "bg-info text-dark" :
    "bg-secondary";

  const priClass = (p) =>
    p === "P0" ? "bg-danger" :
    p === "P1" ? "bg-warning text-dark" :
    p === "P2" ? "bg-info text-dark" :
    "bg-secondary";

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Assigned Bugs</h3>
        {loading && <span className="text-muted small">Loading…</span>}
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Filters */}
      <div className="row mb-3" style={{ "--bs-gutter-x": "14px" }}>
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search title/description/steps"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={onSearchKey}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
            }
          >
            <option value="">Any status</option>
            {STATUSES_FOR_DEV.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filters.projectId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, projectId: e.target.value, page: 1 }))
            }
          >
            <option value="">Any project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={onSearch}>
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th style={{ minWidth: 280 }}>Title</th>
              <th>Project</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                {/* Title with compact URL + attachments */}
                <td style={{ maxWidth: 440 }}>
                  <div className="fw-medium text-truncate">{it.title}</div>

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

                  <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
                    {(() => {
                      const files = (it.attachments || []).map((a) =>
                        typeof a === "string" ? { url: a, name: a } : a
                      );
                      const firstTwo = files.slice(0, 2);
                      const extra = files.length - firstTwo.length;
                      return (
                        <>
                          {firstTwo.map((a, i) =>
                            a?.url ? (
                              <a
                                key={i}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="badge bg-secondary text-decoration-none"
                                title={a.name || a.url}
                                style={tinyBadgeStyle}
                              >
                                <i className="ri-attachment-2" />{" "}
                                {badgeLabel(a.name || a.url)}
                              </a>
                            ) : null
                          )}
                          {extra > 0 && (
                            <span
                              className="badge bg-light border text-muted"
                              style={{ fontSize: 11 }}
                            >
                              +{extra} more
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>

                <td className="small text-muted">{it.projectId?.key || "—"}</td>

                <td>
                  <span className={`badge ${sevClass(it.severity)}`}>
                    {it.severity}
                  </span>
                </td>

                <td>
                  <span className={`badge ${priClass(it.priority)}`}>
                    {it.priority}
                  </span>
                </td>

                <td style={{ minWidth: 180 }}>
                  <select
                    className="form-select form-select-sm"
                    value={it.status}
                    onChange={(e) => patchRow(it._id, { status: e.target.value })}
                    title="Update status"
                  >
                    {STATUSES_FOR_DEV.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="small text-muted">
                  {new Date(it.createdAt).toLocaleString()}
                </td>

                {/* Actions */}
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Link
                      to={`/dev/issues/${it._id}`}
                      className="btn btn-icon btn-outline-secondary"
                      title="View details"
                      data-bs-toggle="tooltip"
                      data-bs-title="View details"
                      aria-label="View details"
                    >
                      <i className="ri-eye-line" />
                    </Link>

                    {it.pageUrl && (
                      <a
                        href={it.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-icon btn-outline-primary"
                        title="Open page URL"
                        data-bs-toggle="tooltip"
                        data-bs-title="Open page URL"
                        aria-label="Open page URL"
                      >
                        <i className="ri-external-link-line" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td colSpan={7} className="text-center text-muted">
                  No assigned issues
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
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
