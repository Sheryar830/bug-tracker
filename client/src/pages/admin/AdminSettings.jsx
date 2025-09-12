import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";

export default function AdminSettings() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [msg, setMsg] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState({ name: "", color: "#6c757d" });

  const [sla, setSla] = useState({ Critical: "", High: "", Medium: "", Low: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setMsg("");
    try {
      const [tagsRes, slaRes] = await Promise.all([
        api.get("/admin/tags", { headers }),
        api.get("/admin/sla", { headers }),
      ]);
      setTags(tagsRes.data || []);
      setSla(slaRes.data || {});
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const addTag = async (e) => {
    e.preventDefault(); setMsg("");
    try {
      await api.post("/admin/tags", newTag, { headers });
      setNewTag({ name: "", color: "#6c757d" });
      await load();
      setMsg("Tag created");
    } catch (e) {
      setMsg(e.response?.data?.message || "Create failed");
    }
  };

  const patchTag = async (id, patch) => {
    setMsg("");
    try {
      await api.patch(`/admin/tags/${id}`, patch, { headers });
      await load();
      setMsg("Tag updated");
    } catch (e) {
      setMsg(e.response?.data?.message || "Update failed");
    }
  };

  const removeTag = async (id) => {
    if (!window.confirm("Delete this tag?")) return;
    setMsg("");
    try {
      await api.delete(`/admin/tags/${id}`, { headers });
      await load();
      setMsg("Tag deleted");
    } catch (e) {
      setMsg(e.response?.data?.message || "Delete failed");
    }
  };

  const saveSla = async (e) => {
    e.preventDefault(); setMsg("");
    try {
      await api.patch("/admin/sla", {
        Critical: Number(sla.Critical),
        High: Number(sla.High),
        Medium: Number(sla.Medium),
        Low: Number(sla.Low),
      }, { headers });
      await load();
      setMsg("SLA updated");
    } catch (e) {
      setMsg(e.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Admin Settings</h3>
        {loading && <span className="text-muted small">Loading…</span>}
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* TAGS */}
      <div className="mb-4">
        <h5 className="mb-2">Tags</h5>
        <form onSubmit={addTag} className="row g-2 align-items-end">
          <div className="col-md-5">
            <label className="form-label">Name</label>
            <input className="form-control" value={newTag.name}
                   onChange={(e) => setNewTag(t => ({ ...t, name: e.target.value }))} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Color</label>
            <input type="color" className="form-control form-control-color"
                   value={newTag.color}
                   onChange={(e) => setNewTag(t => ({ ...t, color: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100">Add</button>
          </div>
        </form>

        <div className="table-responsive mt-3">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Color</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map(t => (
                <tr key={t._id}>
                  <td>
                    <input className="form-control form-control-sm"
                           defaultValue={t.name}
                           onBlur={(e) => e.target.value !== t.name && patchTag(t._id, { name: e.target.value })} />
                  </td>
                  <td>
                    <input type="color" className="form-control form-control-color"
                           defaultValue={t.color}
                           onChange={(e) => patchTag(t._id, { color: e.target.value })} />
                  </td>
                  <td>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => removeTag(t._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!tags.length && (
                <tr><td colSpan={3} className="text-center text-muted">No tags</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <hr />

      {/* SLA */}
      <div>
        <h5 className="mb-2">SLA Targets (hours)</h5>
        <form onSubmit={saveSla} className="row g-2">
          {["Critical","High","Medium","Low"].map(k => (
            <div className="col-md-3" key={k}>
              <label className="form-label">{k}</label>
              <input type="number" min="0" className="form-control"
                     value={sla[k] ?? ""}
                     onChange={(e) => setSla(s => ({ ...s, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="col-12 mt-2">
            <button className="btn btn-primary">Save SLA</button>
          </div>
        </form>
      </div>
    </div>
  );
}
