import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";

export default function ProfileSettings() {
  const { token, user, setUser, setToken } = useAuth(); // ensure AuthProvider exposes setUser/setToken
  const headers = { Authorization: `Bearer ${token}` };

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [msg, setMsg] = useState("");
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  const load = async () => {
    const { data } = await api.get("/me", { headers });
    setName(data.name);
    setEmail(data.email);
    setUser?.(data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const saveProfile = async (e) => {
    e.preventDefault(); setMsg("");
    try {
      const { data } = await api.patch("/me", { name, email }, { headers });
      // backend returns { user, token } so UI stays in sync with claims
      setUser?.(data.user);
      setToken?.(data.token);
      setMsg("Profile updated");
    } catch (err) {
      setMsg(err.response?.data?.message || "Update failed");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault(); setMsg("");
    if (pwd.newPassword !== pwd.confirm) return setMsg("Passwords do not match");
    try {
      await api.patch("/me/password", {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword
      }, { headers });
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      setMsg("Password updated");
    } catch (err) {
      setMsg(err.response?.data?.message || "Password update failed");
    }
  };

  return (
    <div className="card bg-white p-20 rounded-10 border border-white">
      <h3 className="mb-3">Profile Settings</h3>
      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="row" style={{ "--bs-gutter-x": "16px" }}>
        <div className="col-md-6">
          <form onSubmit={saveProfile} className="mb-4">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input className="form-control" value={name}
                     onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email}
                     onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit">Save Profile</button>
          </form>

          <form onSubmit={changePassword}>
            <h5 className="mb-2">Change Password</h5>
            <div className="mb-2">
              <input className="form-control" type="password" placeholder="Current password"
                     value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required />
            </div>
            <div className="mb-2">
              <input className="form-control" type="password" placeholder="New password"
                     value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required />
            </div>
            <div className="mb-3">
              <input className="form-control" type="password" placeholder="Confirm new password"
                     value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} required />
            </div>
            <button className="btn btn-outline-primary" type="submit">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
