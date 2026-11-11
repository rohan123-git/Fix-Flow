import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEPTS = ['Engineering', 'IT', 'Finance', 'HR', 'Operations', 'Marketing', 'Facilities', 'Other'];

export default function EmployeeLogin() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const isLogin = tab === 'login';
  const [form, setForm] = useState({ name: '', email: '', identifier: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isLogin
        ? await login(form.identifier, form.password, rememberMe, 'employee')
        : await register(form);
      if (user.role !== 'employee') {
        setError('This sign-in is for employees. Choose the correct workspace.');
        return;
      }
      navigate('/employee/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || (isLogin ? 'Login failed. Check your details.' : 'Registration failed. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="role-login-page employee-login">
      <section className="role-login-card">
        <Link className="role-login-back" to="/portal"><ArrowLeft size={15} />All workspaces</Link>
        <Link className="role-login-brand" to="/portal"><span className="role-login-brand-mark"><User size={18} /></span>FixFlow</Link>
        <header className="role-login-heading">
          <p>EMPLOYEE WORKSPACE</p>
          <h1>{isLogin ? 'Sign in to your account' : 'Create your account'}</h1>
          <span>{isLogin ? 'Check on a request or let us know what needs attention.' : 'Set up an account to submit and track workplace requests.'}</span>
        </header>

        <div className="role-login-tabs" role="tablist" aria-label="Employee account">
          {['login', 'register'].map(t => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setError(''); }}>
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form className="role-login-form" onSubmit={submit}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="employee-name">Full name</label>
                  <input id="employee-name" className="role-login-input" name="name" autoComplete="name" value={form.name} onChange={change} required placeholder="Jane Smith" />
                </div>
                <div>
                  <label htmlFor="employee-department">Department</label>
                  <select id="employee-department" className="role-login-input" name="department" value={form.department} onChange={change}>
                    <option value="">Select department</option>
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="employee-email">Email address</label>
                  <input id="employee-email" className="role-login-input" name="email" type="email" autoComplete="email" value={form.email} onChange={change} required placeholder="jane@company.com" />
                </div>
              </>
            )}

            {isLogin && (
              <div>
                <label htmlFor="employee-identifier">Email or user ID</label>
                <input id="employee-identifier" className="role-login-input" name="identifier" autoComplete="username" value={form.identifier} onChange={change} required placeholder="you@company.com" />
              </div>
            )}

            <div>
              <label htmlFor="employee-password">Password</label>
              <div className="role-login-password">
                <input id="employee-password" className="role-login-input" name="password" type={showPw ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} value={form.password} onChange={change} required minLength={8} placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'} />
                <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="role-login-options">
                <label className="role-login-remember"><input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} />Keep me signed in</label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}

            {error && (
              <div className="role-login-error" role="alert">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button className="role-login-submit" type="submit" disabled={busy}>
              {busy
                ? <><Loader size={16} className="spinner" />Please wait…</>
                : <>{isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></>}
            </button>
        </form>
        <p className="role-login-footer">{isLogin ? 'Need help accessing your account?' : 'Your account will be created with employee access.'}</p>
      </section>
    </main>
  );
}
