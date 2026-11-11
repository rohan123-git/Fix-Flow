import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Loader } from 'lucide-react';
import api from '../services/api';

const ACTIVE = new Set(['open', 'assigned', 'in-progress']);
const STATUS = { open: 'Open', assigned: 'Assigned', 'in-progress': 'In progress' };

export default function SlaMonitoring() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tickets?limit=100')
      .then(response => setTickets(response.data.tickets))
      .catch(requestError => setError(requestError.response?.data?.message || 'Unable to load service deadlines.'))
      .finally(() => setLoading(false));
  }, []);

  const activeTickets = useMemo(() => tickets
    .filter(ticket => ACTIVE.has(ticket.status) && ticket.dueDate)
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate)), [tickets]);
  const overdue = activeTickets.filter(ticket => new Date(ticket.dueDate) < new Date());
  const dueToday = activeTickets.filter(ticket => {
    const due = new Date(ticket.dueDate);
    const now = new Date();
    return due >= now && due.toDateString() === now.toDateString();
  });

  return (
    <div className="dashboard-page">
      <header className="dashboard-header"><div><div className="dashboard-eyebrow">Service level agreements</div><h1>SLA monitoring</h1><p>Requests are assessed against the due date recorded on each work order.</p></div></header>
      <section className="stat-grid dashboard-kpis">
        <article className="kpi-card"><div className="kpi-icon red"><AlertTriangle size={17} /></div><div className="kpi-value">{overdue.length}</div><div className="kpi-label">Overdue requests</div><div className="kpi-note">Require immediate review</div></article>
        <article className="kpi-card"><div className="kpi-icon amber"><CalendarClock size={17} /></div><div className="kpi-value">{dueToday.length}</div><div className="kpi-label">Due today</div><div className="kpi-note">Active requests reaching deadline</div></article>
        <article className="kpi-card"><div className="kpi-icon blue"><Clock3 size={17} /></div><div className="kpi-value">{activeTickets.length}</div><div className="kpi-label">Active with a due date</div><div className="kpi-note">Currently tracked against SLA</div></article>
        <article className="kpi-card"><div className="kpi-icon green"><CheckCircle2 size={17} /></div><div className="kpi-value">{tickets.filter(ticket => ['resolved', 'closed'].includes(ticket.status)).length}</div><div className="kpi-label">Completed requests</div><div className="kpi-note">No longer at SLA risk</div></article>
      </section>
      {error && <div className="dashboard-error" role="alert">{error}</div>}
      <section className="card dashboard-panel">
        <div className="dashboard-section-heading"><div><h2>Active service deadlines</h2><p>Requests with the nearest due dates appear first.</p></div></div>
        {loading ? <div className="dashboard-loading"><div className="skeleton dashboard-skeleton-panel" /></div>
          : activeTickets.length === 0 ? <div className="dashboard-empty"><CheckCircle2 size={22} /><div><div className="dashboard-empty-title">No active requests with deadlines</div><div className="dashboard-empty-detail">New service requests will appear when they have an SLA due date.</div></div></div>
            : <div className="table-wrap"><table className="dashboard-table"><thead><tr><th>Request</th><th>Priority</th><th>Status</th><th>Technician</th><th>Due</th><th>Time remaining</th></tr></thead><tbody>
              {activeTickets.map(ticket => {
                const ms = new Date(ticket.dueDate).getTime() - Date.now();
                const late = ms < 0;
                const hours = Math.floor(Math.abs(ms) / 3600000);
                return <tr key={ticket._id}>
                  <td><strong>{ticket.title}</strong><div className="dashboard-request-meta">{ticket.category} · {ticket.location || 'No location'}</div></td>
                  <td><span className={`priority-label priority-${ticket.priority}`}>{ticket.priority}</span></td>
                  <td><span className={`badge badge-${ticket.status}`}>{STATUS[ticket.status]}</span></td>
                  <td>{ticket.assignedTo?.name || 'Unassigned'}</td>
                  <td>{new Date(ticket.dueDate).toLocaleString()}</td>
                  <td><span className={`badge ${late ? 'badge-overdue' : hours < 24 ? 'badge-due-soon' : 'badge-good'}`}>{late ? `${Math.floor(hours / 24)}d ${hours % 24}h overdue` : hours < 1 ? 'Due within an hour' : `${Math.floor(hours / 24)}d ${hours % 24}h left`}</span></td>
                </tr>;
              })}
            </tbody></table></div>}
      </section>
    </div>
  );
}
