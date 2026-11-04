import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState, ErrorState } from '../../components/States';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Sign In | Smart Lab';
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const fromPath = location.state?.from?.pathname || (user.role === 'staff' ? '/staff' : '/student');
      navigate(fromPath, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      const fromPath = location.state?.from?.pathname || (loggedUser.role === 'staff' ? '/staff' : '/student');
      navigate(fromPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <LoadingState inCard={false} />
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Above card brand header */}
      <div className="auth-header">
        <div className="auth-brand">Smart Lab</div>
        <div className="auth-subtitle">Laboratory Resource Management</div>
      </div>

      {/* Login Card */}
      <div className="card auth-card">
        <h1 className="auth-card-title">Sign in</h1>
        <p className="auth-card-desc">Enter your email and password to continue.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {error && <ErrorState message={error} />}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Please wait...' : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Below card link */}
      <div className="auth-footer-link">
        Don't have an account? <Link to="/register">Register</Link>
      </div>

      {/* Bottom footer text */}
      <div className="auth-bottom-footer">
        Smart Lab Resource Management System
      </div>
    </div>
  );
}
