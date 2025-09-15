import React, { useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { Link } from "react-router-dom";

const handleLogout = () => {
  // NOTE: your AuthProvider uses "token" and "user" — keep it consistent
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export default function Header() {
  const { user } = useAuth();

  // backdrop click => close
  useEffect(() => {
    const bd = document.getElementById("mobile-backdrop");
    if (!bd) return;
    const close = () => document.body.classList.remove("sidebar-open");
    bd.addEventListener("click", close);
    return () => bd.removeEventListener("click", close);
  }, []);

  const toggleSidebar = () => {
    document.body.classList.toggle("sidebar-open");
  };

  return (
    <>
      <header className="header-area bg-white mb-4 rounded-10 border border-white" id="header-area">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="left-header-content">
              <ul className="d-flex align-items-center ps-0 mb-0 list-unstyled justify-content-center justify-content-md-start">
                {/* Burger only on < xl */}
                <li className="d-xl-none">
                  <button
                    className="header-burger-menu bg-transparent p-0 border-0 position-relative top-3"
                    id="header-burger-menu"
                    onClick={toggleSidebar}
                    aria-label="Open menu"
                    aria-controls="layout-menu"
                    aria-expanded={false}
                  >
                    <span className="border-1 d-block for-dark-burger" style={{ borderBottom: "1px solid #475569", height: 1, width: 25 }} />
                    <span className="border-1 d-block for-dark-burger" style={{ borderBottom: "1px solid #475569", height: 1, width: 25, margin: "6px 0" }} />
                    <span className="border-1 d-block for-dark-burger" style={{ borderBottom: "1px solid #475569", height: 1, width: 25 }} />
                  </button>
                </li>

                <li className="text-end pe-3">
                  <div className="fw-semibold fs-16">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-md-6">
            <div className="right-header-content mt-3 mt-md-0">
              <ul className="d-flex align-items-center justify-content-center justify-content-md-end ps-0 mb-0 list-unstyled">
                <li className="header-right-item">
                  <div className="dropdown admin-profile">
                    <button className="btn border-0 p-0 bg-transparent dropdown-toggle d-xxl-flex align-items-center" data-bs-toggle="dropdown">
                      <div className="flex-shrink-0 position-relative">
                        <img className="rounded-circle admin-img-width-for-mobile" style={{ width: 40, height: 40 }} src="/images/admin.png" alt="admin" />
                        <span className="d-block bg-success-60 border border-2 border-white rounded-circle position-absolute end-0 bottom-0" style={{ width: 11, height: 11 }} />
                      </div>
                    </button>

                    <div className="dropdown-menu border-0 bg-white dropdown-menu-end">
                      <div className="d-flex align-items-center info">
                        <div className="flex-shrink-0">
                          <img className="rounded-circle admin-img-width-for-mobile" style={{ width: 40, height: 40 }} src="/images/admin.png" alt="admin" />
                        </div>
                        <div className="flex-grow-1 ms-10">
                          <h3 className="fw-medium fs-17 mb-0">{user?.name}</h3>
                          <span className="fs-15 fw-medium">{user?.role}</span>
                        </div>
                      </div>
                      <ul className="admin-link mb-0 list-unstyled">
                        <li>
                          <Link className="dropdown-item admin-item-link d-flex align-items-center text-body" to="/profile">
                            <i className="material-symbols-outlined">person</i>
                            <span className="ms-2">My Profile</span>
                          </Link>
                        </li>
                        <li>
                          <button className="dropdown-item admin-item-link d-flex align-items-center text-body" onClick={handleLogout}>
                            <i className="material-symbols-outlined">logout</i>
                            <span className="ms-2">Logout</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for mobile */}
      <div id="mobile-backdrop" className="mobile-backdrop"></div>
    </>
  );
}
