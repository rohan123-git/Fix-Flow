import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, X, Search, Loader, FileText, CheckCircle,
  Wrench, List, Columns, Send, Clock, AlertTriangle,
  Calendar, MessageSquare, ChevronRight, User, Sparkles, Star
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─── Constants ─────────────────────────────────────── */
const CATEGORIES = ['Electrical','Plumbing','HVAC','IT Support','Furniture','Cleaning','Security','Other'];
const PRIORITIES  = ['low','medium','high','critical'];
const STATUSES    = ['open','assigned','in-progress','resolved','closed'];
const PRIORITY_COLOR = { low:'#21845A', medium:'#C58A28', high:'#D65353', critical:'#D65353' };
const STATUS_META = {
  open:         { color:'#815A18', bg:'#FBF3E4', label:'Open'        },
  assigned:     { color:'#2D56A0', bg:'#EAF0FC', label:'Assigned'    },
  'in-progress':{ color:'#2D56A0', bg:'#EAF0FC', label:'In Progress' },
  resolved:     { color:'#1D6848', bg:'#E8F4EE', label:'Resolved'    },
  closed:       { color:'var(--muted)', bg:'var(--bg-2)', label:'Closed'  },
};
const ROLE_COLOR = { admin:'#2D56A0', technician:'#2D56A0', employee:'#1D6848' };
const IMAGE_API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function slaStatus(ticket) {
  if (!ticket.dueDate || ['resolved','closed'].includes(ticket.status)) return null;
  const diff = new Date(ticket.dueDate) - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 24 * 3600 * 1000) return 'due-soon';
  return 'ok';
}

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

/* ─── Toast ──────────────────────────────────────────── */
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); });
  return <div className="toast"><CheckCircle size={15} color="#4ade80" />{msg}</div>;
}

/* ─── Modal wrapper ──────────────────────────────────── */
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: wide ? 640 : 540 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h3 style={{ fontWeight:700, fontSize:17 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" style={{ padding:'5px 8px' }} onClick={onClose}><X size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Ticket Drawer (Detail + Comments) ──────────────── */
function TicketDrawer({ ticket, user, techs, onClose, onRefresh }) {
  const [comments, setComments]   = useState([]);
  const [history,  setHistory]    = useState([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting]     = useState(false);
  const [tab, setTab]             = useState('comments');
  const [actionError, setActionError] = useState('');
  const [checklist, setChecklist] = useState(ticket.repairChecklist?.length
    ? ticket.repairChecklist
    : ['Inspect the reported issue', 'Isolate equipment safely', 'Test the repair', 'Clean the work area'].map(label => ({ label, completed:false })));
  const [partsUsed, setPartsUsed] = useState((ticket.partsUsed || []).join(', '));
  const [savingWorkLog, setSavingWorkLog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/tickets/${ticket._id}/comments`).then(r => setComments(r.data.comments)).catch(e => setActionError(e.response?.data?.message || 'Unable to load comments.'));
    api.get(`/tickets/${ticket._id}/history`).then(r => setHistory(r.data.history)).catch(e => setActionError(e.response?.data?.message || 'Unable to load ticket history.'));
  }, [ticket._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [comments]);

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    setActionError('');
    try {
      const r = await api.post(`/tickets/${ticket._id}/comments`, { text: newComment.trim() });
      setComments(prev => [...prev, r.data.comment]);
      setNewComment('');
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to post your comment.');
    } finally {
      setPosting(false);
    }
  };

  const doAction = async fn => {
    setActionError('');
    try {
      await fn();
      onRefresh();
      onClose();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to update this service request.');
    }
  };
  const startJob = () => doAction(() => api.patch(`/tickets/${ticket._id}/status`, { status:'in-progress' }));
  const closeTicket = () => doAction(() => api.patch(`/tickets/${ticket._id}/close`));
  const saveWorkLog = async () => {
    setSavingWorkLog(true);
    setActionError('');
    try {
      await api.patch(`/tickets/${ticket._id}/worklog`, {
        repairChecklist: checklist,
        partsUsed: partsUsed.split(',').map(part => part.trim()).filter(Boolean),
      });
      onRefresh();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to save the repair checklist.');
    } finally {
      setSavingWorkLog(false);
    }
  };
  const uploadImage = async (event, imageType) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingImage(imageType);
    setActionError('');
    const formData = new FormData();
    formData.append('imageType', imageType);
    formData.append('image', file);
    try {
      await api.post(`/tickets/${ticket._id}/images`, formData);
      onRefresh();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to upload the image.');
    } finally {
      setUploadingImage('');
    }
  };

  const sla = slaStatus(ticket);
  const pc = PRIORITY_COLOR[ticket.priority] || '#6b7280';
  const sm = STATUS_META[ticket.status] || {};

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        {/* Header */}
        <div style={{ padding:'20px 22px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <span style={{ background:sm.bg, color:sm.color, borderRadius:99, fontSize:11, fontWeight:700, padding:'3px 10px' }}>{sm.label}</span>
              <span className={`badge badge-${ticket.priority}`} style={{ textTransform:'capitalize' }}>{ticket.priority}</span>
                {sla === 'overdue'  && <span className="badge badge-overdue">Overdue</span>}
                {sla === 'due-soon' && <span className="badge badge-due-soon">Due soon</span>}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding:'5px 8px', flexShrink:0 }} onClick={onClose}><X size={16}/></button>
          </div>
          <h2 style={{ fontWeight:800, fontSize:17, lineHeight:1.35, marginBottom:10 }}>{ticket.title}</h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:13, color:'var(--muted)' }}>
            <span>Category · {ticket.category}</span>
            {ticket.location && <span>Location · {ticket.location}</span>}
            {ticket.dueDate && <span>Due {new Date(ticket.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          {actionError && <div className="dashboard-error" role="alert" style={{ marginBottom:14 }}>{actionError}</div>}
          {/* Description */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:8 }}>Description</div>
            <p style={{ fontSize:14, lineHeight:1.6, color:'var(--text-2)' }}>{ticket.description}</p>
          </div>

          {/* Meta grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
            {[
              ['Submitted by', ticket.createdBy?.name, ticket.createdBy?.role],
              ['Assigned to', ticket.assignedTo?.name || 'Unassigned', ticket.assignedTo?.role],
              ['Created', new Date(ticket.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), null],
              ticket.resolvedAt ? ['Resolved', new Date(ticket.resolvedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}), null] : null,
            ].filter(Boolean).map(([k, v, role]) => (
              <div key={k} style={{ background:'var(--bg-2)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, marginBottom:4 }}>{k}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{v}</div>
                {role && <div style={{ fontSize:11, color: ROLE_COLOR[role] || 'var(--muted)', textTransform:'capitalize', marginTop:2 }}>{role}</div>}
              </div>
            ))}
          </div>

          {user.role === 'technician' && ticket.status === 'in-progress' && (
            <section className="repair-worklog">
              <div className="repair-section-title">Repair checklist</div>
              {checklist.map((item, index) => (
                <label className="repair-checklist-item" key={`${item.label}-${index}`}>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={event => setChecklist(current => current.map((entry, itemIndex) =>
                      itemIndex === index ? { ...entry, completed:event.target.checked } : entry
                    ))}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              <label className="repair-parts-label" htmlFor={`parts-${ticket._id}`}>Parts used</label>
              <input id={`parts-${ticket._id}`} className="field" placeholder="Comma-separated parts" value={partsUsed} onChange={event => setPartsUsed(event.target.value)} />
              <button className="btn btn-secondary btn-sm" type="button" onClick={saveWorkLog} disabled={savingWorkLog}>
                {savingWorkLog ? <Loader size={13} className="spinner" /> : <CheckCircle size={13} />}Save work log
              </button>
              <div className="repair-image-fields">
                {[
                  ['before', 'Before repair', ticket.beforeImages || []],
                  ['after', 'After repair', ticket.afterImages || []],
                ].map(([imageType, label, images]) => (
                  <div className="repair-image-group" key={imageType}>
                    <label className="repair-parts-label">{label}</label>
                    <label className={`repair-upload ${uploadingImage === imageType ? 'uploading' : ''}`}>
                      {uploadingImage === imageType ? <Loader size={14} className="spinner" /> : <Plus size={14} />}
                      {uploadingImage === imageType ? 'Uploading…' : 'Add image'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploadingImage)} onChange={event => uploadImage(event, imageType)} />
                    </label>
                    {images.length > 0 && (
                      <div className="repair-image-list">
                        {images.map(filename => (
                          <img key={filename} src={`${IMAGE_API_BASE}/api/tickets/${ticket._id}/images/${filename}`} alt={`${label} evidence`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resolution notes */}
          {ticket.resolutionNotes && (
            <div style={{ background:'var(--accent-light)', border:'1px solid var(--accent-mid)', borderRadius:10, padding:'12px 14px', marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--accent)', marginBottom:6 }}>Resolution Notes</div>
              <p style={{ fontSize:13, lineHeight:1.5, color:'var(--text-2)' }}>{ticket.resolutionNotes}</p>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'1.5px solid var(--border)', marginBottom:14 }}>
            {[['comments','💬 Comments'], ['history','📋 History']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding:'8px 14px', background:'none', border:0, borderBottom: tab===id ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab===id ? 'var(--accent)' : 'var(--muted)', fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:-1.5,
                transition:'color .15s',
              }}>{label} {id==='comments' && `(${comments.length})`}</button>
            ))}
          </div>

          {/* Comments tab */}
          {tab === 'comments' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {comments.length === 0 && (
                <div style={{ textAlign:'center', padding:'28px 0', color:'var(--muted)', fontSize:13 }}>
                  No comments yet. Start the conversation.
                </div>
              )}
              {comments.map(c => {
                const mine = c.author?._id === user?.id || c.author?.name === user?.name;
                return (
                  <div key={c._id} style={{ display:'flex', gap:9, flexDirection: mine ? 'row-reverse' : 'row' }}>
                    <div style={{
                      width:28, height:28, borderRadius:'50%', flexShrink:0,
                      background:ROLE_COLOR[c.author?.role] || '#356AE6',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:700, color:'white', marginTop:2,
                    }}>{c.author?.name?.[0]}</div>
                    <div style={{ maxWidth:'75%' }}>
                      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4, textAlign: mine ? 'right' : 'left' }}>
                        {c.author?.name} · {timeAgo(c.createdAt)}
                      </div>
                      <div className={`comment-bubble${mine ? ' mine' : ''}`}>{c.text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {history.length === 0 && (
                <div style={{ textAlign:'center', padding:'28px 0', color:'var(--muted)', fontSize:13 }}>No history available.</div>
              )}
              {history.map((h, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:5 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{h.action}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>by {h.updatedBy?.name} · {timeAgo(h.createdAt)}</div>
                    {h.remarks && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4, fontStyle:'italic' }}>"{h.remarks}"</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: comment input + actions */}
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          {/* Comment input */}
          {tab === 'comments' && (
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input
                className="field" placeholder="Add a comment…"
                value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && postComment()}
                style={{ flex:1 }}
              />
              <button className="btn" style={{ padding:'9px 12px' }} onClick={postComment} disabled={!newComment.trim()||posting}>
                {posting ? <Loader size={14} className="spinner"/> : <Send size={14}/>}
              </button>
            </div>
          )}
          {/* Role-based action buttons */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {user.role === 'technician' && ticket.status === 'assigned' && (
              <button className="btn btn-secondary" onClick={startJob}><Wrench size={14}/> Start Job</button>
            )}
            {user.role === 'technician' && ticket.status === 'in-progress' && (
              <button className="btn btn-success" onClick={() => { onClose(); /* handled in main */ }}>
                <CheckCircle size={14}/> Mark Resolved
              </button>
            )}
            {user.role === 'employee' && ticket.status === 'resolved' && (
              <button className="btn" onClick={closeTicket}><CheckCircle size={14}/> Confirm & Close</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Kanban card ────────────────────────────────────── */
function KanbanCard({ ticket, onClick }) {
  const pc = PRIORITY_COLOR[ticket.priority] || '#6b7280';
  const sla = slaStatus(ticket);
  return (
    <div className="kanban-card" style={{ borderLeftColor: pc }} onClick={onClick}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        <span style={{ background:'var(--bg-2)', color:'var(--muted)', borderRadius:6, fontSize:11, fontWeight:600, padding:'2px 7px' }}>{ticket.category}</span>
        {sla === 'overdue'  && <span className="badge badge-overdue" style={{ fontSize:10, padding:'1px 7px' }}>Overdue</span>}
        {sla === 'due-soon' && <span className="badge badge-due-soon" style={{ fontSize:10, padding:'1px 7px' }}>Due soon</span>}
      </div>
      <div style={{ fontSize:13, fontWeight:700, lineHeight:1.4, marginBottom:8, color:'var(--text)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        {ticket.title}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:'var(--muted)' }}>
          <span className={`dot dot-${ticket.priority}`} />
          <span style={{ textTransform:'capitalize' }}>{ticket.priority}</span>
        </span>
        {ticket.dueDate && (
          <span style={{ fontSize:11, color:'var(--muted-2)' }}>
            <Calendar size={10} style={{ display:'inline', marginRight:3 }}/>
            {new Date(ticket.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
          </span>
        )}
      </div>
      {ticket.assignedTo && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:9, paddingTop:8, borderTop:'1px solid var(--border)' }}>
          <div style={{ width:18, height:18, borderRadius:'50%', background:'#356AE6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'white' }}>
            {ticket.assignedTo.name?.[0]}
          </div>
          <span style={{ fontSize:11, color:'var(--muted)' }}>{ticket.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Kanban board ───────────────────────────────────── */
function KanbanBoard({ tickets, onCardClick }) {
  const cols = STATUSES.map(s => ({
    ...STATUS_META[s], id: s,
    cards: tickets.filter(t => t.status === s),
  }));
  return (
    <div className="kanban-wrap">
      {cols.map(col => (
        <div key={col.id} className="kanban-col">
          <div className="kanban-col-header" style={{ background:col.bg, color:col.color }}>
            <span>{col.label}</span>
            <span style={{ background:'rgba(0,0,0,.08)', borderRadius:99, padding:'1px 7px', fontSize:11 }}>{col.cards.length}</span>
          </div>
          {col.cards.length === 0 && (
            <div style={{ padding:'24px 12px', textAlign:'center', color:'var(--muted-2)', fontSize:12, border:'1.5px dashed var(--border)', borderRadius:10 }}>
              No tickets
            </div>
          )}
          {col.cards.map(t => (
            <KanbanCard key={t._id} ticket={t} onClick={() => onCardClick(t)} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Resolve Modal ──────────────────────────────────── */
function ResolveModal({ ticketId, onClose, onDone }) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!notes.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status:'resolved', resolutionNotes:notes });
      onDone();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to resolve this service request.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Resolve Ticket" onClose={onClose}>
      <p style={{ fontSize:14, color:'var(--muted)', marginBottom:14 }}>Describe what was done to fix the issue.</p>
      <textarea className="field" rows={4} placeholder="Resolution notes…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize:'vertical', marginBottom:14 }} />
      {error && <div className="dashboard-error" role="alert" style={{ marginBottom:14 }}>{error}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-success" style={{ flex:2 }} disabled={!notes.trim()||busy} onClick={submit}>
          {busy ? <Loader size={14} className="spinner"/> : <CheckCircle size={14}/>} Mark Resolved
        </button>
      </div>
    </Modal>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
export default function Tickets() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets,  setTickets]  = useState([]);
  const [techs,    setTechs]    = useState([]);
  const [assets,   setAssets]   = useState([]);
  const [filter,   setFilter]   = useState(() => searchParams.get('status') || '');
  const [search,   setSearch]   = useState(() => searchParams.get('search') || '');
  const [view,     setView]     = useState('list');
  const [showCreate, setShowCreate] = useState(false);
  const [drawer,   setDrawer]   = useState(null);
  const [matchTicket, setMatchTicket] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matching, setMatching] = useState(false);
  const [resolveId, setResolveId] = useState(null);
  const [form,     setForm]     = useState({ title:'', description:'', category:'Electrical', priority:'medium', location:'', asset:'', dueDate:'' });
  const [error,    setError]    = useState('');
  const [toast,    setToast]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(false);
  const canCreate = ['employee','admin'].includes(user.role);

  useEffect(() => {
    if (searchParams.get('new') === '1' && canCreate) {
      setShowCreate(true);
      setSearchParams({}, { replace:true });
    }
  }, [canCreate, searchParams, setSearchParams]);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/tickets', { params:{ status:filter||undefined, search:search||undefined, limit:100 } })
      .then(r => setTickets(r.data.tickets))
      .catch(e => setError(e.response?.data?.message||'Unable to load tickets'))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/admin/technicians').then(r => setTechs(r.data.technicians));
      api.get('/assets').then(r => setAssets(r.data.assets));
    }
  }, [user.role]);

  const ok = (msg) => { setToast(msg); load(); };

  const create = async e => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post('/tickets', { ...form, dueDate: form.dueDate || null, asset: form.asset || null });
      setShowCreate(false);
      setForm({ title:'', description:'', category:'Electrical', priority:'medium', location:'', asset:'', dueDate:'' });
      ok('Service request created!');
    } catch (e) { setError(e.response?.data?.message||'Could not create request'); }
    finally { setBusy(false); }
  };

  const assign = async (id, technicianId) => {
    try {
      await api.patch(`/tickets/${id}/assign`, { technicianId });
      ok('Technician assigned!');
      return true;
    } catch (e) {
      setError(e.response?.data?.message||'Assignment failed');
      return false;
    }
  };

  const findMatches = async ticket => {
    setMatchTicket(ticket);
    setMatches([]);
    setMatching(true);
    try {
      const response = await api.get(`/tickets/${ticket._id}/matches`);
      setMatches(response.data.matches);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to find technician matches');
      setMatchTicket(null);
    } finally {
      setMatching(false);
    }
  };

  const assignMatch = async technicianId => {
    const assigned = await assign(matchTicket._id, technicianId);
    if (assigned) setMatchTicket(null);
  };

  const startJob = async id => {
    try { await api.patch(`/tickets/${id}/status`, { status:'in-progress' }); ok('Job started!'); }
    catch (e) { setError(e.response?.data?.message||'Failed'); }
  };

  const closeTicket = async id => {
    try { await api.patch(`/tickets/${id}/close`); ok('Ticket confirmed & closed!'); }
    catch (e) { setError(e.response?.data?.message||'Failed'); }
  };

  const filtered = tickets.filter(t =>
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

      {/* Header */}
      <div className="section-header fade-up">
        <div>
          <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.03em', marginBottom:4 }}>Service Requests</h1>
          <p className="muted" style={{ fontSize:14 }}>Create, assign and track maintenance work orders.</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div className="view-toggle">
            <button className={`view-btn${view==='list'?' active':''}`} onClick={() => setView('list')}><List size={14}/> List</button>
            <button className={`view-btn${view==='kanban'?' active':''}`} onClick={() => setView('kanban')}><Columns size={14}/> Board</button>
          </div>
          {canCreate && <button className="btn" onClick={() => setShowCreate(true)}><Plus size={16}/> New Request</button>}
        </div>
      </div>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', color:'#dc2626', fontSize:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {error}<button onClick={() => setError('')} style={{ background:'none', border:0, color:'#dc2626', cursor:'pointer' }}><X size={15}/></button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Service Request" onClose={() => setShowCreate(false)} wide>
          <form onSubmit={create} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Issue title *</label>
              <input className="field" placeholder="e.g. AC not cooling in Room 301" required value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Category *</label>
                <select className="field" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Priority *</label>
                <select className="field" value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
                  {PRIORITIES.map(p => <option key={p} style={{ textTransform:'capitalize' }}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Location</label>
                <input className="field" placeholder="e.g. Floor 3, Room 301" value={form.location} onChange={e => setForm({...form, location:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Due Date (SLA)</label>
                <input className="field" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            {assets.length > 0 && (
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Related Asset</label>
                <select className="field" value={form.asset} onChange={e => setForm({...form, asset:e.target.value})}>
                  <option value="">None</option>
                  {assets.map(a => <option key={a._id} value={a._id}>{a.assetName} ({a.assetCode})</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Description *</label>
              <textarea className="field" rows={3} placeholder="Describe the issue in detail…" required value={form.description} onChange={e => setForm({...form, description:e.target.value})} style={{ resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn" style={{ flex:2 }} disabled={busy}>
                {busy ? <><Loader size={14} className="spinner"/> Submitting…</> : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Resolve Modal */}
      {matchTicket && (
        <Modal title="Technician recommendations" onClose={() => setMatchTicket(null)} wide>
          <div className="match-ticket-context">
            <span>Request</span>
            <strong>{matchTicket.title}</strong>
            <span>{matchTicket.category} · {matchTicket.priority} priority</span>
          </div>
          {matching ? (
            <div className="match-loading"><Loader size={17} className="spinner" /> Comparing skills, availability and workload…</div>
          ) : matches.length === 0 ? (
            <div className="match-empty">No technicians found. Add technicians and their skills in Technician management.</div>
          ) : (
            <div className="match-list">
              {matches.map((technician, index) => (
                <article className={`match-card${index === 0 && technician.eligible ? ' recommended' : ''}`} key={technician.id}>
                  <div className="match-card-heading">
                    <div>
                      <strong>{technician.name}</strong>
                      <span>{technician.userId} · {technician.experienceYears} years experience</span>
                    </div>
                    <div className="match-score">{technician.score}<small>% match</small></div>
                  </div>
                  <div className="match-facts">
                    <span><Star size={13} />{technician.rating.toFixed(1)} rating</span>
                    <span><Wrench size={13} />{technician.activeJobs} active jobs</span>
                    <span className={`match-availability ${technician.availability}`}>{technician.availability}</span>
                  </div>
                  <div className="match-reasons">{technician.reasons.join(' · ')}</div>
                  <button className="btn btn-sm" disabled={!technician.eligible} onClick={() => assignMatch(technician.id)}>
                    Assign technician
                  </button>
                </article>
              ))}
            </div>
          )}
          <div className="match-scoring-note">Recommendations are rule-based, using skill compatibility, availability, workload, rating and experience.</div>
        </Modal>
      )}

      {/* Resolve Modal */}
      {resolveId && (
        <ResolveModal
          ticketId={resolveId}
          onClose={() => setResolveId(null)}
          onDone={() => { setResolveId(null); ok('Ticket resolved!'); }}
        />
      )}

      {/* Ticket Drawer */}
      {drawer && (
        <TicketDrawer
          ticket={drawer} user={user} techs={techs}
          onClose={() => setDrawer(null)}
          onRefresh={load}
        />
      )}

      {/* Filter bar */}
      <div className="card fade-up" style={{ padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
            <Search size={14} className="icon" />
            <input className="field" placeholder="Search requests…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="field" style={{ width:'auto', minWidth:150 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s} style={{ textTransform:'capitalize' }}>{s}</option>)}
          </select>
          {(filter||search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilter(''); setSearch(''); }}><X size={13}/> Clear</button>
          )}
          <span className="muted" style={{ fontSize:13, whiteSpace:'nowrap' }}>{filtered.length} result{filtered.length!==1?'s':''}</span>
        </div>
      </div>

      {/* ── KANBAN VIEW ── */}
      {view === 'kanban' && (
        <div className="fade-up">
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'var(--muted)' }}>
              <Loader size={18} className="spinner"/> Loading…
            </div>
          ) : (
            <KanbanBoard tickets={filtered} onCardClick={t => setDrawer(t)} />
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="card fade-up" style={{ padding:0, overflow:'hidden' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'var(--muted)' }}>
              <Loader size={18} className="spinner"/> Loading requests…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'56px 20px', gap:14, color:'var(--muted)' }}>
              <FileText size={40} strokeWidth={1.2}/>
              <div style={{ fontSize:15, fontWeight:600 }}>No requests found</div>
              {canCreate && <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(true)}><Plus size={13}/> Create one</button>}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Request</th><th>Submitted</th><th>Priority</th><th>Status</th><th>Due</th><th>Technician</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const sla = slaStatus(t);
                    return (
                      <tr key={t._id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:3, height:36, borderRadius:99, background:PRIORITY_COLOR[t.priority], flexShrink:0 }} />
                            <div>
                              <div style={{ fontWeight:600, maxWidth:200 }} className="text-clip">{t.title}</div>
                              <div style={{ fontSize:12, color:'var(--muted)' }}>{t.category}{t.location?` · ${t.location}`:''}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color:'var(--muted)', fontSize:13 }}>{t.createdBy?.name}</td>
                        <td>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                            <span className={`dot dot-${t.priority}`}/>
                            <span style={{ textTransform:'capitalize', fontSize:13 }}>{t.priority}</span>
                          </span>
                        </td>
                        <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                        <td>
                          {t.dueDate
                            ? <span className={`badge ${sla==='overdue'?'badge-overdue':sla==='due-soon'?'badge-due-soon':'badge-closed'}`}>
                                {sla==='overdue'?'Overdue':new Date(t.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                              </span>
                            : <span style={{ color:'var(--muted-2)' }}>—</span>
                          }
                        </td>
                        <td style={{ color:'var(--muted)', fontSize:13 }}>{t.assignedTo?.name||<span style={{ color:'var(--muted-2)' }}>—</span>}</td>
                        <td>
                          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => setDrawer(t)}><MessageSquare size={12}/> Detail</button>
                            {user.role==='admin' && !['resolved','closed'].includes(t.status) && (
                              <>
                              <button className="btn btn-secondary btn-xs" onClick={() => findMatches(t)} title="Rank technicians for this request"><Sparkles size={12}/>Match</button>
                              <select className="field" style={{ padding:'5px 9px', fontSize:12, minWidth:140 }} value={t.assignedTo?._id||''} onChange={e => e.target.value && assign(t._id, e.target.value)}>
                                <option value="">Assign…</option>
                                {techs.filter(x => x.availability !== 'unavailable').map(x => <option key={x._id} value={x._id}>{x.name}</option>)}
                              </select>
                              </>
                            )}
                            {user.role==='technician' && t.status==='assigned' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => startJob(t._id)}><Wrench size={12}/> Start</button>
                            )}
                            {user.role==='technician' && t.status==='in-progress' && (
                              <button className="btn btn-success btn-sm" onClick={() => setResolveId(t._id)}><CheckCircle size={12}/> Resolve</button>
                            )}
                            {user.role==='employee' && t.status==='resolved' && (
                              <button className="btn btn-sm" onClick={() => closeTicket(t._id)}><CheckCircle size={12}/> Confirm</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
