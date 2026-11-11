import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Bell, Eye, EyeOff, Loader, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEPTS = ['Engineering', 'IT', 'Finance', 'HR', 'Operations', 'Marketing', 'Facilities', 'Other'];

export default function Auth({ mode = 'login', requiredRole = null }) {
  const isLogin = mode === 'login';
  const { login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', identifier: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const change = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const authenticatedUser = isLogin
        ? await login(form.identifier, form.password, rememberMe, requiredRole)
        : await register(form);
      if (requiredRole && authenticatedUser.role !== requiredRole) {
        logout();
        setError('This sign-in is for administrators. Choose the correct workspace to continue.');
        return;
      }
      navigate(authenticatedUser.role === 'admin'
        ? '/admin/dashboard'
        : authenticatedUser.role === 'technician' ? '/technician/dashboard' : '/employee/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to connect. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="About FixFlow">
        <div className="auth-story-brand">
          <span className="brand-icon"><Wrench size={19} color="white" /></span>
          <span>FixFlow</span>
        </div>
        <div className="auth-story-copy">
          <h1>Workplace support, without the runaround.</h1>
          <p>Report an issue, follow its progress and get back to work.</p>
          <div className="auth-feature-list">
            <div className="auth-feature"><span className="auth-feature-mark"><ShieldCheck size={17} /></span>Requests go to the right team</div>
            <div className="auth-feature"><span className="auth-feature-mark"><Wrench size={17} /></span>See who is handling the work</div>
            <div className="auth-feature"><span className="auth-feature-mark"><Bell size={17} /></span>Get updates as it progresses</div>
          </div>
        </div>
        <div className="auth-story-foot">FixFlow · Workplace maintenance</div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {isLogin
              ? requiredRole === 'admin' ? 'Sign in to your administrator workspace.' : 'Sign in to your FixFlow workspace.'
              : 'Register for an employee service account.'}
          </p>

          <form onSubmit={submit}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="auth-name">Full name</label>
                  <input id="auth-name" className="field" name="name" autoComplete="name" value={form.name} onChange={change} required placeholder="Jane Smith" />
                </div>
                <div>
                  <label htmlFor="auth-department">Department</label>
                  <select id="auth-department" className="field" name="department" value={form.department} onChange={change}>
                    <option value="">Select a department</option>
                    {DEPTS.map(department => <option key={department} value={department}>{department}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label htmlFor="auth-email">Email or user ID</label>
              <input id="auth-email" className="field" type="text" name="identifier" autoComplete="username" value={form.identifier} onChange={change} required placeholder="you@company.com or FF-…" />
            </div>
            <div>
              <label htmlFor="auth-password">Password</label>
              <div className="auth-password-field">
                <input
                  id="auth-password"
                  className="field"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={change}
                  minLength={8}
                  required
                  placeholder="At least 8 characters"
                />
                <button className="auth-password-toggle" type="button" onClick={() => setShowPw(value => !value)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="auth-options">
                <label className="remember-control">
                  <input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}

            {error && <div className="auth-error" role="alert"><AlertCircle size={16} />{error}</div>}

            <button className="btn auth-submit" type="submit" disabled={busy}>
              {busy ? <><Loader size={16} className="spinner" />Please wait…</> : <>{isLogin ? 'Sign in' : 'Create account'}<ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin
              ? <>New to FixFlow? <Link to="/register">Create an account</Link></>
              : <>Already have an account? <Link to="/login">Sign in</Link></>}
          </p>
        </div>
      </section>
    </main>
  );
}
