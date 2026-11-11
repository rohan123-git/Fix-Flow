import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Shared primitives ─────────────────────────────────────────────────── */

function Wordmark({ color = '#7c3aed' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 7, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.035em', color: '#fff' }}>FixFlow</span>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/portal" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 13, color: 'rgba(255,255,255,0.32)', textDecoration: 'none',
      letterSpacing: '0.01em', transition: 'color 0.12s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.32)'}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      All portals
    </Link>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = (accent) => ({
  width: '100%', padding: '11px 13px',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 9, color: '#f1f1f3', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.12s',
});

function TextInput({ accent, type = 'text', onFocus, onBlur, ...props }) {
  const ac = accent || '#7c3aed';
  return (
    <input
      type={type}
      style={inputStyle(ac)}
      onFocus={e => { e.target.style.borderColor = ac + '90'; if (onFocus) onFocus(e); }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; if (onBlur) onBlur(e); }}
      {...props}
    />
  );
}

function ErrorMsg({ text }) {
  if (!text) return null;
  return (
    <div style={{
      padding: '10px 13px', borderRadius: 8, fontSize: 13, lineHeight: 1.5,
      background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)',
      color: '#fca5a5',
    }}>
      {text}
    </div>
  );
}

function SubmitBtn({ busy, accent, children }) {
  return (
    <button type="submit" disabled={busy} style={{
      width: '100%', padding: '12px 0', borderRadius: 10,
      background: busy ? accent + '70' : accent,
      border: 'none', color: '#fff', fontWeight: 700, fontSize: 14.5,
      cursor: busy ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'opacity 0.15s',
      letterSpacing: '-0.01em',
    }}>
      {busy ? (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" style={{ animation: 'ff-spin .8s linear infinite' }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          One moment…
        </>
      ) : children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* LEFT PANEL — brand side for each portal                                 */
/* ─────────────────────────────────────────────────────────────────────── */

function AdminPanel() {
  const items = [
    { label: 'Live ticket overview', note: 'Open, in-progress, overdue at a glance' },
    { label: 'Technician workload', note: 'See who has capacity right now' },
    { label: 'Asset management', note: 'Track equipment condition & QR codes' },
    { label: 'SLA monitoring', note: 'Stay on top of response deadlines' },
    { label: 'Analytics', note: 'Resolution trends, priority breakdown' },
  ];
  return (
    <div style={{
      width: '42%', minWidth: 300, background: '#0e0b1a',
      borderRight: '1px solid rgba(124,58,237,0.15)',
      display: 'flex', flexDirection: 'column', padding: '44px 40px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Faint purple wash top-right */}
      <div style={{
        position: 'absolute', top: -80, right: -80, width: 300, height: 300,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Wordmark color="#7c3aed" />

        <div style={{ marginTop: 64, flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(124,58,237,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
            Administration
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 18 }}>
            Command centre<br />for your ops team.
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, marginBottom: 40 }}>
            Everything you need to keep maintenance running — from the first request through to resolution.
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {items.map(item => (
              <li key={item.label} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.72)', marginBottom: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.27)' }}>{item.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em', paddingTop: 32 }}>
          Restricted to administrators
        </div>
      </div>
    </div>
  );
}

function TechnicianPanel() {
  const steps = [
    { n: '1', text: 'A request comes in and gets assigned to you' },
    { n: '2', text: "You see it here, accept it, and head to the job" },
    { n: '3', text: 'Update the ticket from your phone or computer' },
    { n: '4', text: 'Mark it resolved — the requester gets notified' },
  ];
  return (
    <div style={{
      width: '42%', minWidth: 300, background: '#08101e',
      borderRight: '1px solid rgba(29,78,216,0.15)',
      display: 'flex', flexDirection: 'column', padding: '44px 40px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 260, height: 260,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Wordmark color="#1d4ed8" />

        <div style={{ marginTop: 64, flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(59,130,246,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
            Field Operations
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 18 }}>
            Your jobs,<br />all in one place.
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, marginBottom: 40 }}>
            A focused view of what's assigned to you. No noise, just the work.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {steps.map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'rgba(29,78,216,0.25)',
                  border: '1px solid rgba(29,78,216,0.5)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#60a5fa',
                  flexShrink: 0, marginTop: 1, fontFamily: 'ui-monospace, monospace',
                }}>
                  {step.n}
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em', paddingTop: 32 }}>
          Technician credentials only
        </div>
      </div>
    </div>
  );
}

function EmployeePanel() {
  const perks = [
    'Submit a request in under a minute',
    'See real-time status updates',
    'Know exactly which technician is on it',
    'Get notified when it\'s resolved',
  ];
  return (
    <div style={{
      width: '42%', minWidth: 300, background: '#071410',
      borderRight: '1px solid rgba(4,120,87,0.15)',
      display: 'flex', flexDirection: 'column', padding: '44px 40px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 280, height: 280,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(4,120,87,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Wordmark color="#047857" />

        <div style={{ marginTop: 64, flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,185,129,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
            Self-Service
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 18 }}>
            Something broken?<br />We've got it.
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, marginBottom: 40 }}>
            Report any workplace issue and let the maintenance team handle the rest. Simple as that.
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {perks.map(perk => (
              <li key={perk} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em', paddingTop: 32 }}>
          Open to all staff — free to register
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* ADMIN LOGIN                                                              */
/* ─────────────────────────────────────────────────────────────────────── */
export function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const accent = '#7c3aed';

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const u = await login(form.identifier, form.password, false, 'admin');
      if (u.role !== 'admin') { setError('This portal is for administrators. Please use the correct portal.'); return; }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) { setError(err.response?.data?.message || 'Check your credentials and try again.'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex' }}>
      <AdminPanel />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <BackLink />
            <div style={{ height: 32 }} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Sign in</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Administration portal — authorized access only.</p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Email address">
              <TextInput accent={accent} name="identifier" autoComplete="username" value={form.identifier} onChange={change} required placeholder="admin@company.com" />
            </Field>

            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <TextInput accent={accent} name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={change} required placeholder="Your password" style={{ paddingRight: 42, ...inputStyle(accent) }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, lineHeight: 0,
                }}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </Field>

            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <Link to="/forgot-password" style={{ fontSize: 12.5, color: accent, textDecoration: 'none', letterSpacing: '0.01em' }}>
                Forgot password?
              </Link>
            </div>

            <ErrorMsg text={error} />

            <SubmitBtn busy={busy} accent={accent}>
              Sign in to Admin Portal
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </SubmitBtn>
          </form>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 28 }}>
            Not an admin? <Link to="/portal" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Choose your portal</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes ff-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* TECHNICIAN LOGIN                                                         */
/* ─────────────────────────────────────────────────────────────────────── */
export function TechnicianLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const accent = '#1d4ed8';

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const u = await login(form.identifier, form.password, false, 'technician');
      if (u.role !== 'technician') { setError('This portal is for technicians. Please use the correct portal.'); return; }
      navigate('/technician/dashboard', { replace: true });
    } catch (err) { setError(err.response?.data?.message || 'Check your credentials and try again.'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex' }}>
      <TechnicianPanel />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <BackLink />
            <div style={{ height: 32 }} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Technician sign-in</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Access your field workbench and active job queue.</p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Email or user ID">
              <TextInput accent={accent} name="identifier" autoComplete="username" value={form.identifier} onChange={change} required placeholder="tech@company.com" />
            </Field>
            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <input
                  name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password} onChange={change} required placeholder="Your password"
                  style={{ ...inputStyle(accent), paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = accent + '90'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, lineHeight: 0,
                }}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </Field>

            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <Link to="/forgot-password" style={{ fontSize: 12.5, color: accent, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <ErrorMsg text={error} />

            <SubmitBtn busy={busy} accent={accent}>
              Access My Workbench
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </SubmitBtn>
          </form>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 28 }}>
            Wrong portal? <Link to="/portal" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Choose another</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes ff-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* EMPLOYEE LOGIN + REGISTER                                               */
/* ─────────────────────────────────────────────────────────────────────── */
const DEPTS = ['Engineering', 'IT', 'Finance', 'HR', 'Operations', 'Marketing', 'Facilities', 'Other'];

export function EmployeeLogin() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const isLogin = tab === 'login';
  const [form, setForm] = useState({ name: '', email: '', identifier: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const accent = '#047857';
  const accentBright = '#10b981';

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      isLogin
        ? await login(form.identifier, form.password, false, 'employee')
        : await register(form);
      navigate('/employee/dashboard', { replace: true });
    } catch (err) { setError(err.response?.data?.message || (isLogin ? 'Login failed — check your details.' : 'Registration failed — try again.')); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex' }}>
      <EmployeePanel />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 28 }}>
            <BackLink />
            <div style={{ height: 28 }} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              {isLogin ? 'Sign in to check on your requests.' : 'Join your team — takes about 30 seconds.'}
            </p>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)',
            borderRadius: 10, padding: 3, marginBottom: 26, gap: 3,
          }}>
            {[['login', 'Sign in'], ['register', 'Register']].map(([key, label]) => (
              <button key={key} type="button"
                onClick={() => { setTab(key); setError(''); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                  background: tab === key ? accentBright : 'transparent',
                  color: tab === key ? '#fff' : 'rgba(255,255,255,0.38)',
                  fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                  transition: 'all 0.12s', letterSpacing: '-0.01em',
                }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLogin && (
              <>
                <Field label="Full name">
                  <TextInput accent={accentBright} name="name" autoComplete="name" value={form.name} onChange={change} required={!isLogin} placeholder="Jane Smith" />
                </Field>
                <Field label="Department">
                  <select name="department" value={form.department} onChange={change}
                    style={{
                      ...inputStyle(accentBright),
                      background: 'rgba(255,255,255,0.055)',
                      color: form.department ? '#f1f1f3' : 'rgba(255,255,255,0.3)',
                    }}
                    onFocus={e => e.target.style.borderColor = accentBright + '90'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <option value="">Select department</option>
                    {DEPTS.map(d => <option key={d} value={d} style={{ background: '#1a1a2e' }}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Email address">
                  <TextInput accent={accentBright} name="email" type="email" autoComplete="email" value={form.email} onChange={change} required={!isLogin} placeholder="jane@company.com" />
                </Field>
              </>
            )}

            {isLogin && (
              <Field label="Email or user ID">
                <TextInput accent={accentBright} name="identifier" autoComplete="username" value={form.identifier} onChange={change} required placeholder="you@company.com" />
              </Field>
            )}

            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <input
                  name="password" type={showPw ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password} onChange={change} required minLength={8}
                  placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
                  style={{ ...inputStyle(accentBright), paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = accentBright + '90'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, lineHeight: 0,
                }}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </Field>

            {isLogin && (
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <Link to="/forgot-password" style={{ fontSize: 12.5, color: accentBright, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
            )}

            <ErrorMsg text={error} />

            <SubmitBtn busy={busy} accent={accentBright}>
              {isLogin ? 'Sign In' : 'Create My Account'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </SubmitBtn>
          </form>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 24 }}>
            Wrong portal? <Link to="/portal" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Choose another</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes ff-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
