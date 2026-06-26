import { useState, useEffect, useCallback } from 'react';

export default function PrepTimer({ topic, niche, onComplete }) {
  const TOTAL = 60;
  const [secs, setSecs] = useState(TOTAL);
  const [started, setStarted] = useState(false);
  const urgent = secs <= 10;

  const circ = 2 * Math.PI * 52;
  const offset = circ - (secs / TOTAL) * circ;
  const ringColor = urgent ? 'var(--rose)' : secs <= 30 ? 'var(--amber)' : 'var(--violet)';

  useEffect(() => { const t = setTimeout(() => setStarted(true), 800); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!started) return;
    if (secs <= 0) { onComplete(); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, started, onComplete]);

  return (
    <div className="container-sm page-top" style={{ textAlign: 'center' }}>
      <div className="step-pill anim-fade-up" style={{ marginBottom: '1.75rem' }}>
        Step 3 of 6 · Prep time
      </div>

      {/* Topic reminder */}
      <div className="surface anim-fade-up d1" style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem', textAlign: 'left' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Your topic</div>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink-50)', lineHeight: 1.5 }}>{topic}</p>
      </div>

      {/* Timer ring */}
      <div className="anim-scale-in" style={{ display: 'inline-flex', alignItems:'center', justifyContent:'center', marginBottom: '2rem', position:'relative' }}>
        <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={60} cy={60} r={52} strokeWidth={8} className="ring-track" />
          <circle
            cx={60} cy={60} r={52} strokeWidth={8} className="ring-fill"
            stroke={ringColor}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: secs < TOTAL ? 'stroke-dashoffset 1s linear, stroke 0.5s' : 'none' }}
          />
        </svg>
        <div style={{ position:'absolute', textAlign:'center' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize: '2rem', fontWeight: 800, color: ringColor, lineHeight: 1, transition: 'color 0.5s' }}>
            {secs}
          </div>
          <div className="label" style={{ marginTop: '0.15rem' }}>sec</div>
        </div>
      </div>

      <h2 className="anim-fade-up d2" style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {urgent ? 'Get ready to speak' : secs <= 30 ? 'Gather your thoughts' : 'Prep time'}
      </h2>
      <p className="anim-fade-up d3" style={{ color: 'var(--ink-300)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
        {urgent ? 'Recording starts automatically when this hits zero.' : 'Outline 2–3 key points. Take a breath.'}
      </p>

      {/* Tips — only shown early */}
      {secs > 25 && (
        <div className="surface anim-fade-up d4" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div className="label" style={{ marginBottom: '0.75rem' }}>Quick reminders</div>
          {['Open with a hook or a question', 'Look at the camera, not the screen', 'Pause instead of saying "um"', 'Close with one clear takeaway'].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: i < 3 ? '0.5rem' : 0 }}>
              <span style={{ color: 'var(--violet-xl)', fontWeight: 700, fontSize: '0.75rem', marginTop: '0.05rem' }}>→</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-200)' }}>{t}</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-ghost" onClick={onComplete} style={{ fontSize: '0.85rem' }}>
        Skip, start recording now
      </button>
    </div>
  );
}
