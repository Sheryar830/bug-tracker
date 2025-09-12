import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { api } from "../api";

export default function ReportBug() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);

  const [form, setForm] = useState({
    projectId: "",                 // ← NEW
    title: '', description: '', steps: '',
    pageUrl: '', environment: '', severity: 'Low',
    attachments: []
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/projects/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(data || []);
        if ((data || []).length && !form.projectId) {
          setForm(f => ({ ...f, projectId: data[0]._id })); // default to first
        }
      } catch {}
    })();
    // eslint-disable-next-line
  }, []);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const addAttachment = () => {
    const url = prompt('Paste image/video URL');
    if (url) setForm(f => ({ ...f, attachments: [...f.attachments, { url, name: url }] }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.post('/issues', form, { headers: { Authorization: `Bearer ${token}` } });
      setForm({
        projectId: projects[0]?._id || "",
        title: '', description: '', steps: '',
        pageUrl: '', environment: '', severity: 'Low',
        attachments: []
      });
      setMsg('Bug reported successfully.');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Request failed';
      setMsg(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <h3 className="mb-20">Report Bug</h3>

      {msg && <div className="alert alert-info">{msg}</div>}

      <form onSubmit={submit}>
        <div className="row" style={{ '--bs-gutter-x': '20px' }}>
          {/* Project select */}
          <div className="col-md-6 mb-3">
            <label className="label fs-16 mb-2">Project</label>
            <select
              className="form-select"
              name="projectId"
              value={form.projectId}
              onChange={onChange}
            >
              {projects.length === 0 && <option value="">No project (optional)</option>}
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.key})</option>
              ))}
            </select>
          </div>

          {/* Page URL */}
          <div className="col-md-6 mb-3">
            <label className="label fs-16 mb-2">Page URL</label>
            <input className="form-control" name="pageUrl" value={form.pageUrl}
                   onChange={onChange} placeholder="https://app/page-with-bug" />
          </div>

          {/* Title */}
          <div className="col-md-12 mb-3">
            <label className="label fs-16 mb-2">Title</label>
            <input className="form-control" name="title" value={form.title} onChange={onChange} required />
          </div>

          {/* Description */}
          <div className="col-md-12 mb-3">
            <label className="label fs-16 mb-2">Description</label>
            <textarea className="form-control" name="description" rows="3" value={form.description} onChange={onChange} />
          </div>

          {/* Steps */}
          <div className="col-md-12 mb-3">
            <label className="label fs-16 mb-2">Steps to Reproduce</label>
            <textarea className="form-control" name="steps" rows="3" value={form.steps} onChange={onChange} placeholder="1) ... 2) ..." />
          </div>

          {/* Environment */}
          <div className="col-md-6 mb-3">
            <label className="label fs-16 mb-2">Environment</label>
            <input className="form-control" name="environment" value={form.environment}
                   onChange={onChange} placeholder="Windows 11 / Chrome 128" />
          </div>

          {/* Severity */}
          <div className="col-md-6 mb-3">
            <label className="label fs-16 mb-2">Severity</label>
            <select className="form-select" name="severity" value={form.severity} onChange={onChange}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </div>

          {/* Attachments */}
          <div className="col-md-12 mb-3">
            <label className="label fs-16 mb-2">Attachments</label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {form.attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                   className="badge bg-secondary text-decoration-none">
                  {a.name?.slice(0,30) || 'file'}
                </a>
              ))}
            </div>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={addAttachment}>
              + Add URL (image/video)
            </button>
          </div>
        </div>

        <div className="mt-3">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Submit Bug'}
          </button>
        </div>
      </form>
    </div>
  );
}
