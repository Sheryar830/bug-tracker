import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Register() {
  const { register: reg, handleSubmit } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      terms: false,
      role: "TESTER",
    },
  });
  const { register: doRegister, loading } = useAuth();
  const nav = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = async ({ name, email, password, role }) => {
    const res = await doRegister({ name, email, password, role }); // role = TESTER | DEVELOPER
    if (res.ok) nav("/");
    else alert(res.message || "Register failed");
  };

  return (
    <div className="container-fluid">
      <div className="main-content d-flex flex-column p-0">
        <div className="m-lg-auto my-auto w-930 py-4">
          <div className="card bg-white border rounded-10 border-white py-100 px-130">
            <div className="p-md-5 p-4 p-lg-0">
              <div className="text-center mb-4">
                <h3 className="fs-26 fw-medium" style={{ marginBottom: 6 }}>
                  Sign Up
                </h3>
                <p className="fs-16 text-secondary lh-1-8">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary text-decoration-none"
                  >
                    Sign In
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Name */}
                <div className="mb-20">
                  <label className="label fs-16 mb-2" htmlFor="name">
                    Name
                  </label>
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      placeholder="Enter name *"
                      {...reg("name", { required: true })}
                    />
                    <label htmlFor="name">Enter name *</label>
                  </div>
                </div>

                {/* Email */}
                <div className="mb-20">
                  <label className="label fs-16 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <div className="form-floating">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="Enter email address *"
                      {...reg("email", { required: true })}
                    />
                    <label htmlFor="email">Enter email address *</label>
                  </div>
                </div>

                {/* Password */}
                <div className="mb-20">
                  <label className="label fs-16 mb-2">Your Password</label>
                  <div className="form-group" id="password-show-hide">
                    <div className="password-wrapper position-relative password-container">
                      <input
                        type={showPwd ? "text" : "password"}
                        className="form-control text-secondary password"
                        placeholder="Enter password *"
                        {...reg("password", { required: true, minLength: 6 })}
                      />
                      <i
                        className={`${
                          showPwd ? "ri-eye-line" : "ri-eye-off-line"
                        } password-toggle-icon translate-middle-y top-50 position-absolute cursor text-secondary`}
                        style={{ color: "#A9A9C8", fontSize: 22, right: 15 }}
                        role="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPwd((s) => !s)}
                      />
                    </div>
                  </div>
                </div>

                {/* Role choice (Tester / Developer only) */}
                <div className="mb-20">
                  <label className="label fs-16 mb-2">Choose Role</label>
                  <div className="d-flex gap-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="roleTester"
                        value="TESTER"
                        {...reg("role", { required: true })}
                        defaultChecked
                      />
                      <label
                        className="form-check-label fs-16"
                        htmlFor="roleTester"
                      >
                        Tester
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="roleDeveloper"
                        value="DEVELOPER"
                        {...reg("role", { required: true })}
                      />
                      <label
                        className="form-check-label fs-16"
                        htmlFor="roleDeveloper"
                      >
                        Developer
                      </label>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="mb-20">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="terms"
                      {...reg("terms", { required: true })}
                    />
                    <label className="form-check-label fs-16" htmlFor="terms">
                      I accept the{" "}
                      <a href="#" className="text-decoration-none text-primary">
                        Terms and conditions
                      </a>
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="mb-4">
                  <button
                    type="submit"
                    className="btn btn-primary fw-normal text-white w-100"
                    style={{ paddingTop: 18, paddingBottom: 18 }}
                    disabled={loading}
                  >
                    {loading ? "Creating account…" : "Sign Up"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
