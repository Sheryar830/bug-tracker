// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Login() {
  const { register, handleSubmit } = useForm();

  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = async ({ email, password }) => {
    const res = await login(email, password);
    if (res.ok) nav('/');
    else alert(res.message || 'Login failed');
  };

  return (
    <div className="container-fluid">
      <div className="main-content d-flex flex-column p-0">
        <div className="m-lg-auto my-auto w-930 py-4">
          <div className="card bg-white border rounded-10 border-white py-100 px-130">
            <div className="p-md-5 p-4 p-lg-0">
              <div className="text-center mb-4">
                <h3 className="fs-26 fw-medium" style={{ marginBottom: 6 }}>Sign In</h3>
                <p className="fs-16 text-secondary lh-1-8">
                  Don’t have an account yet?{' '}
                  <Link to="/register" className="text-primary text-decoration-none">Sign Up</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Email */}
                <div className="mb-20">
                  <label className="label fs-16 mb-2" htmlFor="floatingInput1">Email Address</label>
                  <div className="form-floating">
                    <input
                      type="email"
                      className="form-control"
                      id="floatingInput1"
                      placeholder="Enter email address *"
                      {...register('email', { required: true })}
                    />
                    <label htmlFor="floatingInput1">Enter email address *</label>
                  </div>
                </div>

                {/* Password */}
                <div className="mb-20">
                  <label className="label fs-16 mb-2">Your Password</label>
                  <div className="form-group" id="password-show-hide">
                    <div className="password-wrapper position-relative password-container">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className="form-control text-secondary password"
                        placeholder="Enter password *"
                        {...register('password', { required: true })}
                      />
                      <i
                        className={`${showPwd ? 'ri-eye-line' : 'ri-eye-off-line'} password-toggle-icon translate-middle-y top-50 position-absolute cursor text-secondary`}
                        style={{ color: '#A9A9C8', fontSize: 22, right: 15 }}
                        role="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPwd(s => !s)}
                      />
                    </div>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="mb-20">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="flexCheckDefault" {...register('remember')} />
                      <label className="form-check-label fs-16" htmlFor="flexCheckDefault">Remember me</label>
                    </div>
                    <Link to="#" className="fs-16 text-primary fw-normal text-decoration-none">Forgot Password?</Link>
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
                    {loading ? 'Signing in…' : 'Sign In'}
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
