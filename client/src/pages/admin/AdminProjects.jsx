// client/src/pages/admin/AdminProjects.jsx
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import TableSkeleton from "../../components/ui/TableSkeleton";

import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";

export default function AdminProjects() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]); // NEW: all active users for dropdown
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    url: "",
  });
  const [member, setMember] = useState({ email: "", projectId: "" });

  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [removingMemberKey, setRemovingMemberKey] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/projects", { headers });
      setItems(data || []);
    } catch (e) {
      const m = e.response?.data?.message || "Failed to load projects";
      setMsg(m);
      Swal.fire("Load failed", m, "error");
    } finally {
      setLoading(false);
    }
  };

  // NEW: load active users (both testers & devs)
  const loadUsers = async () => {
    try {
      const { data } = await api.get("/admin/users", {
        headers,
        params: { active: "true", limit: 500 },
      });
      const list = data?.items ?? data ?? [];
      setUsers(list);
    } catch (_) {
      /* ignore */
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);
  useEffect(() => {
    loadUsers(); /* eslint-disable-next-line */
  }, []);

  const toast = (title = "Done", icon = "success") =>
    Swal.fire({
      title,
      icon,
      showConfirmButton: false,
      timer: 1200,
      position: "center",
      toast: false,
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

  const create = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/admin/projects", form, { headers });
      setForm({ name: "", key: "", description: "", url: "" });
      await load();
      setMsg("Project created");
      toast("Project created");
    } catch (e) {
      const m = e.response?.data?.message || "Create failed";
      setMsg(m);
      Swal.fire("Create failed", m, "error");
    }
  };

  const update = async (id, patch) => {
    setMsg("");
    try {
      await api.patch(`/admin/projects/${id}`, patch, { headers });
      await load();
      setMsg("Project updated");
      toast("Project updated");
    } catch (e) {
      const m = e.response?.data?.message || "Update failed";
      setMsg(m);
      Swal.fire("Update failed", m, "error");
    }
  };

  const handleRemoveProject = async (id, name) => {
    const res = await Swal.fire({
      title: "Delete this project?",
      text: `Project "${name || ""}" will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
    });
    if (!res.isConfirmed) return;

    setMsg("");
    setDeletingProjectId(id);
    try {
      await api.delete(`/admin/projects/${id}`, { headers });
      await load();
      setMsg("Project deleted");
      toast("Project deleted");
    } catch (e) {
      const m = e.response?.data?.message || "Delete failed";
      setMsg(m);
      Swal.fire("Delete failed", m, "error");
    } finally {
      setDeletingProjectId(null);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post(
        `/admin/projects/${member.projectId}/members`,
        { email: member.email }, // still sending email, backend stays the same
        { headers }
      );
      setMember({ email: "", projectId: "" });
      await load();
      setMsg("Member added");
      toast("Member added");
    } catch (e) {
      const m = e.response?.data?.message || "Add member failed";
      setMsg(m);
      Swal.fire("Add member failed", m, "error");
    }
  };

  const handleRemoveMember = async (projectId, userId, name) => {
    const res = await Swal.fire({
      title: "Remove this member?",
      text: name
        ? `Member "${name}" will be removed from the project.`
        : "Member will be removed from the project.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
    });
    if (!res.isConfirmed) return;

    setMsg("");
    const key = `${projectId}:${userId}`;
    setRemovingMemberKey(key);
    try {
      await api.delete(`/admin/projects/${projectId}/members/${userId}`, {
        headers,
      });
      await load();
      setMsg("Member removed");
      toast("Member removed");
    } catch (e) {
      const m = e.response?.data?.message || "Remove member failed";
      setMsg(m);
      Swal.fire("Remove member failed", m, "error");
    } finally {
      setRemovingMemberKey(null);
    }
  };

  const openableUrl = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

  // Compute available users for the selected project (exclude already added)
  const availableUsers = useMemo(() => {
    if (!member.projectId) return users;
    const proj = items.find((p) => p._id === member.projectId);
    const existingIds = new Set((proj?.members || []).map((m) => m._id));
    return users.filter((u) => !existingIds.has(u._id));
  }, [users, items, member.projectId]);

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Projects</h3>
        {loading && <span className="text-muted small">Loading…</span>}
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Create project */}
      <form
        onSubmit={create}
        className="row mb-3"
        style={{ "--bs-gutter-x": "14px" }}
      >
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="KEY (e.g. APP)"
            value={form.key}
            onChange={(e) =>
              setForm((f) => ({ ...f, key: e.target.value.toUpperCase() }))
            }
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="Project URL (optional)"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" disabled={loading}>
            Create
          </button>
        </div>
      </form>

      {/* Add member */}
      <form
        onSubmit={addMember}
        className="row mb-3"
        style={{ "--bs-gutter-x": "14px" }}
      >
        <div className="col-md-4">
          <select
            className="form-select"
            value={member.projectId}
            onChange={(e) =>
              setMember((m) => ({ ...m, projectId: e.target.value, email: "" }))
            }
            required
          >
            <option value="">Select project to add member</option>
            {items.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <select
            className="form-select"
            value={member.email}
            disabled={!member.projectId}
            onChange={(e) =>
              setMember((m) => ({ ...m, email: e.target.value }))
            }
            required
          >
            <option value="">
              {member.projectId
                ? "Select user (email)"
                : "Choose a project first"}
            </option>
            {availableUsers.map((u) => (
              <option key={u._id} value={u.email}>
                {u.name
                  ? `${u.name} • ${u.email} (${u.role})`
                  : `${u.email} (${u.role})`}
              </option>
            ))}
            {!availableUsers.length && member.projectId && (
              <option value="" disabled>
                No available users
              </option>
            )}
          </select>
        </div>

        <div className="col-md-2">
          <button
            className="btn btn-outline-primary w-100"
            disabled={loading || !member.projectId}
          >
            Add Member
          </button>
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
              <th>URL</th>
              <th>Members</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Fancy shimmer rows while projects load
              <TableSkeleton
                rows={5} // how many skeleton rows to show
                cols={6} // must match your table columns count
                pattern={["lg", "sm", "lg", "sm", "lg", "sm"]} // per-column heights (optional)
              />
            ) : (
              <>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        defaultValue={p.name}
                        onBlur={(e) =>
                          e.target.value !== p.name &&
                          update(p._id, { name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        defaultValue={p.key}
                        onBlur={(e) =>
                          e.target.value !== p.key &&
                          update(p._id, { key: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        defaultValue={p.description}
                        onBlur={(e) =>
                          e.target.value !== p.description &&
                          update(p._id, { description: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          className="form-control form-control-sm"
                          defaultValue={p.url || ""}
                          placeholder="https://…"
                          onBlur={(e) =>
                            e.target.value !== (p.url || "") &&
                            update(p._id, { url: e.target.value })
                          }
                        />
                        {p.url ? (
                          <a
                            href={openableUrl(p.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-light btn-sm"
                            title="Open project URL"
                          >
                            Open
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      {(p.members || []).map((m) => {
                        const key = `${p._id}:${m._id}`;
                        const removing = removingMemberKey === key;
                        return (
                          <span key={m._id} className="badge bg-secondary me-1">
                            {m.name} ({m.role})
                            <button
                              type="button"
                              className="btn btn-sm btn-light ms-1 py-0 px-1"
                              onClick={() =>
                                handleRemoveMember(p._id, m._id, m.name)
                              }
                              disabled={removing}
                              title="Remove member"
                            >
                              {removing ? "…" : "x"}
                            </button>
                          </span>
                        );
                      })}
                      {!p.members?.length && (
                        <span className="text-muted small">No members</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveProject(p._id, p.name)}
                        disabled={deletingProjectId === p._id}
                        title="Delete project"
                      >
                        {deletingProjectId === p._id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}

                {!items.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      No projects
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
