import Auth from './Auth';

export default function AdminLogin() {
  return <Auth requiredRole="admin" />;
}
