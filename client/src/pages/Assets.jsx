import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, X, Package, Search, Loader, AlertCircle, QrCode, ScanLine, ArrowRight } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AssetQrScanner from '../components/AssetQrScanner';

const CATEGORIES = ['Equipment','Furniture','IT Hardware','Vehicle','HVAC','Electrical','Plumbing','Other'];
const CONDITIONS  = ['good','needs-maintenance','damaged'];

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

const conditionStyle = {
  good:               { bg:'#E8F4EE', color:'#1D6848', label:'Good' },
  'needs-maintenance':{ bg:'#FBF3E4', color:'#815A18', label:'Needs Maintenance' },
  damaged:            { bg:'#FBECEC', color:'#A43D3D', label:'Damaged' },
};

export default function Assets({ qrOnly = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [assetCodeInput, setAssetCodeInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ assetName:'', assetCode:'', category:'Equipment', location:'', condition:'good', maintenanceIntervalDays:90, purchaseDate:'', description:'' });

  const handleScan = decoded => {
    try {
      const url = new URL(decoded, window.location.origin);
      if (url.origin !== window.location.origin && /^https?:\/\//i.test(decoded)) throw new Error('This QR code is not a FixFlow asset link');
      const codeFromUrl = url.pathname.match(/^\/assets\/([^/]+)\/?$/)?.[1];
      const code = codeFromUrl ? decodeURIComponent(codeFromUrl) : decoded.trim();
      if (!/^[a-zA-Z0-9._-]{1,60}$/.test(code)) throw new Error('The scanned code is not a valid asset code');
      setShowScanner(false);
      setScanError('');
      navigate(`/assets/${encodeURIComponent(code)}`);
    } catch (error) {
      setScanError(error.message || 'Unable to read this asset QR code');
    }
  };

  const load = () => {
    setLoading(true);
    api.get('/assets')
      .then(r => setAssets(r.data.assets))
      .catch(() => setError('Assets are available to administrators only.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/assets', {
        ...form,
        assetCode: form.assetCode.trim().toUpperCase(),
        maintenanceIntervalDays: Number(form.maintenanceIntervalDays),
        purchaseDate: form.purchaseDate || undefined,
      });
      setShowModal(false);
      setForm({ assetName:'', assetCode:'', category:'Equipment', location:'', condition:'good', maintenanceIntervalDays:90, purchaseDate:'', description:'' });
      load();
    } catch (e) { setError(e.response?.data?.message || 'Could not save asset'); }
    finally { setBusy(false); }
  };

  const filtered = assets.filter(a =>
    !search ||
    a.assetName.toLowerCase().includes(search.toLowerCase()) ||
    a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
    a.location.toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts
  const summary = {
    total: assets.length,
    good: assets.filter(a => a.condition === 'good').length,
    maintenance: assets.filter(a => a.condition === 'needs-maintenance').length,
    damaged: assets.filter(a => a.condition === 'damaged').length,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* Header */}
      <div className="section-header fade-up">
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em', marginBottom:4 }}>{qrOnly ? 'QR asset identification' : 'Assets'}</h1>
          <p className="muted" style={{ fontSize:14 }}>{qrOnly ? 'Scan an equipment label or open its service history.' : 'Track equipment, facilities and physical resources.'}</p>
        </div>
        <div className="dashboard-header-actions">
          <Link className="btn btn-secondary" to="/maintenance">Maintenance schedule<ArrowRight size={14} /></Link>
          <button className="btn btn-secondary" onClick={() => { setScanError(''); setShowScanner(true); }}><ScanLine size={15}/>Scan QR</button>
          {user.role === 'admin' && !qrOnly && <button className="btn" onClick={() => setShowModal(true)}><Plus size={17}/> Add Asset</button>}
        </div>
      </div>

      {scanError && <div className="dashboard-error" role="alert">{scanError}</div>}
      {qrOnly && (
        <section className="card asset-code-search">
          <div><h2>Look up an asset</h2><p>Enter the code printed on the asset label, or scan its QR code.</p></div>
          <form onSubmit={event => { event.preventDefault(); handleScan(assetCodeInput); }} className="asset-code-form">
            <input className="field" placeholder="Asset code" value={assetCodeInput} onChange={event => setAssetCodeInput(event.target.value)} />
            <button className="btn" disabled={!assetCodeInput.trim()}>Open asset</button>
          </form>
        </section>
      )}

      {showScanner && (
        <Modal title="Scan an asset QR code" onClose={() => setShowScanner(false)}>
          <p className="asset-scanner-help">Allow camera access to scan a FixFlow asset label. You can also enter its asset code above.</p>
          <AssetQrScanner onScan={handleScan} />
          {scanError && <div className="dashboard-error" role="alert">{scanError}</div>}
        </Modal>
      )}

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', color:'#dc2626', fontSize:14, display:'flex', gap:8, alignItems:'center' }}>
          <AlertCircle size={15}/>{error}
        </div>
      )}

      {/* Summary cards */}
      {assets.length > 0 && (
        <div className="stat-grid fade-up" style={{ animationDelay:'.05s' }}>
          {[
            { label:'Total Assets',     value:summary.total,       bg:'#EAF0FC', fg:'#356AE6' },
            { label:'Good Condition',   value:summary.good,        bg:'#E8F4EE', fg:'#21845A' },
            { label:'Need Maintenance', value:summary.maintenance,  bg:'#FBF3E4', fg:'#9C6B1D' },
            { label:'Damaged',          value:summary.damaged,      bg:'#FBECEC', fg:'#D65353' },
          ].map(({ label, value, bg, fg }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize:30, fontWeight:800, color:fg, marginBottom:4 }}>{value}</div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title="Add Asset" onClose={() => setShowModal(false)}>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Asset Name *</label>
                <input className="field" placeholder="e.g. HP LaserJet Pro" required value={form.assetName}
                  onChange={e => setForm({...form, assetName:e.target.value})}/>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Asset Code *</label>
                <input className="field" placeholder="e.g. ASSET-0042" required value={form.assetCode}
                  onChange={e => setForm({...form, assetCode:e.target.value})}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Category *</label>
                <select className="field" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Condition *</label>
                <select className="field" value={form.condition} onChange={e => setForm({...form, condition:e.target.value})}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{conditionStyle[c].label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Location *</label>
              <input className="field" placeholder="e.g. Server Room, Floor 2" required value={form.location}
                onChange={e => setForm({...form, location:e.target.value})}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Maintenance interval (days)</label>
              <input className="field" type="number" min="1" max="3650" required value={form.maintenanceIntervalDays}
                onChange={e => setForm({...form, maintenanceIntervalDays:e.target.value})}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Purchase date</label>
              <input className="field" type="date" value={form.purchaseDate}
                onChange={e => setForm({...form, purchaseDate:e.target.value})}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Description</label>
              <input className="field" value={form.description} maxLength={1000}
                onChange={e => setForm({...form, description:e.target.value})}/>
            </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn" style={{ flex:2 }} disabled={busy}>
                {busy ? <><Loader size={15} className="spinner"/> Saving…</> : 'Save Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Search + table */}
      <div className="card fade-up" style={{ padding:'16px 20px' }}>
        <div className="search-wrap">
          <Search size={15}/>
          <input className="field" placeholder="Search by name, code or location…" value={search}
            onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="card fade-up" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'#94a3b8' }}>
            <Loader size={20} className="spinner"/> Loading assets…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 20px', gap:14, color:'#94a3b8' }}>
            <Package size={40} strokeWidth={1.2}/>
            <div style={{ fontSize:15, fontWeight:600 }}>{assets.length === 0 ? 'No assets registered yet' : 'No assets match your search'}</div>
            {user.role === 'admin' && assets.length === 0 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}><Plus size={14}/> Add first asset</button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Condition</th>
                  <th>Added</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const cs = conditionStyle[a.condition] || conditionStyle.good;
                  return (
                    <tr key={a._id}>
                      <td style={{ fontWeight:600 }}>{a.assetName}</td>
                      <td><code style={{ fontSize:12, background:'rgba(124,58,237,0.1)', border:'1.5px solid rgba(124,58,237,0.3)', borderRadius:6, padding:'2px 8px', fontFamily:'monospace', color:'#7c3aed', fontWeight:700 }}>{a.assetCode}</code></td>
                      <td style={{ color:'#64748b' }}>{a.category}</td>
                      <td style={{ color:'#64748b' }}>{a.location}</td>
                      <td>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:cs.bg, color:cs.color, borderRadius:99, fontSize:11, fontWeight:700, padding:'3px 10px' }}>
                          {cs.label}
                        </span>
                      </td>
                      <td style={{ color:'#94a3b8', fontSize:12 }}>
                        {new Date(a.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </td>
                      <td><button className="btn btn-ghost btn-xs" onClick={() => setQrAsset(a)}><QrCode size={13}/>QR label</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qrAsset && (
        <Modal title="Asset QR label" onClose={() => setQrAsset(null)}>
          <div className="asset-qr-card">
            <QRCode value={`${window.location.origin}/assets/${encodeURIComponent(qrAsset.assetCode)}`} size={192} />
            <div><strong>{qrAsset.assetName}</strong><span>{qrAsset.assetCode}</span><span>{qrAsset.location}</span></div>
            <Link className="dashboard-text-link" to={`/assets/${encodeURIComponent(qrAsset.assetCode)}`} onClick={() => setQrAsset(null)}>Open asset record<ArrowRight size={14} /></Link>
          </div>
        </Modal>
      )}
    </div>
  );
}
