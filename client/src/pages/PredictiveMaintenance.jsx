import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Loader, Package, Wrench } from 'lucide-react';
import api from '../services/api';

function MaintenanceModal({ prediction, onClose, onSaved }) {
  const [interval, setInterval] = useState(prediction.asset.maintenanceIntervalDays);
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.patch(`/assets/${prediction.asset._id}/maintenance-plan`, { maintenanceIntervalDays: Number(interval) });
      if (notes.trim()) {
        await api.post(`/assets/${prediction.asset._id}/maintenance`, {
          notes: notes.trim(),
          parts: parts.split(',').map(part => part.trim()).filter(Boolean),
        });
      }
      onSaved();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save the maintenance plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <form className="modal maintenance-modal" onSubmit={submit}>
        <div className="dashboard-section-heading"><div><h2>{prediction.asset.assetName}</h2><p>{prediction.asset.assetCode} · Adjust the rule or record a completed service</p></div><button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button></div>
        <label>Maintenance interval (days)<input className="field" type="number" min="1" max="3650" required value={interval} onChange={event => setInterval(event.target.value)} /></label>
        <label>Maintenance notes (leave blank if not serviced today)<textarea className="field" rows={3} maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Inspection, repairs and follow-up" /></label>
        <label>Parts used<input className="field" value={parts} onChange={event => setParts(event.target.value)} placeholder="Comma-separated parts" /></label>
        {error && <div className="dashboard-error" role="alert">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? <Loader size={14} className="spinner" /> : <CheckCircle2 size={14} />}Save maintenance plan</button>
      </form>
    </div>
  );
}

export default function PredictiveMaintenance() {
  const [predictions, setPredictions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/assets/predictive')
      .then(response => setPredictions(response.data.predictions))
      .catch(requestError => setError(requestError.response?.data?.message || 'Unable to load the maintenance schedule.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const counts = {
    overdue: predictions.filter(item => item.status === 'overdue').length,
    soon: predictions.filter(item => item.status === 'due-soon').length,
    scheduled: predictions.filter(item => item.status === 'scheduled').length,
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header"><div><div className="dashboard-eyebrow">Rule-based maintenance planning</div><h1>Predictive maintenance</h1><p>Maintenance due dates calculated from each asset’s recorded service date and interval.</p></div></header>
      <section className="stat-grid dashboard-kpis">
        <article className="kpi-card"><div className="kpi-icon red"><AlertTriangle size={17} /></div><div className="kpi-value">{counts.overdue}</div><div className="kpi-label">Overdue</div><div className="kpi-note">Past the maintenance interval</div></article>
        <article className="kpi-card"><div className="kpi-icon amber"><CalendarDays size={17} /></div><div className="kpi-value">{counts.soon}</div><div className="kpi-label">Due soon</div><div className="kpi-note">Due within the lead window</div></article>
        <article className="kpi-card"><div className="kpi-icon green"><CheckCircle2 size={17} /></div><div className="kpi-value">{counts.scheduled}</div><div className="kpi-label">On schedule</div><div className="kpi-note">Within the configured interval</div></article>
        <article className="kpi-card"><div className="kpi-icon blue"><Package size={17} /></div><div className="kpi-value">{predictions.length}</div><div className="kpi-label">Tracked assets</div><div className="kpi-note">Included in this schedule</div></article>
      </section>
      {error && <div className="dashboard-error" role="alert">{error}<button className="btn btn-ghost btn-sm" onClick={load}>Retry</button></div>}
      <section className="card dashboard-panel">
        <div className="dashboard-section-heading"><div><h2>Maintenance schedule</h2><p>Review upcoming service and record completed maintenance.</p></div></div>
        {loading ? <div className="dashboard-loading"><div className="skeleton dashboard-skeleton-panel" /></div>
          : predictions.length === 0 ? <div className="dashboard-empty"><Package size={22} /><div><div className="dashboard-empty-title">No assets to schedule</div><div className="dashboard-empty-detail">Register assets to start tracking maintenance intervals.</div></div></div>
            : <div className="table-wrap"><table className="dashboard-table"><thead><tr><th>Asset</th><th>Condition</th><th>Interval</th><th>Last service</th><th>Next due</th><th>Schedule status</th><th></th></tr></thead><tbody>
              {predictions.map(item => <tr key={item.asset._id}>
                <td><strong>{item.asset.assetName}</strong><div className="dashboard-request-meta">{item.asset.assetCode} · {item.asset.location}</div></td>
                <td>{item.asset.condition.replaceAll('-', ' ')}</td>
                <td>{item.asset.maintenanceIntervalDays} days</td>
                <td>{new Date(item.lastMaintained).toLocaleDateString()}</td>
                <td>{new Date(item.nextMaintenanceDate).toLocaleDateString()}</td>
                <td><span className={`badge ${item.status === 'overdue' ? 'badge-overdue' : item.status === 'due-soon' ? 'badge-due-soon' : 'badge-good'}`}>{item.status.replace('-', ' ')}</span><div className="dashboard-request-meta">{item.daysUntilDue < 0 ? `${Math.abs(item.daysUntilDue)} days overdue` : `${item.daysUntilDue} days remaining`}</div></td>
                <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(item)}><Wrench size={13} />Manage</button></td>
              </tr>)}
            </tbody></table></div>}
      </section>
      {selected && <MaintenanceModal prediction={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} />}
    </div>
  );
}
