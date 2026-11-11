import { useEffect, useState } from 'react';
import { Activity, Loader, RefreshCw, Sparkles, Star, Users, Wrench } from 'lucide-react';
import api from '../services/api';

export default function SmartMatching() {
  const [tickets, setTickets] = useState([]);
  const [matchesByTicket, setMatchesByTicket] = useState({});
  const [loading, setLoading] = useState(true);
  const [matchingId, setMatchingId] = useState('');
  const [assigningId, setAssigningId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/tickets?status=open&limit=100')
      .then(response => setTickets(response.data.tickets.filter(ticket => !ticket.assignedTo)))
      .catch(requestError => setError(requestError.response?.data?.message || 'Unable to load open requests.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const match = async ticketId => {
    setMatchingId(ticketId);
    setError('');
    try {
      const response = await api.get(`/tickets/${ticketId}/matches`);
      setMatchesByTicket(current => ({ ...current, [ticketId]: response.data.matches }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to calculate technician matches.');
    } finally {
      setMatchingId('');
    }
  };

  const assign = async (ticketId, technicianId) => {
    setAssigningId(technicianId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/tickets/${ticketId}/assign`, { technicianId });
      setSuccess('Technician assigned. The employee and technician have been notified.');
      setMatchesByTicket(current => {
        const next = { ...current };
        delete next[ticketId];
        return next;
      });
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to assign this technician.');
    } finally {
      setAssigningId('');
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header"><div><div className="dashboard-eyebrow">Rule-based technician recommendations</div><h1>Smart technician matching</h1><p>Rank open work using skill fit, availability, workload, rating and experience.</p></div><button className="btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={14} />Refresh requests</button></header>
      {error && <div className="dashboard-error" role="alert">{error}</div>}
      {success && <div className="password-reset-success" role="status">{success}</div>}
      <div className="matching-guidance"><Sparkles size={16} /><span>Recommendations are deterministic and explain each candidate’s score. Unavailable technicians are excluded from assignment.</span></div>
      {loading ? <div className="dashboard-loading"><div className="skeleton dashboard-skeleton-panel" /></div>
        : tickets.length === 0 ? <section className="card"><div className="dashboard-empty"><Activity size={21} /><div><div className="dashboard-empty-title">No unassigned requests</div><div className="dashboard-empty-detail">Open service requests will appear when they need a technician.</div></div></div></section>
          : <div className="matching-ticket-list">{tickets.map(ticket => {
            const matches = matchesByTicket[ticket._id] || [];
            return <section className="card matching-ticket" key={ticket._id}>
              <div className="matching-ticket-header">
                <div><span className={`priority-label priority-${ticket.priority}`}>{ticket.priority}</span><span className="matching-category">{ticket.category}</span></div>
                <span className="dashboard-request-meta">{ticket.location || 'Location not set'}</span>
              </div>
              <h2>{ticket.title}</h2>
              <p>{ticket.description}</p>
              <div className="matching-ticket-footer"><span>Reported {new Date(ticket.createdAt).toLocaleDateString()}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => match(ticket._id)} disabled={matchingId === ticket._id}>
                  {matchingId === ticket._id ? <Loader size={13} className="spinner" /> : <Sparkles size={13} />}Find technicians
                </button>
              </div>
              {matches.length > 0 && <div className="matching-candidates">
                {matches.map((technician, index) => <article className={`match-card${index === 0 && technician.eligible ? ' recommended' : ''}`} key={technician.id}>
                  <div className="match-card-heading"><div><strong>{technician.name}</strong><span>{technician.userId} · {technician.experienceYears} years experience</span></div><div className="match-score">{technician.score}<small>% match</small></div></div>
                  <div className="match-facts"><span><Star size={13} />{technician.rating.toFixed(1)} rating</span><span><Wrench size={13} />{technician.activeJobs} active jobs</span><span className={`match-availability ${technician.availability}`}>{technician.availability}</span></div>
                  <div className="match-reasons">{technician.reasons.join(' · ')}</div>
                  <button className="btn btn-sm" disabled={!technician.eligible || Boolean(assigningId)} onClick={() => assign(ticket._id, technician.id)}>
                    {assigningId === technician.id ? <Loader size={13} className="spinner" /> : <Users size={13} />}Assign
                  </button>
                </article>)}
              </div>}
              {Object.hasOwn(matchesByTicket, ticket._id) && matches.length === 0 && <div className="matching-no-candidates">No technicians are available to recommend. Add technician accounts or update team availability.</div>}
            </section>;
          })}</div>}
    </div>
  );
}
