import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    path: '/portal/employee',
    label: 'Employee',
    detail: 'Report a workplace issue or follow a request.',
    icon: BriefcaseBusiness,
  },
  {
    path: '/portal/technician',
    label: 'Technician',
    detail: 'View assigned work and update repairs.',
    icon: Wrench,
  },
  {
    path: '/portal/admin',
    label: 'Administrator',
    detail: 'Manage requests, people and workplace assets.',
    icon: ShieldCheck,
  },
];

export default function Portal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    navigate(user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'technician' ? '/technician/dashboard' : '/employee/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <main className="portal-page">
      <div className="portal-shell">
        <header className="portal-header">
          <Link className="portal-brand" to="/portal" aria-label="FixFlow home">
            <span className="portal-brand-mark"><Wrench size={19} /></span>
            <span>FixFlow</span>
          </Link>
          <Link className="portal-signin" to="/login">Sign in</Link>
        </header>

        <section className="portal-content" aria-labelledby="portal-title">
          <p className="portal-kicker">Workplace support</p>
          <h1 id="portal-title">How can we help?</h1>
          <p className="portal-intro">Choose your workspace to continue.</p>

          <nav className="portal-roles" aria-label="Choose a workspace">
            {ROLES.map(({ path, label, detail, icon: Icon }) => (
              <Link className="portal-role" key={path} to={path}>
                <span className="portal-role-icon"><Icon size={20} /></span>
                <span className="portal-role-copy">
                  <span className="portal-role-title">{label}</span>
                  <span className="portal-role-detail">{detail}</span>
                </span>
                <ArrowRight className="portal-role-arrow" size={18} />
              </Link>
            ))}
          </nav>

          <p className="portal-register">New employee? <Link to="/register">Create an account</Link></p>
        </section>
        <footer className="portal-footer">FixFlow · Workplace maintenance</footer>
      </div>
    </main>
  );
}
