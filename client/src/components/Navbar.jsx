import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';


export default function Navbar() {
const { user, logout } = useAuth();
const nav = useNavigate();


const handleLogout = () => { logout(); nav('/login'); };


return (
<nav className="navbar navbar-expand bg-light mb-3">
<div className="container">
<Link to="/" className="navbar-brand">BugTracker</Link>
<div className="d-flex gap-3 ms-auto">
{user ? (
<>
<span className="navbar-text">Hi, {user.name} <small className="text-muted">({user.role})</small></span>
<Link to="/" className="btn btn-outline-secondary btn-sm">Dashboard</Link>
<button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
</>
) : (
<>
<Link to="/login" className="btn btn-primary btn-sm">Login</Link>
<Link to="/register" className="btn btn-outline-primary btn-sm">Register</Link>
</>
)}
</div>
</div>
</nav>
);
}