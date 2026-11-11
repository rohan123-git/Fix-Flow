import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader, Save } from 'lucide-react';
import api from '../services/api';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function ServiceSettings() {
  const [slaHours, setSlaHours] = useState({ low: 120, medium: 72, high: 24, critical: 4 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/admin/settings')
      .then(response => setSlaHours(response.data.settings.slaHours))
      .catch(requestError => setError(requestError.response?.data?.message || 'Unable to load service settings.'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.patch('/admin/settings', { slaHours });
      setSlaHours(response.data.settings.slaHours);
      setSuccess('Service-level targets saved. New requests will use these defaults.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save service settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header"><div><div className="dashboard-eyebrow">Workspace configuration</div><h1>Service settings</h1><p>Set the default SLA response window for new requests by priority.</p></div></header>
      <section className="card settings-card">
        <div className="dashboard-section-heading"><div><h2>Default service-level targets</h2><p>Existing requests keep their due date. Changes apply when new requests are created.</p></div><Clock3 size={18} color="var(--accent)" /></div>
        {loading ? <div className="dashboard-loading"><div className="skeleton dashboard-skeleton-panel" /></div> : (
          <form onSubmit={submit} className="settings-form">
            {PRIORITIES.map(priority => <label key={priority} className="settings-row">
              <span><strong>{priority[0].toUpperCase() + priority.slice(1)}</strong><small>Target completion window</small></span>
              <div><input className="field" type="number" min="1" max="8760" required value={slaHours[priority]} onChange={event => setSlaHours(current => ({ ...current, [priority]: event.target.value }))} /><span>hours</span></div>
            </label>)}
            {error && <div className="dashboard-error" role="alert">{error}</div>}
            {success && <div className="password-reset-success" role="status"><CheckCircle2 size={16} />{success}</div>}
            <button className="btn" disabled={saving}>{saving ? <Loader size={14} className="spinner" /> : <Save size={14} />}Save service targets</button>
          </form>
        )}
      </section>
    </div>
  );
}
