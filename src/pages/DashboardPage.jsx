import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', paddingTop: '5rem', position: 'relative' }}>
      {/* Background orbs */}
      <div
        style={{
          position: 'fixed',
          top: '10%',
          right: '-15%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)',
          pointerEvents: 'none',
          animation: 'orb 14s ease-in-out infinite',
        }}
      />
      <div style={{ position: 'relative' }}>
        <Dashboard onStart={() => navigate('/coach')} />
      </div>
    </div>
  );
}
