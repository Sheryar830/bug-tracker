// client/src/pages/admin/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import TableSkeleton from "../../components/ui/TableSkeleton"; // ⬅️ add this import

// Hide ADMIN everywhere (filter + change role)
const ROLE_FILTER_OPTIONS = ["DEVELOPER", "TESTER"];
const ROLE_CHANGE_OPTIONS = ["DEVELOPER", "TESTER"];

export default function AdminUsers() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    role: "",
    active: "all",
    page: 1,
    limit: 20,
  });

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const params = { page: filters.page, limit: filters.limit };
      if (filters.q) params.q = filters.q;
      if (filters.role) params.role = filters.role;
      if (filters.active === "true" || filters.active === "false") params.active = filters.active;

      const { data } = await api.get("/admin/users", { headers, params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.role, filters.active]);

  const onSearchKey = (e) => {
    if (e.key === "Enter") setFilters((f) => ({ ...f, page: 1 }));
  };

  const changeRole = async (id, role) => {
    setMsg("");
    try {
      await api.patch(`/admin/users/${id}/role`, { role }, { headers });
      await load();
      setMsg("Role updated");
    } catch (e) {
      setMsg(e.response?.data?.message || "Role update failed");
    }
  };

  const toggleActive = async (u) => {
    if (!window.confirm(`${u.isActive ? "Deactivate" : "Activate"} ${u.name}?`)) return;
    setMsg("");
    try {
      await api.patch(`/admin/users/${u._id}/state`, { isActive: !u.isActive }, { headers });
      await load();
      setMsg("User state updated");
    } catch (e) {
      setMsg(e.response?.data?.message || "Update failed");
    }
  };

  const pages = Math.max(Math.ceil(total / filters.limit), 1);

  return (
    <div className="card bg-white p-20 rounded-10 border border-white mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">Users</h3>
        {/* (Optional) keep a tiny text indicator */}
        {loading && <span className="text-muted small">Loading…</span>}
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Filters */}
      <div className="row mb-3" style={{ "--bs-gutter-x": "14px" }}>
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search name or email"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={onSearchKey}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
          >
            <option value="">Any role</option>
            {ROLE_FILTER_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filters.active}
            onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value, page: 1 }))}
          >
            <option value="all">Active + Inactive</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={() => setFilters((f) => ({ ...f, page: 1 }))}>
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive table-skeleton-wrap">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Fancy skeleton while loading
              <TableSkeleton
                rows={5}
                cols={5}
                pattern={["lg", "lg", "sm", "sm", "lg"]}
              />
            ) : (
              <>
                {items.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td className="small text-muted">{u.email}</td>
                    <td>
                      {u.role === "ADMIN" ? (
                        <span className="badge bg-dark">ADMIN</span>
                      ) : (
                        <select
                          className="form-select form-select-sm"
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value)}
                        >
                          {ROLE_CHANGE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Inactive</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => toggleActive(u)}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}

                {!items.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      No users
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="d-flex align-items-center gap-2 mt-2">
        <span className="text-muted small">Total: {total}</span>
        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={filters.page <= 1 || loading}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Prev
          </button>
          <span className="small d-inline-block px-2">
            Page {filters.page} / {pages}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={filters.page >= pages || loading}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </button>
          <select
            className="form-select form-select-sm"
            style={{ width: 80 }}
            value={filters.limit}
            onChange={(e) =>
              setFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))
            }
            disabled={loading}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
