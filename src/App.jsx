import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CoachFlow from './pages/CoachFlow';
import DashboardPage from './pages/DashboardPage';

function NavBar() {
  const loc = useLocation();
  const links = [
    { to:'/', label:'Home' },
    { to:'/coach', label:'Practice' },
    { to:'/dashboard', label:'Dashboard' },
  ];

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:500,
      padding:'0 1.5rem',
      height:52,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      background:'rgba(12,12,20,0.85)',
      backdropFilter:'blur(16px)',
      borderBottom:'1px solid var(--ink-700)',
    }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:'0.55rem', textDecoration:'none' }}>
        <div style={{
          width:30, height:30, borderRadius:8,
          background:'var(--violet)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'0.9rem',
          boxShadow:'0 2px 8px rgba(124,58,237,0.4)',
        }}>
          🎤
        </div>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:'var(--ink-50)', letterSpacing:'-0.01em' }}>
          SpeakUp
        </span>
      </Link>

      <div style={{ display:'flex', gap:'0.15rem', alignItems:'center' }}>
        {links.map(({to, label}) => {
          const active = loc.pathname === to;
          return (
            <Link key={to} to={to} style={{
              padding:'0.4rem 0.8rem', borderRadius:7,
              fontSize:'0.83rem', fontWeight: active ? 600 : 500,
              textDecoration:'none',
              color: active ? 'var(--ink-50)' : 'var(--ink-400)',
              background: active ? 'var(--ink-700)' : 'transparent',
              transition:'color 0.15s, background 0.15s',
            }}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/coach" element={<CoachFlow/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}
