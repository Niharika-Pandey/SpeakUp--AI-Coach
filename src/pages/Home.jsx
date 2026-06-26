import { useNavigate } from 'react-router-dom';
import { getSessions } from '../hooks/useSessionStore';

const features = [
  {
    title: 'Random Topic Challenge',
    desc: 'A slot machine draws from 50 curated professional speaking topics across 5 niches.',
  },
  {
    title: 'Real-time Eye Contact',
    desc: 'MediaPipe face detection tracks whether you\'re looking at the camera throughout your talk.',
  },
  {
    title: 'AI Speech Analysis',
    desc: 'Groq AI counts filler words, detects stammers, measures pace, and gives you a confidence score.',
  },
  {
    title: 'Progress Over Time',
    desc: 'Charts show exactly how your filler count, pace, and confidence are trending across sessions.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const sessions = getSessions();
  const last = sessions[0];

  return (
    <div style={{ minHeight: '100dvh' }}>
      {/* Subtle background gradient */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.12), transparent)',
        }}
      />

      <div className="container page-top" style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Hero ── */}
        <div style={{ maxWidth: 620, marginBottom: '5rem' }}>
          <div className="step-pill anim-fade-up" style={{ marginBottom: '1.75rem' }}>
            AI-Powered Speaking Coach
          </div>

          <h1
            className="anim-fade-up d1"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 4rem)', fontWeight: 800, marginBottom: '1.25rem' }}
          >
            Stop saying <span className="text-grad">um</span>.{' '}
            Start speaking with conviction.
          </h1>

          <p
            className="anim-fade-up d2"
            style={{ fontSize: '1.05rem', color: 'var(--ink-300)', maxWidth: 480, lineHeight: 1.75, marginBottom: '2rem' }}
          >
            Record yourself on any topic. Get scored on filler words, pace, eye contact,
            and stammering. Track your improvement over time.
          </p>

          <div className="anim-fade-up d3" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/coach')}
              id="hero-start-btn"
            >
              Start a session
            </button>
            {sessions.length > 0 && (
              <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                View progress  ({sessions.length})
              </button>
            )}
          </div>
        </div>

        {/* ── Last session snapshot ── */}
        {last && (
          <div
            className="surface anim-fade-up d4"
            style={{ padding: '1.25rem 1.5rem', marginBottom: '4rem', display: 'inline-flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}
          >
            <span className="label">Last session</span>
            {[
              { l: 'Confidence', v: `${last.confidence_score}`, u: '/100' },
              { l: 'Eye contact', v: `${last.eye_contact_score}`, u: '%' },
              { l: 'Fillers', v: `${last.filler_count}`, u: ' words' },
              { l: 'Pace', v: `${last.pace_wpm}`, u: ' wpm' },
            ].map(({ l, v, u }) => (
              <div key={l}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink-50)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {v}<span style={{ fontSize: '0.8rem', color: 'var(--ink-300)', fontWeight: 500 }}>{u}</span>
                </div>
                <div className="label" style={{ marginTop: '0.1rem' }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Feature list ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--ink-600)', border: '1px solid var(--ink-600)', borderRadius: 16, overflow: 'hidden' }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`anim-fade-up d${i + 2}`}
              style={{ background: 'var(--ink-800)', padding: '1.75rem 1.5rem' }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--violet-xl)" strokeWidth="1.5" strokeLinecap="round">
                  {i === 0 && <><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2 2"/></>}
                  {i === 1 && <><circle cx="8" cy="6" r="2.5"/><path d="M1 13c0-3.3 3.1-6 7-6s7 2.7 7 6"/></>}
                  {i === 2 && <><path d="M2 4h12M2 8h8M2 12h5"/></>}
                  {i === 3 && <><polyline points="1,12 5,7 9,10 13,4"/></>}
                </svg>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--ink-50)' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--ink-300)', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.78rem', color: 'var(--ink-400)', textAlign: 'center' }}>
          Recordings stay in your browser. Only the text transcript is sent to Groq for analysis.
        </p>
      </div>
    </div>
  );
}
