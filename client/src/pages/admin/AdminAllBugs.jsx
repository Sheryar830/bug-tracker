import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";

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
  const [filters, setFilters] = useState({
    q: "", status: "", severity: "", priority: "", projectId: "", assigneeId: "", page: 1, limit: 20,
  });

  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const pages = Math.max(Math.ceil(total / filters.limit), 1);

  const load = async () => {
    setLoading(true); setMsg("");
    try {
      const params = { ...filters };
      // empty values removed
      Object.keys(params).forEach(k => (params[k] === "" || params[k] == null) && delete params[k]);
      const { data } = await api.get("/admin/issues", { headers, params });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setSelected(new Set()); // reset selection on reload
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to load issues");
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
      setDevelopers(devRes.data?.items || []);
    } catch (_) {}
  };

  useEffect(() => { loadMeta(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.page, filters.limit, filters.status, filters.severity, filters.priority, filters.projectId, filters.assigneeId]);

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
    } catch (e) {
      setMsg(e.response?.data?.message || "Update failed");
    }
  };

  const bulk = async (patch) => {
    if (!selected.size) return;
    setMsg("");
    try {
      await api.post("/admin/issues/bulk", { ids: [...selected], patch }, { headers });
      await load();
      setMsg("Bulk update complete");
    } catch (e) {
      setMsg(e.response?.data?.message || "Bulk update failed");
    }
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
                 value={filters.q} onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                 onKeyDown={onSearchKey} />
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
          <select className="form-select form-select-sm" onChange={(e) => e.target.value && bulk({ assigneeId: e.target.value === "null" ? "" : e.target.value })}>
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
                <input type="checkbox"
                       onChange={toggleAllOnPage}
                       checked={items.length > 0 && items.every(i => selected.has(i._id))} />
              </th>
              <th>Title</th>
              <th>Project</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td>
                  <input type="checkbox" checked={selected.has(it._id)} onChange={() => toggleRow(it._id)} />
                </td>
                <td className="fw-medium">{it.title}</td>
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
                  <select className="form-select form-select-sm"
                          value={it.assigneeId || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            patchRow(it._id, { assigneeId: v === "" ? "" : v });
                          }}>
                    <option value="">Unassigned</option>
                    {developers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </td>
                <td className="small text-muted">{new Date(it.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr><td colSpan={8} className="text-center text-muted">No issues</td></tr>
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
