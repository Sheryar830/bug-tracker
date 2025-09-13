// client/src/pages/admin/AdminAllBugs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const STATUSES = ["NEW","OPEN","IN_PROGRESS","READY_FOR_TEST","REOPENED","CLOSED"];
const PRIORITIES = ["P0","P1","P2","P3"];
const SEVERITIES = ["Critical","High","Medium","Low"];

export default function AdminAllBugs() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [deletingId, setDeletingId] = useState(null); // for spinner/disable on delete
  const [filters, setFilters] = useState({
    q: "", status: "", severity: "", priority: "", projectId: "", assigneeId: "", page: 1, limit: 20,
  });

  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const pages = Math.max(Math.ceil(total / filters.limit), 1);

  const toast = (title = "Done", icon = "success") =>
  Swal.fire({
    title,
    icon,
    showConfirmButton: false,
    timer: 1200,
    // centered modal (default), NOT a toast
    position: "center",
    toast: false,
    backdrop: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  const load = async () => {
    setLoading(true); setMsg("");
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => (params[k] === "" || params[k] == null) && delete params[k]);
      const { data } = await api.get("/admin/issues", { headers, params });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setSelected(new Set());
    } catch (e) {
      const m = e.response?.data?.message || "Failed to load issues";
      setMsg(m);
      Swal.fire("Load failed", m, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [projRes, devRes] = await Promise.all([
        api.get("/admin/projects", { headers }),
        api.get("/admin/users", { headers, params: { role: "DEVELOPER", active: "true", limit: 500 } }),
      ]);
      setProjects(projRes.data || []);
      const devs = (devRes.data?.items ?? devRes.data) || [];
      setDevelopers(devs);
      if (!devs.length) setMsg("No active developers found. Create/activate a DEVELOPER user.");
    } catch (e) {
      const m = e.response?.data?.message || "Failed to load projects/developers";
      setMsg(m);
      Swal.fire("Load failed", m, "error");
    }
  };

  useEffect(() => { loadMeta(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [
    filters.page, filters.limit, filters.status, filters.severity, filters.priority, filters.projectId, filters.assigneeId
  ]);

  // init Bootstrap tooltips when rows change
  useEffect(() => {
    if (!window.bootstrap?.Tooltip) return;
    const nodes = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltips = [...nodes].map((el) => new window.bootstrap.Tooltip(el));
    return () => tooltips.forEach((t) => t.dispose());
  }, [items]);

  const onSearch = () => setFilters(f => ({ ...f, page: 1 }));
  const onSearchKey = (e) => { if (e.key === "Enter") onSearch(); };

  const toggleRow = (id) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAllOnPage = () => {
    setSelected(s => {
      const ids = items.map(i => i._id);
      const allSelected = ids.every(id => s.has(id));
      return allSelected ? new Set() : new Set(ids);
    });
  };

  const patchRow = async (id, patch) => {
    setMsg("");
    try {
      await api.patch(`/admin/issues/${id}`, patch, { headers });
      await load();
      setMsg("Issue updated");
      toast("Issue updated");
    } catch (e) {
      const m = e.response?.data?.message || "Update failed";
      setMsg(m);
      Swal.fire("Update failed", m, "error");
    }
  };

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
    if (res.isConfirmed) remove(id);
  };

  const remove = async (id) => {
    setMsg("");
    setDeletingId(id);
    try {
      await api.delete(`/admin/issues/${id}`, { headers });
      await load();
      setMsg("Issue deleted");
      toast("Issue deleted");
    } catch (e) {
      const m = e.response?.data?.message || "Delete failed";
      setMsg(m);
      Swal.fire("Delete failed", m, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const bulk = async (patch) => {
    if (!selected.size) return;
    setMsg("");
    try {
      await api.post("/admin/issues/bulk", { ids: [...selected], patch }, { headers });
      await load();
      setMsg("Bulk update complete");
      toast("Bulk update complete");
    } catch (e) {
      const m = e.response?.data?.message || "Bulk update failed";
      setMsg(m);
      Swal.fire("Bulk update failed", m, "error");
    }
  };

  // --- Compact title cell helpers ---
  const shortUrl = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
  const badgeLabel = (t) => (String(t || "").length > 18 ? String(t).slice(0, 18) + "…" : String(t || ""));
  const tinyBadgeStyle = {
    maxWidth: 140, display: "inline-block", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis", fontSize: "11px", padding: "4px 6px",
  };

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">All Bugs</h3>
        {loading && <span className="text-muted small">Loading…</span>}
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Filters */}
      <div className="row mb-3" style={{ "--bs-gutter-x": "14px" }}>
        <div className="col-md-3">
          <input className="form-control" placeholder="Search title/description/steps"
                 value={filters.q} onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))} onKeyDown={onSearchKey} />
        </div>
        <div className="col-md-2">
          <select className="form-select" value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">Any status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select" value={filters.severity}
                  onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value, page: 1 }))}>
            <option value="">Any severity</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select" value={filters.priority}
                  onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))}>
            <option value="">Any priority</option>
            {PRIORITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filters.projectId}
                  onChange={(e) => setFilters(f => ({ ...f, projectId: e.target.value, page: 1 }))}>
            <option value="">Any project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.key})</option>)}
          </select>
        </div>
        <div className="col-md-3 mt-2">
          <select className="form-select" value={filters.assigneeId}
                  onChange={(e) => setFilters(f => ({ ...f, assigneeId: e.target.value, page: 1 }))}>
            <option value="">Any assignee</option>
            <option value="null">Unassigned</option>
            {developers.map(d => <option key={d._id} value={d._id}>{d.name} • {d.email}</option>)}
          </select>
        </div>
        <div className="col-md-2 mt-2">
          <button className="btn btn-primary w-100" onClick={onSearch}>Search</button>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="d-flex align-items-center gap-2 mb-2">
        <span className="small text-muted">Selected: {selected.size}</span>
        <div className="ms-auto d-flex gap-2">
          <select className="form-select form-select-sm" onChange={(e) => e.target.value && bulk({ status: e.target.value })}>
            <option value="">Bulk set status…</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select form-select-sm" onChange={(e) => e.target.value && bulk({ priority: e.target.value })}>
            <option value="">Bulk set priority…</option>
            {PRIORITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select form-select-sm"
                  onChange={(e) => e.target.value && bulk({ assigneeId: e.target.value === "null" ? null : e.target.value })}>
            <option value="">Bulk assign…</option>
            <option value="null">Unassigned</option>
            {developers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" onChange={toggleAllOnPage}
                       checked={items.length > 0 && items.every(i => selected.has(i._id))} />
              </th>
              <th>Title</th>
              <th>Project</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Assign</th>
              <th>Created</th>
              <th style={{ width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td>
                  <input type="checkbox" checked={selected.has(it._id)} onChange={() => toggleRow(it._id)} />
                </td>

                {/* Title cell: compact URL + short attachment chips */}
                <td style={{ maxWidth: 420 }}>
                  <div className="fw-medium text-truncate">{it.title}</div>
                  {it.pageUrl && (
                    <div className="small">
                      <a href={it.pageUrl} target="_blank" rel="noreferrer" className="text-muted">
                        {shortUrl(it.pageUrl)}
                      </a>
                    </div>
                  )}
                  <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
                    {(() => {
                      const files = (it.attachments || []).map(a => (typeof a === "string" ? { url: a, name: a } : a));
                      const firstTwo = files.slice(0, 2);
                      const extra = files.length - firstTwo.length;
                      return (
                        <>
                          {firstTwo.map((a, i) =>
                            a?.url ? (
                              <a key={i} href={a.url} target="_blank" rel="noreferrer"
                                 className="badge bg-secondary text-decoration-none" title={a.name || a.url}
                                 style={tinyBadgeStyle}>
                                {badgeLabel(a.name || a.url)}
                              </a>
                            ) : null
                          )}
                          {extra > 0 && (
                            <span className="badge bg-light border text-muted" style={{ fontSize: 11 }}>
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
                  <select className="form-select form-select-sm" value={it.severity}
                          onChange={(e) => patchRow(it._id, { severity: e.target.value })}>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>

                <td>
                  <select className="form-select form-select-sm" value={it.priority}
                          onChange={(e) => patchRow(it._id, { priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>

                <td>
                  <select className="form-select form-select-sm" value={it.status}
                          onChange={(e) => patchRow(it._id, { status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>

                <td>
                  <select className="form-select form-select-sm" value={it.assigneeId || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            patchRow(it._id, { assigneeId: v === "" ? null : v });
                          }}>
                    <option value="">Unassigned</option>
                    {developers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </td>

                <td>
                  <select className="form-select form-select-sm" defaultValue=""
                          disabled={!developers.length}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) return;
                            patchRow(it._id, { assigneeId: v });
                            e.target.value = ""; // reset placeholder
                          }}>
                    <option value="" disabled>{developers.length ? "Assign…" : "No developers"}</option>
                    {developers.map(d => <option key={d._id} value={d._id}>{d.name} • {d.email}</option>)}
                  </select>
                </td>

                <td className="small text-muted">{new Date(it.createdAt).toLocaleString()}</td>

                <td>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/all-bugs/${it._id}`}
                      className="btn btn-icon btn-outline-secondary"
                      title="View details"
                      data-bs-toggle="tooltip"
                      data-bs-title="View details"
                      aria-label="View details"
                    >
                      <i className="ri-eye-line" />
                    </Link>

                    <button
                      className="btn btn-icon btn-outline-danger"
                      onClick={() => confirmDelete(it._id)}
                      title="Delete"
                      data-bs-toggle="tooltip"
                      data-bs-title="Delete"
                      aria-label="Delete"
                      disabled={deletingId === it._id}
                    >
                      {deletingId === it._id
                        ? <i className="ri-loader-4-line ri-spin" />
                        : <i className="ri-delete-bin-6-line" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr><td colSpan={10} className="text-center text-muted">No issues</td></tr>
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
