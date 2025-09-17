import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import TableSkeleton from "../../components/ui/TableSkeleton";

const ACTIONS = [
  { value: "", label: "Any action" },
  { value: "status_change", label: "Status changed" },
  { value: "unassign", label: "Unassigned" },
];

export default function BugHistory() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [filters, setFilters] = useState({
    q: "", action: "", projectId: "", page: 1, limit: 20,
  });

  const pages = Math.max(Math.ceil(total / filters.limit), 1);

  const shortUrl = (u) => {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
  };
  const badgeLabel = (s) => (String(s || "").length > 18 ? String(s).slice(0, 18) + "…" : s);
  const tinyBadgeStyle = {
    maxWidth: 140, display: "inline-block", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis", fontSize: 11, padding: "4px 6px",
  };

  const load = async () => {
    setLoading(true); setMsg("");
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => (params[k] === "" || params[k] == null) && delete params[k]);
      const { data } = await api.get("/dev/history", { headers, params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/admin/projects", { headers });
      setProjects(data || []);
    } catch (_) {}
  };

  useEffect(() => { loadProjects(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.page, filters.limit, filters.action, filters.projectId, filters.q]);

  const onSearch = () => setFilters(f => ({ ...f, page: 1 }));

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Bug History</h3>
        {loading && <span className="text-muted small">Loading…</span>}
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Filters */}
      <div className="row mb-3" style={{ "--bs-gutter-x": "14px" }}>
        <div className="col-md-4">
          <input className="form-control" placeholder="Search issue title"
                 value={filters.q} onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                 onKeyDown={(e) => e.key === "Enter" && onSearch()} />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filters.action}
                  onChange={(e) => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}>
            {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filters.projectId}
                  onChange={(e) => setFilters(f => ({ ...f, projectId: e.target.value, page: 1 }))}>
            <option value="">Any project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.key})</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={onSearch}>Search</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>When</th>
              <th>Issue</th>
              <th>Project</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
         <tbody>
  {loading ? (
    <TableSkeleton
      rows={6}                                // number of shimmer rows
      cols={5}                                // MUST match your <th> count
      pattern={["sm","lg","sm","sm","sm"]}    // optional per-column height
    />
  ) : (
    <>
      {items.map((row, idx) => {
        const h = row.h;
        const files = (row.attachments || []).map(a =>
          typeof a === "string" ? { url: a, name: a } : a
        );
        const firstTwo = files.slice(0, 2);
        const extra = files.length - firstTwo.length;

        return (
          <tr key={row._id + "_" + idx}>
            <td className="small text-muted">{new Date(h.at).toLocaleString()}</td>
            <td>
              <div className="fw-medium">{row.title}</div>
              {row.pageUrl && (
                <div className="small">
                  <a
                    href={row.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted"
                  >
                    {shortUrl(row.pageUrl)}
                  </a>
                </div>
              )}
              <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
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
                      {badgeLabel(a.name || a.url)}
                    </a>
                  ) : null
                )}
                {extra > 0 && (
                  <span className="badge bg-light border text-muted" style={{ fontSize: 11 }}>
                    +{extra} more
                  </span>
                )}
              </div>
            </td>
            <td className="small text-muted">{row.project?.key || "—"}</td>
            <td>{h.action === "status_change" ? "Status changed" : "Unassigned"}</td>
            <td className="small">
              {h.action === "status_change" ? (
                <span className="badge bg-light border text-muted">
                  {h.from} → {h.to}
                </span>
              ) : (
                <span className="badge bg-warning-subtle text-warning border">
                  Unassigned from issue
                </span>
              )}
            </td>
          </tr>
        );
      })}

      {!items.length && (
        <tr>
          <td colSpan={5} className="text-center text-muted">No history</td>
        </tr>
      )}
    </>
  )}
</tbody>

        </table>
      </div>

      {/* Pager */}
      <div className="d-flex align-items-center gap-2 mt-2">
        <span className="text-muted small">Total: {total}</span>
        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>Prev</button>
          <span className="small d-inline-block px-2">Page {filters.page} / {pages}</span>
          <button className="btn btn-outline-secondary btn-sm"
                  disabled={filters.page >= pages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next</button>
          <select className="form-select form-select-sm" style={{ width: 80 }}
                  value={filters.limit}
                  onChange={(e) => setFilters(f => ({ ...f, limit: Number(e.target.value), page: 1 }))}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
