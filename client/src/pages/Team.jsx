import { useEffect, useState } from 'react';
import { Plus, X, Users, Search, Loader, Shield, Wrench, UserCheck, Phone, Mail } from 'lucide-react';
import api from '../services/api';

const ROLES = ['technician','employee','admin'];
const DEPARTMENTS = ['Engineering','IT','Finance','HR','Operations','Marketing','Facilities','Other'];

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h3 style={{ fontWeight:700, fontSize:17 }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:'6px 8px', borderRadius:8 }}><X size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const roleIcons = { admin: Shield, technician: Wrench, employee: UserCheck };
const roleColors = {
  admin:      { bg:'#EAF0FC', fg:'#2D56A0' },
  technician: { bg:'#EAF0FC', fg:'#2D56A0' },
  employee:   { bg:'#E8F4EE', fg:'#1D6848' },
};
const availColors = {
  available:   { bg:'#E8F4EE', fg:'#1D6848' },
  busy:        { bg:'#FBF3E4', fg:'#815A18' },
  unavailable: { bg:'#FBECEC', fg:'#A43D3D' },
};

export default function Team({ techniciansOnly = false }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(techniciansOnly ? 'technician' : '');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'technician', department:'', phone:'', skills:'', experienceYears:'0' });

  const load = () => {
    setLoading(true);
    api.get('/admin/users')
      .then(r => setUsers(r.data.users))
      .catch(e => setError(e.response?.data?.message || 'Unable to load team'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/users', {
        ...form,
        skills: form.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        experienceYears: Number(form.experienceYears),
      });
      setForm({ name:'', email:'', password:'', role:'technician', department:'', phone:'', skills:'', experienceYears:'0' });
      setShowModal(false);
      load();
    } catch (e) { setError(e.response?.data?.message || 'Could not create user'); }
    finally { setBusy(false); }
  };

  const filtered = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.userId?.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = { admin: users.filter(u=>u.role==='admin').length, technician: users.filter(u=>u.role==='technician').length, employee: users.filter(u=>u.role==='employee').length };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* Header */}
      <div className="section-header fade-up">
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em', marginBottom:4 }}>{techniciansOnly ? 'Technician management' : 'Team management'}</h1>
          <p className="muted" style={{ fontSize:14 }}>{techniciansOnly ? 'Skills, availability and technician workload.' : 'Manage technicians, employees and admin accounts.'}</p>
        </div>
        <button className="btn" onClick={() => setShowModal(true)}><Plus size={17}/> Add Member</button>
      </div>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', color:'#dc2626', fontSize:14 }}>
          {error}
        </div>
      )}

      {/* Role summary */}
      <div className="stat-grid fade-up" style={{ animationDelay:'.05s' }}>
        {ROLES.map(role => {
          const Icon = roleIcons[role];
          const rc = roleColors[role];
          return (
            <div key={role} className="stat-card" style={{ cursor:'pointer' }} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ background:rc.bg, borderRadius:10, padding:9 }}>
                  <Icon size={20} color={rc.fg}/>
                </div>
                {roleFilter === role && <span style={{ fontSize:10, fontWeight:700, background:rc.bg, color:rc.fg, padding:'2px 8px', borderRadius:99 }}>Active filter</span>}
              </div>
              <div style={{ fontSize:30, fontWeight:800, marginBottom:4 }}>{counts[role]}</div>
              <div style={{ fontSize:14, fontWeight:600, textTransform:'capitalize' }}>{role}s</div>
            </div>
          );
        })}
        <div className="stat-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ background:'#f1f5f9', borderRadius:10, padding:9 }}>
              <Users size={20} color="#64748b"/>
            </div>
          </div>
          <div style={{ fontSize:30, fontWeight:800, marginBottom:4 }}>{users.length}</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Total Members</div>
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <Modal title="Add Team Member" onClose={() => setShowModal(false)}>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Full Name *</label>
                <input className="field" placeholder="Jane Smith" required value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})}/>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Role *</label>
                <select className="field" value={form.role} onChange={e => setForm({...form, role:e.target.value})} disabled={techniciansOnly}>
                  {(techniciansOnly ? ['technician'] : ROLES).map(r => <option key={r} value={r} style={{ textTransform:'capitalize' }}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Email *</label>
              <input className="field" type="email" placeholder="jane@company.com" required value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Temporary Password (8+ chars) *</label>
              <input className="field" type="password" minLength={8} required value={form.password}
                placeholder="Minimum 8 characters"
                onChange={e => setForm({...form, password:e.target.value})}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Department</label>
                <select className="field" value={form.department} onChange={e => setForm({...form, department:e.target.value})}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              {form.role === 'technician' && (
                <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Skills (comma separated)</label>
                    <input className="field" placeholder="Electrical, HVAC" value={form.skills}
                      onChange={e => setForm({...form, skills:e.target.value})}/>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Experience (years)</label>
                    <input className="field" type="number" min="0" max="60" value={form.experienceYears}
                      onChange={e => setForm({...form, experienceYears:e.target.value})}/>
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Phone</label>
                <input className="field" type="tel" placeholder="+1 555 000 0000" value={form.phone}
                  onChange={e => setForm({...form, phone:e.target.value})}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn" style={{ flex:2 }} disabled={busy}>
                {busy ? <><Loader size={15} className="spinner"/> Creating…</> : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Search + filter */}
      <div className="card fade-up" style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
            <Search size={15}/>
            <input className="field" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          {!techniciansOnly && <select className="field" style={{ width:'auto', minWidth:150 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r} style={{ textTransform:'capitalize' }}>{r}</option>)}
          </select>}
          {(search || (roleFilter && !techniciansOnly)) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); if (!techniciansOnly) setRoleFilter(''); }}>
              <X size={14}/> Clear
            </button>
          )}
        </div>
      </div>

      {/* Team table */}
      <div className="card fade-up" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'#94a3b8' }}>
            <Loader size={20} className="spinner"/> Loading team…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 20px', gap:14, color:'#94a3b8' }}>
            <Users size={40} strokeWidth={1.2}/>
            <div style={{ fontSize:15, fontWeight:600 }}>No team members found</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  {!techniciansOnly && <th>Role</th>}
                  {techniciansOnly && <><th>Skills & experience</th><th>Rating</th></>}
                  <th>Department</th>
                  <th>Contact</th>
                  <th>Availability</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rc = roleColors[u.role] || {};
                  const ac = availColors[u.availability] || availColors.available;
                  const initials = u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:34,height:34,borderRadius:'50%',flexShrink:0,
                            background:'#356AE6',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontWeight:700,fontSize:12,color:'white'
                          }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight:600 }}>{u.name}</div>
                            <div style={{ fontSize:11, color:'var(--muted)' }}>{u.userId || u.email}</div>
                          </div>
                        </div>
                      </td>
                      {!techniciansOnly && <td>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:rc.bg, color:rc.fg, borderRadius:99, fontSize:11, fontWeight:700, padding:'3px 10px', textTransform:'capitalize' }}>
                          {u.role}
                        </span>
                      </td>}
                      {techniciansOnly && <>
                        <td>
                          <div>{u.skills?.length ? u.skills.join(', ') : 'No skills listed'}</div>
                          <div style={{ fontSize:11, color:'var(--muted)' }}>{u.experienceYears || 0} years experience</div>
                        </td>
                        <td>{Number(u.rating ?? 5).toFixed(1)} / 5</td>
                      </>}
                      <td style={{ color:'#64748b' }}>{u.department || '—'}</td>
                      <td>
                        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                          <span style={{ fontSize:13, color:'#64748b', display:'flex', alignItems:'center', gap:5 }}>
                            <Mail size={12}/>{u.email}
                          </span>
                          {u.phone && (
                            <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:5 }}>
                              <Phone size={11}/>{u.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:ac.bg, color:ac.fg, borderRadius:99, fontSize:11, fontWeight:700, padding:'3px 10px', textTransform:'capitalize' }}>
                          {u.availability || 'available'}
                        </span>
                      </td>
                      <td style={{ color:'#94a3b8', fontSize:12 }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
