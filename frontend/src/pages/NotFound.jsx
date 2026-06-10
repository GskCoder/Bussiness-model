import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
      <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--color-primary)', opacity: 0.3 }}>404</div>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>The page you're looking for doesn't exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}><Home size={16} /> Go to Dashboard</button>
    </div>
  );
}
