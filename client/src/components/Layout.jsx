import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Package, Users, Bell, QrCode,
  Wrench, LogOut, Moon, Sun, Menu, X, Search, Contact, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const NAV = [
  { to:'/admin/dashboard', label:'Operations overview', icon:LayoutDashboard, roles:['admin'] },
  { to:'/employee/dashboard', label:'My service desk', icon:LayoutDashboard, roles:['employee'] },
  { to:'/technician/dashboard', label:'Field workbench', icon:LayoutDashboard, roles:['technician'] },
  { to:'/tickets', label:'Service requests', icon:ClipboardList, roles:['admin'] },
  { to:'/tickets', label:'My requests', icon:ClipboardList, roles:['employee'] },
  { to:'/tickets', label:'My jobs', icon:ClipboardList, roles:['technician'] },
  { to:'/users', label:'Team', icon:Users, roles:['admin'] },
  { to:'/assets', label:'Assets', icon:Package, roles:['admin','employee','technician'] },
  { to:'/assets/qr', label:'QR identification', icon:QrCode, roles:['employee','technician'] },
  { to:'/notifications', label:'Notifications', icon:Bell, roles:['admin','employee','technician'] },
];

const ROLE_STYLE = {
  admin:      { bg:'#EAF0FC', color:'#2D56A0' },
  technician: { bg:'#EAF0FC', color:'#2D56A0' },
  employee:   { bg:'#E8F4EE', color:'#1D6848' },
};

function timeGreet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const fetch = () => api.get('/notifications').then(r => setUnread(r.data.notifications.filter(n => !n.isRead).length)).catch(() => {});
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handlePointerDown = event => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rs = ROLE_STYLE[user?.role] || {};
  const links = NAV.filter(l => l.roles.includes(user?.role));

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:49, backdropFilter:'blur(2px)' }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:11, paddingLeft:4, marginBottom:28 }}>
          <div className="brand-icon"><Wrench size={19} color="white" /></div>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:'white', letterSpacing:'-0.03em' }}>FixFlow</div>
            <div style={{ fontSize:10, color:'#B5C0CE', marginTop:1 }}>Service operations</div>
          </div>
        </div>

        {/* Nav */}
        <div className="sidebar-section">Workspace</div>
        <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to + label} to={to} end={to === '/assets' || to.endsWith('/dashboard')}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={16} />
              <span style={{ flex:1 }}>{label}</span>
              {to === '/notifications' && unread > 0 && (
                <span className="notif-pill">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ marginTop:'auto' }}>
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            style={{
              display:'flex', alignItems:'center', gap:9, width:'100%',
              padding:'9px 12px', borderRadius:9, background:'transparent',
              border:0, color:'#D1D8E1', fontSize:13, fontWeight:500,
              cursor:'pointer', transition:'background .15s, color .15s',
              marginBottom:8,
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.color='#FFFFFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#D1D8E1'; }}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>

          <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'0 4px', marginBottom:10 }}>
              <div style={{
                width:34, height:34, borderRadius:'50%', flexShrink:0,
                background:'#356AE6',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, fontSize:12, color:'white',
              }}>{initials}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'#F3F5F8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'#B5C0CE', textTransform:'capitalize' }}>{user?.department || user?.role}</div>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/portal', { replace: true }); }}
              style={{
                display:'flex', alignItems:'center', gap:8,
                width:'100%', padding:'8px 12px', borderRadius:9,
                background:'transparent', border:0, color:'#D1D8E1',
                fontSize:13, fontWeight:500, cursor:'pointer',
                transition:'background .15s, color .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(214,83,83,.16)'; e.currentTarget.style.color='#F2A5A5'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#D1D8E1'; }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="mobile-menu-btn btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding:'6px 8px' }}>
              {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{timeGreet()}, {user?.name?.split(' ')[0]}</div>
              <div className="muted" style={{ fontSize:11, marginTop:1, textTransform:'capitalize' }}>{user?.role} workspace</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <form className="topbar-search" onSubmit={event => {
              event.preventDefault();
              if (globalSearch.trim()) navigate(`/tickets?search=${encodeURIComponent(globalSearch.trim())}`);
            }}>
              <Search size={14} />
              <input aria-label="Search service requests" placeholder="Search requests" value={globalSearch} onChange={event => setGlobalSearch(event.target.value)} />
            </form>
            <NavLink to="/notifications" style={{ position:'relative', display:'flex' }}>
              <div style={{
                width:36, height:36, borderRadius:9,
                background:'var(--bg-2)', border:'1.5px solid var(--border)',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                transition:'background .15s',
              }}>
                <Bell size={16} color="var(--muted)" />
                {unread > 0 && (
                  <span style={{ position:'absolute', top:5, right:5, width:7, height:7, background:'var(--danger)', borderRadius:'50%', border:'2px solid var(--card)' }} />
                )}
              </div>
            </NavLink>
            <button onClick={toggle} style={{
              width:36, height:36, borderRadius:9, border:'1.5px solid var(--border)',
              background:'var(--bg-2)', display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', transition:'background .15s',
            }}>
              {dark ? <Sun size={15} color="var(--muted)" /> : <Moon size={15} color="var(--muted)" />}
            </button>
            <div ref={accountRef} style={{ position:'relative' }}>
              <button
                type="button"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen(open => !open)}
                style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-2)', border:'1.5px solid var(--border)', borderRadius:9, padding:'5px 10px 5px 6px', cursor:'pointer', color:'var(--text)' }}
              >
                <div style={{ width:26, height:26, borderRadius:'50%', background:'#356AE6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, color:'white' }}>{initials}</div>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:99, background:rs.bg, color:rs.color, textTransform:'capitalize' }}>{user?.role}</span>
                <ChevronDown size={14} color="var(--muted)" />
              </button>
              {accountOpen && (
                <div role="menu" aria-label="Account options" style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:60, width:220, padding:8, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 12px 32px rgba(15,23,42,.16)' }}>
                  <div style={{ padding:'8px 10px 10px', borderBottom:'1px solid var(--border)', marginBottom:6 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
                  </div>
                  <NavLink
                    to="/profile"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderRadius:8, color:'var(--text)', textDecoration:'none', fontSize:13 }}
                  >
                    <Contact size={15} /> My profile
                  </NavLink>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setAccountOpen(false); logout(); navigate('/portal', { replace: true }); }}
                    style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 10px', border:0, borderRadius:8, background:'transparent', color:'var(--danger)', cursor:'pointer', fontSize:13, textAlign:'left' }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
