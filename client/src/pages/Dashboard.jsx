import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, Bell, CheckCircle2,
  ClipboardList, Clock3, Package, Plus, ShieldCheck, Users, Wrench
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ACTIVE_STATUSES = ['open', 'assigned', 'in-progress'];
const STATUS_LABELS = {
  open: 'Open',
  assigned: 'Assigned',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  return new Date(value).toLocaleDateString('en-US', options);
}

function KpiCard({ label, value, note, icon: Icon, tone }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${tone}`}><Icon size={17} /></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-note">{note}</div>
    </article>
  );
}

function EmptyState({ title, detail, action }) {
  return (
    <div className="dashboard-empty">
      <ClipboardList size={23} strokeWidth={1.6} />
      <div>
        <div className="dashboard-empty-title">{title}</div>
        <div className="dashboard-empty-detail">{detail}</div>
      </div>
      {action}
    </div>
  );
}

function StatusPill({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>;
}

function RequestTable({ tickets, role }) {
  const isTechnician = role === 'technician';
  return (
    <div className="table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Service request</th>
            <th>Priority</th>
            <th>Status</th>
            <th>{isTechnician ? 'Due date' : 'Assigned technician'}</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket._id}>
              <td>
                <div className="dashboard-request-title">{ticket.title}</div>
                <div className="dashboard-request-meta">
                  {ticket.category}{ticket.location ? ` · ${ticket.location}` : ''}
                </div>
              </td>
              <td><span className={`priority-label priority-${ticket.priority}`}>{ticket.priority}</span></td>
              <td><StatusPill status={ticket.status} /></td>
              <td>{isTechnician
                ? ticket.dueDate ? formatDate(ticket.dueDate, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'
                : ticket.assignedTo?.name || 'Awaiting assignment'}
              </td>
              <td>{formatDate(ticket.updatedAt || ticket.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ title, detail, to, linkLabel = 'View all' }) {
  return (
    <div className="dashboard-section-heading">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {to && <Link className="dashboard-text-link" to={to}>{linkLabel}<ArrowRight size={14} /></Link>}
    </div>
  );
}

function timeAgo(value) {
  const seconds = Math.max(0, (Date.now() - new Date(value)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return formatDate(value);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [activity, setActivity] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [claiming, setClaiming] = useState('');
  const [jobError, setJobError] = useState('');
  const [availability, setAvailability] = useState(user.availability || 'available');
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setAvailability(user.availability || 'available'); }, [user.availability]);

  useEffect(() => {
    let active = true;
    setNotificationError('');
    api.get('/notifications')
      .then(response => {
        if (active) setNotifications(response.data.notifications.slice(0, 3));
      })
      .catch(requestError => {
        if (active) setNotificationError(requestError.response?.data?.message || 'Unable to load your latest notifications.');
      });
    return () => { active = false; };
  }, [refresh, user.id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const admin = user.role === 'admin';
    const requests = [
      admin ? api.get('/admin/dashboard') : api.get('/tickets/summary'),
      api.get('/tickets?limit=8'),
    ];
    if (admin) requests.push(api.get('/admin/activity'));
    if (user.role === 'technician') requests.push(api.get('/tickets/available?limit=6'));

    Promise.all(requests)
      .then(responses => {
        if (!active) return;
        const [overview, latest] = responses;
        if (admin) {
          setStats(overview.data.stats);
          setWorkload(overview.data.workload || []);
          setActivity(responses[2].data.activity || []);
        } else {
          setStats(overview.data.summary);
        }
        setRecent(latest.data.tickets || []);
        if (user.role === 'technician') setAvailableJobs(responses[2].data.tickets || []);
      })
      .catch(e => {
        if (active) setError(e.response?.data?.message || 'Could not load the dashboard. Please try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, user]);

  const claimJob = async ticketId => {
    setClaiming(ticketId);
    setJobError('');
    try {
      await api.patch(`/tickets/${ticketId}/claim`);
      setRefresh(current => current + 1);
    } catch (requestError) {
      setJobError(requestError.response?.data?.message || 'Unable to accept this service request.');
    } finally {
      setClaiming('');
    }
  };

  const updateAvailability = async event => {
    const nextAvailability = event.target.value;
    setAvailabilityBusy(true);
    setAvailabilityError('');
    try {
      const response = await api.patch('/auth/availability', { availability: nextAvailability });
      setAvailability(response.data.availability);
    } catch (requestError) {
      setAvailabilityError(requestError.response?.data?.message || 'Could not update your availability.');
    } finally {
      setAvailabilityBusy(false);
    }
  };

  const role = user.role;
  const activeRequests = (stats?.open || 0) + (stats?.assigned || 0) + (stats?.inProgress || 0);
  const metrics = useMemo(() => {
    if (!stats) return [];
    if (role === 'admin') return [
      { label: 'Total requests', value: stats.total, note: 'Across all work orders', icon: ClipboardList, tone: 'blue' },
      { label: 'Pending assignment', value: stats.open, note: 'Needs a technician', icon: Clock3, tone: 'amber' },
      { label: 'Active repairs', value: stats.inProgress, note: 'Technician work in progress', icon: Wrench, tone: 'blue' },
      { label: 'Completed requests', value: stats.resolved + stats.closed, note: 'Resolved or closed', icon: CheckCircle2, tone: 'green' },
      { label: 'Overdue requests', value: stats.overdue, note: 'Past their SLA due date', icon: AlertTriangle, tone: stats.overdue ? 'red' : 'green' },
      { label: 'Available technicians', value: stats.activeTechnicians, note: `Of ${stats.technicians} on the team`, icon: Users, tone: 'green' },
    ];
    if (role === 'technician') return [
      { label: "Today's assignments", value: stats.todayAssigned, note: 'Jobs assigned since midnight', icon: ClipboardList, tone: 'blue' },
      { label: 'Available assignments', value: stats.availableAssignments, note: 'Open work you can accept', icon: Clock3, tone: 'amber' },
      { label: 'Active repairs', value: stats.inProgress, note: 'Work in progress', icon: Wrench, tone: 'blue' },
      { label: 'Pending assignments', value: stats.assigned, note: 'Assigned and waiting to start', icon: Clock3, tone: 'amber' },
      { label: 'Completed', value: stats.resolved + stats.closed, note: 'Resolved service requests', icon: CheckCircle2, tone: 'green' },
      { label: 'Overdue jobs', value: stats.overdue, note: 'Past their SLA deadline', icon: AlertTriangle, tone: stats.overdue ? 'red' : 'green' },
    ];
    return [
      { label: 'Active requests', value: activeRequests, note: 'Currently being handled', icon: ClipboardList, tone: 'blue' },
      { label: 'Awaiting assignment', value: stats.open, note: 'Received by the service team', icon: Clock3, tone: 'amber' },
      { label: 'In progress', value: stats.inProgress, note: 'Technician working on it', icon: Wrench, tone: 'blue' },
      { label: 'Resolved', value: stats.resolved + stats.closed, note: 'Completed requests', icon: CheckCircle2, tone: 'green' },
    ];
  }, [activeRequests, role, stats]);

  const pageTitle = role === 'admin' ? 'Operations overview' : role === 'technician' ? 'Field workbench' : 'My service desk';
  const subtitle = role === 'admin'
    ? 'A live view of service demand, technician capacity and SLA health.'
    : role === 'technician'
      ? 'Your assigned work and repair progress, all in one place.'
      : 'Track requests, review updates and get help with your workplace.';

  if (loading) return (
    <div className="dashboard-loading" role="status" aria-label="Loading dashboard">
      <div className="skeleton dashboard-skeleton-title" />
      <div className="stat-grid">{[1, 2, 3, 4, 5, 6].map(item => <div key={item} className="skeleton dashboard-skeleton-card" />)}</div>
      <div className="skeleton dashboard-skeleton-panel" />
    </div>
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">{formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <h1>{pageTitle}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="dashboard-header-actions">
          {role === 'technician' && (
            <label className="availability-control">
              <span>Availability</span>
              <select className="field" value={availability} disabled={availabilityBusy} onChange={updateAvailability} aria-label="Set your availability">
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
          )}
          {role === 'employee'
            ? <Link to="/tickets?new=1" className="btn"><Plus size={16} />Report an issue</Link>
            : <Link to="/tickets" className="btn">{role === 'technician' ? <Wrench size={16} /> : <ClipboardList size={16} />}{role === 'technician' ? 'Open my work' : 'View service requests'}</Link>}
        </div>
      </header>

      {availabilityError && <div className="dashboard-error" role="alert"><AlertTriangle size={17} />{availabilityError}</div>}
      {error && (
        <div className="dashboard-error" role="alert">
          <AlertTriangle size={17} /><span>{error}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {notificationError && <div className="dashboard-error" role="alert"><AlertTriangle size={16} />{notificationError}</div>}
      {notifications.length > 0 && (
        <section className="card dashboard-panel dashboard-notifications">
          <SectionHeading
            title="Latest notifications"
            detail={role === 'admin'
              ? 'New requests and service desk changes'
              : role === 'technician'
                ? 'Assignments and updates on your jobs'
                : 'Updates on your service requests'}
            to="/notifications"
            linkLabel="All notifications"
          />
          <div className="dashboard-notification-list">
            {notifications.map(notification => (
              <article className="dashboard-notification" key={notification._id}>
                <span className={`dashboard-notification-icon${notification.isRead ? '' : ' unread'}`}><Bell size={16} /></span>
                <div className="dashboard-notification-copy">
                  <p>{notification.message}</p>
                  <time>{timeAgo(notification.createdAt)}</time>
                </div>
                {!notification.isRead && <span className="dashboard-notification-dot" aria-label="Unread" />}
              </article>
            ))}
          </div>
        </section>
      )}

      {stats && (
        <section className="stat-grid dashboard-kpis" aria-label="Service metrics">
          {metrics.map(metric => <KpiCard key={metric.label} {...metric} />)}
        </section>
      )}

      {role === 'admin' && stats && (
        <>
          {(stats.overdue > 0 || stats.maintenanceAlerts > 0) && (
            <section className="dashboard-alerts" aria-label="Maintenance alerts">
              {stats.overdue > 0 && (
                <div className="dashboard-alert alert-danger">
                  <AlertTriangle size={17} />
                  <div><strong>{stats.overdue} overdue {stats.overdue === 1 ? 'request' : 'requests'}</strong><span>Review tickets past their SLA target.</span></div>
                  <Link to="/tickets">Review<ArrowRight size={14} /></Link>
                </div>
              )}
              {stats.maintenanceAlerts > 0 && (
                <div className="dashboard-alert alert-warning">
                  <Package size={17} />
                  <div><strong>{stats.maintenanceAlerts} asset {stats.maintenanceAlerts === 1 ? 'needs' : 'items need'} maintenance</strong><span>Follow up on equipment condition.</span></div>
                  <Link to="/assets">View assets<ArrowRight size={14} /></Link>
                </div>
              )}
            </section>
          )}

          <div className="dashboard-admin-grid">
            <section className="card dashboard-panel">
              <SectionHeading title="Request status" detail="Current workload across all service requests" />
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={[
                    { name: 'Open', count: stats.open, color: '#C58A28' },
                    { name: 'Assigned', count: stats.assigned, color: '#356AE6' },
                    { name: 'In progress', count: stats.inProgress, color: '#23354D' },
                    { name: 'Resolved', count: stats.resolved, color: '#21845A' },
                    { name: 'Closed', count: stats.closed, color: '#8993A3' },
                  ]} barCategoryGap="35%">
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }} />
                    <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]}>
                      {[stats.open, stats.assigned, stats.inProgress, stats.resolved, stats.closed].map((_, index) => (
                        <Cell key={index} fill={['#C58A28', '#356AE6', '#23354D', '#21845A', '#8993A3'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card dashboard-panel">
              <SectionHeading title="Technician workload" detail="Active jobs by technician" to="/team" />
              {workload.length === 0 ? (
                <EmptyState title="No technicians yet" detail="Add technicians to start assigning work." />
              ) : (
                <div className="workload-list">
                  {workload.slice(0, 6).map(technician => {
                    const maxJobs = Math.max(1, ...workload.map(person => person.activeJobs));
                    return (
                      <div className="workload-row" key={technician.id}>
                        <div className="workload-person">
                          <span className={`availability-dot ${technician.availability}`} />
                          <span className="workload-name">{technician.name}</span>
                          <span className="workload-count">{technician.activeJobs}</span>
                        </div>
                        <div className="workload-track"><span style={{ width: `${Math.min(100, technician.activeJobs / maxJobs * 100)}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="sla-summary">
                <div className="sla-summary-heading"><ShieldCheck size={16} /> SLA monitoring</div>
                <div className="sla-summary-stats">
                  <div><strong className={stats.overdue ? 'text-danger' : ''}>{stats.overdue}</strong><span>Overdue</span></div>
                  <div><strong>{stats.dueSoon}</strong><span>Due in 24 hours</span></div>
                </div>
              </div>
            </section>
          </div>

          <section className="card dashboard-panel">
            <SectionHeading title="Recent activity" detail="Latest updates from the service desk" />
            {activity.length === 0 ? (
              <EmptyState title="No recent activity" detail="Ticket updates will appear here." />
            ) : (
              <div className="dashboard-activity-list">
                {activity.slice(0, 5).map((item, index) => (
                  <div className="dashboard-activity" key={item._id || `${item.createdAt}-${index}`}>
                    <span className="activity-mark"><Activity size={15} /></span>
                    <div className="activity-copy"><strong>{item.ticket?.title || 'Service request'}</strong><span>{item.action}{item.updatedBy?.name ? ` · ${item.updatedBy.name}` : ''}</span></div>
                    <time>{timeAgo(item.createdAt)}</time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {role === 'technician' && (
        <>
          {jobError && <div className="dashboard-error" role="alert">{jobError}</div>}
          <section className="card dashboard-panel">
            <SectionHeading title="My assigned jobs" detail="Prioritize due dates and urgent repairs" to="/tickets" />
            {recent.length === 0 ? (
              <EmptyState title="Your work queue is clear" detail="New assignments will appear here." />
            ) : <RequestTable tickets={recent} role={role} />}
          </section>
          <section className="card dashboard-panel">
            <SectionHeading title="Available assignments" detail="Unassigned requests you can claim" to="/tickets" />
            {availableJobs.length === 0 ? <EmptyState title="No open assignments" detail="New unassigned work will appear here." />
              : <div className="available-job-list">{availableJobs.map(ticket => (
                <article className="available-job" key={ticket._id}>
                  <div className="available-job-priority"><span className={`priority-label priority-${ticket.priority}`}>{ticket.priority}</span><StatusPill status={ticket.status} /></div>
                  <strong>{ticket.title}</strong>
                  <span>{ticket.category} · {ticket.location || 'Location not set'}</span>
                  <button className="btn btn-secondary btn-sm" disabled={Boolean(claiming) || availability === 'unavailable'} onClick={() => claimJob(ticket._id)}>
                    {claiming === ticket._id ? <Loader size={13} className="spinner" /> : <Wrench size={13} />}Accept assignment
                  </button>
                </article>
              ))}</div>}
          </section>
        </>
      )}

      {role === 'employee' && (
        <div className="dashboard-employee-grid">
          <section className="card dashboard-panel">
            <SectionHeading title="My service requests" detail="Requests currently being handled" to="/tickets" />
            {recent.filter(ticket => ACTIVE_STATUSES.includes(ticket.status)).length === 0 ? (
              <EmptyState
                title="No active requests"
                detail="When you report a maintenance issue, its progress will show here."
                action={<Link to="/tickets?new=1" className="btn btn-secondary btn-sm">Report an issue</Link>}
              />
            ) : <RequestTable tickets={recent.filter(ticket => ACTIVE_STATUSES.includes(ticket.status))} role={role} />}
          </section>
        </div>
      )}

      {role === 'admin' && (
        <section className="card dashboard-panel">
          <SectionHeading title="Recent service requests" detail="The latest requests across your organization" to="/tickets" />
          {recent.length === 0
            ? <EmptyState title="No service requests yet" detail="New requests will appear here." />
            : <RequestTable tickets={recent} role={role} />}
        </section>
      )}
    </div>
  );
}
