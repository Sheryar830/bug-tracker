import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";

export default function DevIssueDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [it, setIt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const shortUrl = (u) => { try { return new URL(u).hostname.replace(/^www\./,""); } catch { return u; } };
  const tinyBadgeStyle = { maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12, padding: "5px 8px", display: "inline-block" };

  useEffect(() => {
    (async () => {
      setLoading(true); setMsg("");
      try {
        const { data } = await api.get(`/dev/issues/${id}`, { headers });
        setIt(data);
      } catch (e) {
        setMsg(e.response?.data?.message || "Failed to load issue");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, headers]);

  if (loading) return <div className="card bg-white p-20">Loading…</div>;
  if (!it) return (
    <div className="card bg-white p-20">
      {msg && <div className="alert alert-info">{msg}</div>}
      <Link to="/assigned-bugs" className="btn btn-outline-secondary">Back</Link>
    </div>
  );

  const files = (it.attachments || []).map(a => (typeof a === "string" ? { url: a, name: a } : a));

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h3 className="mb-1">{it.title}</h3>
          <div className="text-muted small">
            {it.projectId?.name} ({it.projectId?.key}) • Created {new Date(it.createdAt).toLocaleString()}
          </div>
        </div>
        <Link to="/assigned-bugs" className="btn btn-outline-secondary">← Back</Link>
      </div>

      <hr />

      <div className="row gy-3">
        <div className="col-md-4">
          <div className="mb-2"><strong>Status:</strong> {it.status}</div>
          <div className="mb-2"><strong>Severity:</strong> {it.severity}</div>
          <div className="mb-2"><strong>Priority:</strong> {it.priority}</div>
          <div className="mb-2">
            <strong>Assignee:</strong> {it.assigneeId ? "You" : "—"}
          </div>
          {it.pageUrl && (
            <div className="mb-2">
              <strong>Page URL:</strong>{" "}
              <a href={it.pageUrl} target="_blank" rel="noreferrer">{shortUrl(it.pageUrl)}</a>
            </div>
          )}
          {it.environment && (
            <div className="mb-2"><strong>Environment:</strong> {it.environment}</div>
          )}
          {!!it.tags?.length && (
            <div className="mb-2"><strong>Tags:</strong> {it.tags.join(", ")}</div>
          )}
        </div>

        <div className="col-md-8">
          <div className="mb-3">
            <strong>Description</strong>
            <div className="form-control mt-1" style={{ minHeight: 80, whiteSpace: "pre-wrap" }}>{it.description || "—"}</div>
          </div>
          <div className="mb-3">
            <strong>Steps to Reproduce</strong>
            <div className="form-control mt-1" style={{ minHeight: 80, whiteSpace: "pre-wrap" }}>{it.steps || "—"}</div>
          </div>

          <div className="mb-2">
            <strong>Attachments</strong>
            <div className="mt-2 d-flex gap-2 flex-wrap">
              {files.length ? files.map((a, i) => a?.url ? (
                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                   className="badge bg-secondary text-decoration-none" style={tinyBadgeStyle}
                   title={a.name || a.url}>
                  {(a.name || a.url).length > 28 ? (a.name || a.url).slice(0, 28) + "…" : (a.name || a.url)}
                </a>
              ) : null) : <span className="text-muted">—</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
