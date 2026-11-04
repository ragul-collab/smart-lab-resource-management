import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState, ErrorState } from '../../components/States';

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Register | Smart Lab';
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'staff') {
        navigate('/staff', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const registeredUser = await register({
        name,
        email,
        registerNumber,
        department,
        password,
      });

      if (registeredUser.role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/student');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
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

      {/* Register Card */}
      <div className="card auth-card auth-card-register">
        <h1 className="auth-card-title">Create your account</h1>
        <p className="auth-card-desc">Register as a student to request lab equipment.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Name</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="auth-form-row">
            <div className="form-group">
              <label htmlFor="reg-number">Register Number</label>
              <input
                id="reg-number"
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-dept">Department</label>
              <input
                id="reg-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={submitting}
            />
            <div className="form-hint">At least 6 characters.</div>
          </div>

          {error && <ErrorState message={error} />}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Please wait...' : 'Create account'}
          </button>
        </form>
      </div>

      {/* Below card link */}
      <div className="auth-footer-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>

      {/* Bottom footer text */}
      <div className="auth-bottom-footer">
        Smart Lab Resource Management System
      </div>
    </div>
  );
}
