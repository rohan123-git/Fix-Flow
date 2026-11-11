import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench } from 'lucide-react';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: 16
    }}>
      <div style={{
        background: 'var(--accent)',
        borderRadius: 10, padding: 12
      }}>
        <Wrench size={28} color="white"/>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading FixFlow…</div>
      <div style={{ width: 160, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'var(--accent)',
          animation: 'loadBar 1.2s ease-in-out infinite',
        }}/>
      </div>
      <style>{`
        @keyframes loadBar {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace/>;
  return <Outlet/>;
}
