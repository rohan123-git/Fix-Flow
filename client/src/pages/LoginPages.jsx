import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Wordmark({ color = '#3b82f6', textColor = '#fff' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        display: 'grid', placeItems: 'center',
        background: color, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}>
        <Wrench size={14} color="#fff" strokeWidth={2.4} />
      </div>
      <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', color: textColor }}>FixFlow</span>
    </div>
  );
}

function BackLink({ tone = 'muted' }) {
  const color = tone === 'muted' ? '#8ca0ae' : '#6b7280';
  return (
    <Link to="/portal" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      color, textDecoration: 'none', fontSize: 13, fontWeight: 500,
    }}>
      <ArrowLeft size={15} />
      All workspaces
    </Link>
  );
}

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  minHeight: 42, padding: '0 12px', borderRadius: 8,
  border: '1px solid #cfd7df', background: '#fff',
  color: '#1f2937', fontSize: 14, outline: 'none',
};

function Input({ accent, type = 'text', ...props }) {
  return (
    <input
      {...props}
      type={type}
      style={{
        ...inputBase,
        borderColor: '#d3dbe3',
        boxShadow: 'none',
      }}
      onFocus={e => {
        e.target.style.borderColor = accent;
        e.target.style.boxShadow = `0 0 0 3px ${accent}22`;
      }}
      onBlur={e => {
        e.target.style.borderColor = '#d3dbe3';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

function ErrorMsg({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 12px', borderRadius: 8,
      border: '1px solid #f1c7c5', background: '#fff4f1',
      color: '#a64a43', fontSize: 13, lineHeight: 1.5,
    }}>
      <AlertCircle size={15} style={{ marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
}

function SubmitButton({ accent, busy, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      style={{
        width: '100%', minHeight: 42, border: 'none', borderRadius: 8,
        background: accent, color: '#fff', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.8 : 1,
        fontSize: 14, boxShadow: '0 10px 18px rgba(21, 94, 117, 0.15)',
      }}
    >
      {busy ? <Loader size={15} className="spinner" /> : null}
      <span>{busy ? 'Please wait...' : children}</span>
      {!busy ? <ArrowRight size={16} /> : null}
    </button>
  );
}

function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const accent = '#1a4e7d';

  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.identifier, form.password, rememberMe, 'admin');
      if (user.role !== 'admin') {
        setError('This sign-in is for administrators. Choose the correct workspace to continue.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Check your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#efefef', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1.06fr 1fr', background: '#fff', border: '1px solid #dfe5e9', boxShadow: '0 12px 32px rgba(20, 31, 44, 0.09)' }}>
        <aside style={{ background: '#1e2f4a', padding: '28px 34px 26px', display: 'flex', flexDirection: 'column' }}>
          <Wordmark color="#2d5f9e" textColor="#fff" />
          <div style={{ marginTop: 'auto', paddingTop: 36 }}>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.08, letterSpacing: '-0.05em', color: '#fff', maxWidth: 380 }}>
              Workplace support,<br />without the runaround.
            </h1>
            <p style={{ margin: '18px 0 0', fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', maxWidth: 420 }}>
              Report an issue, follow its progress and get back to work.
            </p>
            <div style={{ marginTop: 28, display: 'grid', gap: 14 }}>
              {[
                'Requests go to the right team',
                'See who is handling the work',
                'Get updates as it progresses',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.78)', fontSize: 14 }}>
                  <ShieldCheck size={16} color="#8ecaff" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 26, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>FixFlow · Workplace maintenance</div>
        </aside>

        <main style={{ background: '#fff', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
            <BackLink />
            <div style={{ height: 32 }} />
            <div style={{ marginBottom: 26 }}>
              <h2 style={{ margin: 0, fontSize: 32, letterSpacing: '-0.05em', color: '#1f2937' }}>Welcome back</h2>
              <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>Sign in to your administrator workspace.</p>
            </div>

            <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontSize: 12, fontWeight: 600 }}>Email or user ID</label>
                <Input accent={accent} name="identifier" autoComplete="username" value={form.identifier} onChange={change} placeholder="vikram.malhotra@fixflow.in" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontSize: 12, fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Input accent={accent} type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={form.password} onChange={change} placeholder="••••••••••••" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#4b5563', marginTop: -4 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: accent }} />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
              </div>

              <ErrorMsg message={error} />

              <SubmitButton accent={accent} busy={busy}>Sign in</SubmitButton>
            </form>

            <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
              New to FixFlow? <Link to="/register" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Create an account</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function TechnicianLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const accent = '#2c5b8d';

  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.identifier, form.password, rememberMe, 'technician');
      if (user.role !== 'technician') {
        setError('This portal is for technicians. Please use the correct portal.');
        return;
      }
      navigate('/technician/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Check your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#f5f5f4', border: '1px solid #dfe4e8', padding: 28, boxShadow: '0 10px 30px rgba(24, 35, 47, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <BackLink tone="dark" />
          <Wordmark color="#5d86b5" textColor="#1f2d3d" />
        </div>

        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0, color: '#5d86b5', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Technician workspace</p>
          <h1 style={{ margin: '10px 0 0', color: '#1f2937', fontSize: 28, letterSpacing: '-0.05em' }}>Sign in to your work queue</h1>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: '#677684', lineHeight: 1.5 }}>Review assigned jobs, record repairs and keep requests moving.</p>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 18, marginTop: 26 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#4b5563', fontSize: 12, fontWeight: 600 }}>Email or user ID</label>
            <Input accent={accent} name="identifier" autoComplete="username" value={form.identifier} onChange={change} placeholder="aarav.mehta@fixflow.in" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#4b5563', fontSize: 12, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Input accent={accent} type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={form.password} onChange={change} placeholder="••••••••••••" style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, fontSize: 12, color: '#4b5563' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: accent }} />
              <span>Keep me signed in</span>
            </label>
            <Link to="/forgot-password" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
          </div>

          <ErrorMsg message={error} />

          <SubmitButton accent={accent} busy={busy}>Sign in to work queue</SubmitButton>
        </form>

        <p style={{ margin: '24px 0 0', textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
          Need employee access? <Link to="/portal/employee" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Choose the employee workspace</Link>
        </p>
      </div>
    </div>
  );
}

function EmployeeLogin() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', identifier: '', password: '', department: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const accent = '#0e6d5b';
  const isLogin = tab === 'login';

  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) {
        await login(form.identifier, form.password, rememberMe, 'employee');
      } else {
        await register(form, rememberMe);
      }
      navigate('/employee/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete this request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#f6f7f5', border: '1px solid #dfe7e2', padding: 28, boxShadow: '0 10px 28px rgba(17, 34, 27, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <BackLink tone="dark" />
          <Wordmark color="#26a17b" textColor="#1f2d3d" />
        </div>

        <div style={{ marginTop: 10 }}>
          <p style={{ margin: 0, color: '#0f766e', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Employee workspace</p>
          <h1 style={{ margin: '10px 0 0', color: '#1f2937', fontSize: 30, letterSpacing: '-0.05em' }}>{isLogin ? 'Sign in to your account' : 'Create account'}</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{isLogin ? 'Check on a request or let us know what needs attention.' : 'Create your account to submit and track requests.'}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: '#ebf0ee', borderRadius: 8, marginTop: 22 }}>
          {['login', 'register'].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setError(''); }}
              style={{
                height: 36, border: 'none', borderRadius: 7, background: tab === key ? '#ffffff' : 'transparent',
                color: tab === key ? accent : '#5b6b5f', fontWeight: tab === key ? 700 : 500,
                cursor: 'pointer', boxShadow: tab === key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {key === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 18, marginTop: 22 }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4b5563', fontSize: 12, fontWeight: 600 }}>Full name</label>
                <Input accent={accent} name="name" autoComplete="name" value={form.name} onChange={change} placeholder="Aditi Sharma" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4b5563', fontSize: 12, fontWeight: 600 }}>Department</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={change}
                  style={{ ...inputBase, borderColor: '#d3dbe3', background: '#fff', color: '#1f2937' }}
                >
                  <option value="">Select department</option>
                  {['Engineering', 'IT', 'Finance', 'HR', 'Operations', 'Marketing', 'Facilities', 'Other'].map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#4b5563', fontSize: 12, fontWeight: 600 }}>Email address</label>
                <Input accent={accent} name="email" type="email" autoComplete="email" value={form.email} onChange={change} placeholder="aditi.sharma@fixflow.in" />
              </div>
            </>
          )}

          {isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: '#4b5563', fontSize: 12, fontWeight: 600 }}>Email or user ID</label>
              <Input accent={accent} name="identifier" autoComplete="username" value={form.identifier} onChange={change} placeholder="aditi.sharma@fixflow.in" />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#4b5563', fontSize: 12, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Input accent={accent} type={showPassword ? 'text' : 'password'} name="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={form.password} onChange={change} placeholder={isLogin ? '••••••••••••' : 'At least 8 characters'} style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, fontSize: 12, color: '#4b5563' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: accent }} />
                <span>Keep me signed in</span>
              </label>
              <Link to="/forgot-password" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
            </div>
          )}

          <ErrorMsg message={error} />
          <SubmitButton accent={accent} busy={busy}>{isLogin ? 'Sign in' : 'Create account'}</SubmitButton>
        </form>

        <p style={{ margin: '22px 0 0', textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
          Need help accessing your account? <Link to="/portal" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Choose another workspace</Link>
        </p>
      </div>
    </div>
  );
}

export { AdminLogin, TechnicianLogin, EmployeeLogin };
