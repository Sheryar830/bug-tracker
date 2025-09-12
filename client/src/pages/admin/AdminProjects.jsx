// client/src/pages/admin/AdminProjects.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";

export default function AdminProjects() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", key: "", description: "", url: "" }); // <-- url
  const [member, setMember] = useState({ email: "", projectId: "" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/projects", { headers });
      setItems(data || []);
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async (e) => {
    e.preventDefault(); setMsg("");
    try {
      await api.post("/admin/projects", form, { headers });       // sends url too
      setForm({ name: "", key: "", description: "", url: "" });
      await load();
      setMsg("Project created");
    } catch (e) {
      setMsg(e.response?.data?.message || "Create failed");
    }
  };

  const update = async (id, patch) => {
    setMsg("");
    try {
      await api.patch(`/admin/projects/${id}`, patch, { headers }); // can patch url
      await load();
      setMsg("Project updated");
    } catch (e) {
      setMsg(e.response?.data?.message || "Update failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    setMsg("");
    try {
      await api.delete(`/admin/projects/${id}`, { headers });
      await load();
      setMsg("Project deleted");
    } catch (e) {
      setMsg(e.response?.data?.message || "Delete failed");
    }
  };

  const addMember = async (e) => {
    e.preventDefault(); setMsg("");
    try {
      await api.post(`/admin/projects/${member.projectId}/members`, { email: member.email }, { headers });
      setMember({ email: "", projectId: "" });
      await load();
      setMsg("Member added");
    } catch (e) {
      setMsg(e.response?.data?.message || "Add member failed");
    }
  };

  const removeMember = async (projectId, userId) => {
    setMsg("");
    try {
      await api.delete(`/admin/projects/${projectId}/members/${userId}`, { headers });
      await load();
      setMsg("Member removed");
    } catch (e) {
      setMsg(e.response?.data?.message || "Remove member failed");
    }
  };

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Projects</h3>
        {loading && <span className="text-muted small">Loading…</span>}
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Create project */}
      <form onSubmit={create} className="row mb-3" style={{ "--bs-gutter-x": "14px" }}>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="KEY (e.g. APP)"
            value={form.key}
            onChange={(e) => setForm(f => ({ ...f, key: e.target.value }))}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="Project URL (optional)"
            value={form.url}
            onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100">Create</button>
        </div>
      </form>

      {/* Add member */}
      <form onSubmit={addMember} className="row mb-3" style={{ "--bs-gutter-x": "14px" }}>
        <div className="col-md-4">
          <select
            className="form-select"
            value={member.projectId}
            onChange={(e) => setMember(m => ({ ...m, projectId: e.target.value }))}
            required
          >
            <option value="">Select project to add member</option>
            {items.map(p => <option key={p._id} value={p._id}>{p.name} ({p.key})</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <input
            className="form-control"
            type="email"
            placeholder="Member email"
            value={member.email}
            onChange={(e) => setMember(m => ({ ...m, email: e.target.value }))}
            required
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-outline-primary w-100">Add Member</button>
        </div>
      </form>

      {/* Table */}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Description</th>
              <th>URL</th> {/* <-- NEW */}
              <th>Members</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p._id}>
                <td>
                  <input
                    className="form-control form-control-sm"
                    defaultValue={p.name}
                    onBlur={(e) => e.target.value !== p.name && update(p._id, { name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    defaultValue={p.key}
                    onBlur={(e) => e.target.value !== p.key && update(p._id, { key: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    defaultValue={p.description}
                    onBlur={(e) => e.target.value !== p.description && update(p._id, { description: e.target.value })}
                  />
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      className="form-control form-control-sm"
                      defaultValue={p.url || ""}
                      placeholder="https://…"
                      onBlur={(e) => e.target.value !== (p.url || "") && update(p._id, { url: e.target.value })}
                    />
                    {p.url ? (
                      <a href={/^https?:\/\//i.test(p.url) ? p.url : `https://${p.url}`}
                         target="_blank" rel="noreferrer"
                         className="btn btn-light btn-sm">
                        Open
                      </a>
                    ) : null}
                  </div>
                </td>
                <td>
                  {(p.members || []).map(m => (
                    <span key={m._id} className="badge bg-secondary me-1">
                      {m.name} ({m.role})
                      <button
                        type="button"
                        className="btn btn-sm btn-light ms-1 py-0 px-1"
                        onClick={() => removeMember(p._id, m._id)}
                      >
                        x
                      </button>
                    </span>
                  ))}
                  {!p.members?.length && <span className="text-muted small">No members</span>}
                </td>
                <td>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => remove(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr><td colSpan={6} className="text-center text-muted">No projects</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
