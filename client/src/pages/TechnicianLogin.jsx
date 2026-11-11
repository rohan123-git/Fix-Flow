import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TechnicianLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
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
      const user = await login(form.identifier, form.password, rememberMe, 'technician');
      if (user.role !== 'technician') {
        setError('This sign-in is for technicians. Choose the correct workspace.');
        return;
      }
      navigate('/technician/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="role-login-page technician-login">
      <section className="role-login-card">
        <Link className="role-login-back" to="/portal"><ArrowLeft size={15} />All workspaces</Link>
        <Link className="role-login-brand" to="/portal"><span className="role-login-brand-mark"><Wrench size={18} /></span>FixFlow</Link>
        <header className="role-login-heading">
          <p>TECHNICIAN WORKSPACE</p>
          <h1>Sign in to your work queue</h1>
          <span>Review assigned jobs, record repairs and keep requests moving.</span>
        </header>

        <form className="role-login-form" onSubmit={submit}>
          <div>
            <label htmlFor="technician-identifier">Email or user ID</label>
            <input id="technician-identifier" className="role-login-input" name="identifier" autoComplete="username" value={form.identifier} onChange={change} required placeholder="you@company.com" />
          </div>
          <div>
            <label htmlFor="technician-password">Password</label>
            <div className="role-login-password">
              <input id="technician-password" className="role-login-input" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={change} required placeholder="Enter your password" />
              <button type="button" onClick={() => setShowPw(value => !value)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="role-login-options">
            <label className="role-login-remember"><input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} />Keep me signed in</label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {error && <div className="role-login-error" role="alert"><AlertCircle size={15} />{error}</div>}

          <button className="role-login-submit" type="submit" disabled={busy}>
            {busy ? <><Loader size={16} className="spinner" />Signing in…</> : <>Sign in to work queue <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="role-login-footer">Need employee access? <Link to="/portal/employee">Choose the employee workspace</Link>.</p>
      </section>
    </main>
  );
}
