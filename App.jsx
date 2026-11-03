import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Portal from './pages/Portal';
import AdminLogin from './pages/AdminLogin';
import TechnicianLogin from './pages/TechnicianLogin';
import EmployeeLogin from './pages/EmployeeLogin';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Assets from './pages/Assets';
import Team from './pages/Team';
import Notifications from './pages/Notifications';
import PasswordReset from './pages/PasswordReset';
import AssetDetails from './pages/AssetDetails';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import SlaMonitoring from './pages/SlaMonitoring';
import Analytics from './pages/Analytics';
import ServiceSettings from './pages/ServiceSettings';
import SmartMatching from './pages/SmartMatching';
import Profile from './pages/Profile';

function roleDashboard(user) {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (user?.role === 'technician') return '/technician/dashboard';
  return '/employee/dashboard';
}

function LegacyDashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={roleDashboard(user)} replace />;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', color:'var(--text)' }}>
        Fix<span style={{ color:'var(--accent)' }}>Flow</span>
      </div>
      <div style={{ width:160, height:3, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:'40%', borderRadius:99, background:'var(--accent)', animation:'loadBar 1.3s ease-in-out infinite' }}/>
      </div>
      <style>{`@keyframes loadBar{0%{margin-left:-40%}100%{margin-left:140%}}`}</style>
    </div>
  );
  return <Navigate to={user ? roleDashboard(user) : '/portal'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/portal" element={<Portal />} />
      <Route path="/portal/admin" element={<AdminLogin />} />
      <Route path="/portal/technician" element={<TechnicianLogin />} />
      <Route path="/portal/employee" element={<EmployeeLogin />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/forgot-password" element={<PasswordReset />} />
      <Route path="/reset-password" element={<PasswordReset reset />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<LegacyDashboardRedirect />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/qr" element={<Assets qrOnly />} />
          <Route path="/assets/:assetCode" element={<AssetDetails />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/maintenance" element={<PredictiveMaintenance />} />
            <Route path="/sla" element={<SlaMonitoring />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<ServiceSettings />} />
            <Route path="/matching" element={<SmartMatching />} />
            <Route path="/team" element={<Team />} />
            <Route path="/users" element={<Team />} />
            <Route path="/technicians" element={<Team techniciansOnly />} />
          </Route>
          <Route element={<ProtectedRoute roles={['employee']} />}>
            <Route path="/employee/dashboard" element={<Dashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={['technician']} />}>
            <Route path="/technician/dashboard" element={<Dashboard />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
