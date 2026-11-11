import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader, LockKeyhole, Mail } from 'lucide-react';
import api from '../services/api';

export default function PasswordReset({ reset = false }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (reset && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const response = reset
        ? await api.post('/auth/reset-password', { token: searchParams.get('token'), password })
        : await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      if (reset) setTimeout(() => navigate('/login'), 1400);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to complete the request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="FixFlow password recovery">
        <div className="auth-story-brand"><span className="brand-icon"><LockKeyhole size={18} color="white" /></span><span>FixFlow</span></div>
        <div className="auth-story-copy"><h1>Secure access to your service workspace.</h1><p>Password recovery links expire after 30 minutes and can only be used once.</p></div>
        <div className="auth-story-foot">Service operations, made straightforward.</div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <h2>{reset ? 'Choose a new password' : 'Reset your password'}</h2>
          <p className="auth-subtitle">{reset ? 'Use a new password with at least 8 characters.' : 'Enter your work email and we’ll send a one-time reset link.'}</p>
          <form onSubmit={submit}>
            {!reset ? (
              <div><label htmlFor="reset-email">Work email</label><input id="reset-email" className="field" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="you@company.com" /></div>
            ) : (
              <>
                <div><label htmlFor="reset-password">New password</label><input id="reset-password" className="field" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} required /></div>
                <div><label htmlFor="reset-confirm">Confirm new password</label><input id="reset-confirm" className="field" type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={8} maxLength={128} required /></div>
              </>
            )}
            {error && <div className="auth-error" role="alert"><AlertCircle size={16} />{error}</div>}
            {message && <div className="password-reset-success" role="status"><CheckCircle2 size={16} />{message}</div>}
            <button className="btn auth-submit" disabled={busy || Boolean(message && reset)}>
              {busy ? <><Loader size={16} className="spinner" />Please wait…</> : <>{reset ? 'Update password' : 'Send reset link'}{reset ? <LockKeyhole size={15} /> : <Mail size={15} />}</>}
            </button>
          </form>
          <p className="auth-switch"><Link to="/login"><ArrowLeft size={13} />Back to sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
