import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import '../styles/Login.css';

const Login = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // already authed -> go dashbrd
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  //check inputs
  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!validate()) return;

    try {
      setLoading(true);
      const res = await authService.login({
        email: email.trim().toLowerCase(),
        password
      });

      // save jwt + usr info in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // go to dashbord
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-brand-icon">
            <Building2 size={26} />
          </div>
          <h1>{settings?.crmName || 'BASIC CRM'}</h1>
          <p>Sign in to your account to access the dashboard</p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="email"
                className={`login-input ${errors.email ? 'error' : ''}`}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                autoComplete="email"
              />
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">
              Password <span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`login-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Hint Box for Initial Super Admin Setup */}
        <div className="demo-credentials-box">
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            Initial Super Admin Credentials:
          </div>
          <div>Email: <strong>midhun123@gmail.com</strong></div>
          <div>Password: <strong>1234</strong></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
