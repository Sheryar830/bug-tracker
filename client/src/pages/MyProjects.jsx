// client/src/pages/MyProjects.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";
import TableSkeleton from "../components/ui/TableSkeleton";

const hrefFor = (url) => {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

export default function MyProjects() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await api.get("/projects/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(data || []);
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="mb-0">My Projects</h3>
        {loading && <span className="small text-muted">Loading…</span>}
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Description</th>
              <th>Link</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton
                rows={6} // how many shimmer rows to show
                cols={5} // MUST match your <th> count
                pattern={["lg", "sm", "lg", "sm", "sm"]} // optional per-column height
              />
            ) : (
              <>
                {items.map((p) => {
                  const href = hrefFor(p.url);
                  return (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td className="text-muted">{p.key}</td>
                      <td className="text-muted">{p.description || "—"}</td>
                      <td>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-light btn-sm"
                            title={p.url}
                          >
                            Open
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-muted">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {!items.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
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
