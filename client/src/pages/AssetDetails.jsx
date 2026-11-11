import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, Loader, Package, Wrench } from 'lucide-react';
import api from '../services/api';

const STATUS_LABELS = {
  open: 'Open',
  assigned: 'Assigned',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AssetDetails() {
  const { assetCode } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get(`/assets/code/${encodeURIComponent(assetCode)}`)
      .then(response => { if (active) setData(response.data); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || 'Unable to load this asset.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [assetCode]);

  if (loading) return <div className="asset-details-loading"><Loader size={19} className="spinner" />Loading asset details…</div>;
  if (error) return <div className="dashboard-error" role="alert">{error}<Link to="/assets">Return to assets</Link></div>;
  const { asset, maintenanceHistory, serviceHistory } = data;

  return (
    <div className="asset-detail-page">
      <Link to="/assets" className="asset-back-link"><ArrowLeft size={15} />Asset directory</Link>
      <header className="asset-detail-header">
        <div className="asset-detail-icon"><Package size={20} /></div>
        <div>
          <div className="dashboard-eyebrow">{asset.assetCode} · {asset.category}</div>
          <h1>{asset.assetName}</h1>
          <p>{asset.location}</p>
        </div>
        <span className={`badge badge-${asset.condition}`}>{asset.condition.replaceAll('-', ' ')}</span>
      </header>

      <section className="asset-detail-facts">
        <article className="card">
          <span>Maintenance interval</span>
          <strong>{asset.maintenanceIntervalDays} days</strong>
        </article>
        <article className="card">
          <span>Purchase date</span>
          <strong>{asset.purchaseDate ? formatDate(asset.purchaseDate) : 'Not recorded'}</strong>
        </article>
        <article className="card">
          <span>Service requests</span>
          <strong>{serviceHistory.length}</strong>
        </article>
      </section>

      {asset.description && <section className="card asset-description"><h2>Asset notes</h2><p>{asset.description}</p></section>}

      <section className="card dashboard-panel">
        <div className="dashboard-section-heading"><div><h2>Maintenance history</h2><p>Recorded maintenance visits and parts</p></div></div>
        {maintenanceHistory.length === 0
          ? <div className="dashboard-empty"><Wrench size={20} /><div><div className="dashboard-empty-title">No maintenance recorded</div><div className="dashboard-empty-detail">Maintenance entries will appear here after service.</div></div></div>
          : <div className="asset-history-list">{maintenanceHistory.slice().reverse().map((entry, index) => (
            <article key={`${entry._id || entry.performedAt}-${index}`} className="asset-history-item">
              <CalendarDays size={15} />
              <div><strong>{formatDate(entry.performedAt)}</strong><p>{entry.notes}</p>{entry.parts?.length > 0 && <span>Parts: {entry.parts.join(', ')}</span>}</div>
              <small>{entry.performedBy?.name || 'Service team'}</small>
            </article>
          ))}</div>}
      </section>

      <section className="card dashboard-panel">
        <div className="dashboard-section-heading"><div><h2>Service history</h2><p>Requests linked to this asset, visible to you</p></div></div>
        {serviceHistory.length === 0
          ? <div className="dashboard-empty"><Clock3 size={20} /><div><div className="dashboard-empty-title">No service requests found</div><div className="dashboard-empty-detail">Related service requests will appear here.</div></div></div>
          : <div className="asset-history-list">{serviceHistory.map(ticket => (
            <article key={ticket._id} className="asset-history-item">
              <span className={`history-status ${ticket.status}`}><Wrench size={14} /></span>
              <div><strong>{ticket.title}</strong><p>{ticket.category} · Updated {formatDate(ticket.updatedAt)}</p>{ticket.resolutionNotes && <span>{ticket.resolutionNotes}</span>}</div>
              <span className={`badge badge-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
            </article>
          ))}</div>}
      </section>
    </div>
  );
}
