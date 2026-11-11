import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock3, Loader, Users } from 'lucide-react';
import api from '../services/api';

export default function Analytics() {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/analytics/technicians')
      .then(response => setPerformance(response.data.performance))
      .catch(requestError => setError(requestError.response?.data?.message || 'Unable to load technician analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const completed = performance.reduce((sum, item) => sum + item.completedJobs, 0);
  const active = performance.filter(item => item.availability === 'available').length;
  const onTimeValues = performance.filter(item => item.onTimeRate !== null);
  const averageOnTime = onTimeValues.length ? Math.round(onTimeValues.reduce((sum, item) => sum + item.onTimeRate, 0) / onTimeValues.length) : null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header"><div><div className="dashboard-eyebrow">Workforce performance</div><h1>Technician analytics</h1><p>Operational measures calculated from persisted service request history.</p></div></header>
      <section className="stat-grid dashboard-kpis">
        <article className="kpi-card"><div className="kpi-icon blue"><Users size={17} /></div><div className="kpi-value">{performance.length}</div><div className="kpi-label">Technicians</div><div className="kpi-note">On the service team</div></article>
        <article className="kpi-card"><div className="kpi-icon green"><Activity size={17} /></div><div className="kpi-value">{active}</div><div className="kpi-label">Available</div><div className="kpi-note">Ready to receive assignments</div></article>
        <article className="kpi-card"><div className="kpi-icon blue"><CheckCircle2 size={17} /></div><div className="kpi-value">{completed}</div><div className="kpi-label">Completed jobs</div><div className="kpi-note">Resolved or closed assignments</div></article>
        <article className="kpi-card"><div className="kpi-icon amber"><Clock3 size={17} /></div><div className="kpi-value">{averageOnTime === null ? '—' : `${averageOnTime}%`}</div><div className="kpi-label">Average on-time completion</div><div className="kpi-note">Completed jobs resolved by due date</div></article>
      </section>
      {error && <div className="dashboard-error" role="alert">{error}</div>}
      <section className="card dashboard-panel">
        <div className="dashboard-section-heading"><div><h2>Technician performance</h2><p>Completion times and SLA performance are derived from ticket records.</p></div></div>
        {loading ? <div className="dashboard-loading"><div className="skeleton dashboard-skeleton-panel" /></div>
          : performance.length === 0 ? <div className="dashboard-empty"><Users size={22} /><div><div className="dashboard-empty-title">No technicians to report</div><div className="dashboard-empty-detail">Create technician accounts to begin tracking service performance.</div></div></div>
            : <div className="table-wrap"><table className="dashboard-table"><thead><tr><th>Technician</th><th>Availability</th><th>Skills</th><th>Assigned</th><th>Completed</th><th>On time</th><th>Avg resolution</th><th>Rating</th></tr></thead><tbody>
              {performance.map(item => <tr key={item.userId}>
                <td><strong>{item.technician}</strong><div className="dashboard-request-meta">{item.userId}</div></td>
                <td><span className={`badge badge-${item.availability}`}>{item.availability}</span></td>
                <td>{item.skills?.length ? item.skills.join(', ') : '—'}</td>
                <td>{item.assignedJobs}</td><td>{item.completedJobs}</td>
                <td>{item.onTimeRate === null ? '—' : `${item.onTimeRate}%`}</td>
                <td>{item.averageResolutionHours === null ? '—' : `${item.averageResolutionHours} hrs`}</td>
                <td>{Number(item.rating).toFixed(1)} / 5</td>
              </tr>)}
            </tbody></table></div>}
      </section>
    </div>
  );
}
