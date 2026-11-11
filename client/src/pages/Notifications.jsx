import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Loader, Wrench, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const typeColors = {
  assignment: { bg:'#EAF0FC', fg:'#2D56A0', icon:Wrench },
  status:     { bg:'#E8F4EE', fg:'#1D6848', icon:CheckCircle2 },
  default:    { bg:'#F0F3F7', fg:'#667085', icon:Bell },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/notifications')
      .then(r => setItems(r.data.notifications))
      .catch(() => setError('Unable to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const read = async id => {
    setError('');
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems(prev => prev.map(n => n._id === id ? {...n, isRead:true} : n));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark this notification as read.');
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setError('');
    const unread = items.filter(n => !n.isRead);
    try {
      await Promise.all(unread.map(n => api.patch(`/notifications/${n._id}/read`)));
      setItems(prev => prev.map(n => ({...n, isRead:true})));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* Header */}
      <div className="section-header fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
            <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{
                background:'#ef4444', color:'white',
                borderRadius:99, fontSize:12, fontWeight:700,
                padding:'2px 9px', minWidth:22, textAlign:'center'
              }}>{unreadCount}</span>
            )}
          </div>
          <p className="muted" style={{ fontSize:14 }}>Updates about your assignments and service requests.</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead} disabled={markingAll}>
            {markingAll ? <Loader size={15} className="spinner"/> : <CheckCheck size={15}/>}
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', color:'#dc2626', fontSize:14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'#94a3b8' }}>
          <Loader size={20} className="spinner"/> Loading notifications…
        </div>
      ) : items.length === 0 ? (
        <div className="card fade-up" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'72px 20px', gap:16, color:'#94a3b8' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bell size={28} strokeWidth={1.5}/>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>All caught up!</div>
            <div style={{ fontSize:14 }}>No notifications yet. We'll alert you when something changes.</div>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Unread section */}
          {unreadCount > 0 && (
            <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', paddingLeft:4 }}>
              Unread · {unreadCount}
            </div>
          )}
          {items.filter(n=>!n.isRead).map((n, i) => {
            const tc = typeColors[n.type] || typeColors.default;
            return (
              <div key={n._id} className={`card fade-up fade-up-${Math.min(i+1,4)}`} style={{
                display:'flex', alignItems:'flex-start', gap:14,
                borderLeft:'3px solid var(--accent)',
                background:'var(--card)',
                transition:'box-shadow .15s',
              }}>
                <div style={{ width:36,height:36,borderRadius:8,background:tc.bg,color:tc.fg,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',marginTop:1 }}>
                  <tc.icon size={17}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{n.message}</div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{timeAgo(n.createdAt)}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink:0, whiteSpace:'nowrap' }}
                  onClick={() => read(n._id)}
                >
                  <Check size={13}/> Mark read
                </button>
              </div>
            );
          })}

          {/* Read section */}
          {items.some(n=>n.isRead) && (
            <>
              <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', paddingLeft:4, marginTop:12 }}>
                Earlier
              </div>
              {items.filter(n=>n.isRead).map((n, i) => {
                const tc = typeColors[n.type] || typeColors.default;
                return (
                  <div key={n._id} className="card" style={{ display:'flex', alignItems:'flex-start', gap:14, opacity:.8 }}>
                      <div style={{ width:36,height:36,borderRadius:8,background:tc.bg,color:tc.fg,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',marginTop:1 }}>
                        <tc.icon size={17}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, marginBottom:4 }}>{n.message}</div>
                      <div style={{ fontSize:12, color:'#94a3b8' }}>{timeAgo(n.createdAt)}</div>
                    </div>
                    <Check size={14} color="#94a3b8" style={{ flexShrink:0, marginTop:2 }}/>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
