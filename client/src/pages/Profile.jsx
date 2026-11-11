import { useState } from 'react';
import { CheckCircle2, Loader, Save, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    department: user.department || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile(form);
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save profile changes.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header"><div><div className="dashboard-eyebrow">Account</div><h1>My profile</h1><p>Update your contact details and account information.</p></div></header>
      <section className="card profile-card">
        <div className="dashboard-section-heading"><div><h2><UserRound size={17} />Personal information</h2><p>Your role and user ID are managed by your workspace.</p></div></div>
        <form className="profile-form" onSubmit={submit}>
          <label>Full name<input className="field" required maxLength={100} value={form.name} onChange={event => setForm(current => ({ ...current, name:event.target.value }))} /></label>
          <label>Work email<input className="field" type="email" disabled value={user.email} /></label>
          <label>User ID<input className="field" disabled value={user.userId || user.id} /></label>
          <label>Department<input className="field" maxLength={80} value={form.department} onChange={event => setForm(current => ({ ...current, department:event.target.value }))} /></label>
          <label>Phone<input className="field" type="tel" maxLength={30} value={form.phone} onChange={event => setForm(current => ({ ...current, phone:event.target.value }))} /></label>
          <label>Role<input className="field" disabled value={user.role} /></label>
          {error && <div className="dashboard-error" role="alert">{error}</div>}
          {saved && <div className="password-reset-success" role="status"><CheckCircle2 size={15} />Profile saved.</div>}
          <button className="btn profile-save" disabled={busy}>{busy ? <Loader size={14} className="spinner" /> : <Save size={14} />}Save changes</button>
        </form>
      </section>
    </div>
  );
}
