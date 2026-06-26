import { useState, useEffect, useRef } from 'react';

const ITEM_H = 72;

export default function TopicLottery({ niche, onTopicSelected }) {
  const [phase, setPhase] = useState('spinning'); // spinning | revealed
  const [offsets, setOffsets] = useState([0, 0, 0]);
  const speeds = useRef([14, 20, 11]);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const topicRef = useRef(niche.topics[Math.floor(Math.random() * niche.topics.length)]);
  const topic = topicRef.current;
  const pool = [...niche.topics, ...niche.topics, ...niche.topics, ...niche.topics];

  useEffect(() => {
    const SPIN_MS = 3000, SLOW_MS = 1000;
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      if (elapsed < SPIN_MS) {
        setOffsets(prev => prev.map((o, i) => (o + speeds.current[i]) % (pool.length * ITEM_H)));
        rafRef.current = requestAnimationFrame(tick);
      } else if (elapsed < SPIN_MS + SLOW_MS) {
        const t = (elapsed - SPIN_MS) / SLOW_MS;
        const ease = 1 - Math.pow(t, 0.5);
        setOffsets(prev => prev.map((o, i) => (o + speeds.current[i] * ease) % (pool.length * ITEM_H)));
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase('revealed');
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="container-sm page-top">
      <div className="step-pill anim-fade-up" style={{ marginBottom: '1.75rem' }}>
        Step 2 of 6 · {niche.name}
      </div>
      <h1 className="anim-fade-up d1" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
        Drawing your topic
      </h1>
      <p className="anim-fade-up d2" style={{ color: 'var(--ink-300)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {phase === 'spinning' ? 'Selecting at random…' : 'Your topic is locked in.'}
      </p>

      {/* ── Drum machine ── */}
      <div
        className="surface anim-fade-up d2"
        style={{ marginBottom: '2rem', padding: '0.5rem', overflow: 'hidden', position: 'relative' }}
      >
        {/* scan line */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: ITEM_H,
          transform: 'translateY(-50%)',
          background: 'rgba(124,58,237,0.06)',
          borderTop: '1px solid rgba(124,58,237,0.15)',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          pointerEvents: 'none', zIndex: 2,
        }} />
        {/* fades */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom, var(--ink-800), transparent)', zIndex: 3, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, var(--ink-800), transparent)', zIndex: 3, pointerEvents: 'none' }}/>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[0,1,2].map(col => (
            <div key={col} className="drum-window" style={{ flex: 1, height: ITEM_H * 3 }}>
              <div style={{ transform: `translateY(-${offsets[col] % (pool.length * ITEM_H)}px)`, willChange: 'transform' }}>
                {pool.map((t, i) => (
                  <div key={i} style={{
                    height: ITEM_H,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 0.75rem',
                    fontSize: '0.72rem', color: 'var(--ink-300)',
                    textAlign: 'center', lineHeight: 1.4,
                  }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reveal ── */}
      {phase === 'revealed' && (
        <div className="anim-scale-in" style={{ marginBottom: '2rem' }}>
          <div className="surface-accent" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
            <div className="label-accent" style={{ marginBottom: '0.6rem' }}>Your topic</div>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink-50)', lineHeight: 1.45 }}>
              {topic}
            </p>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-400)', marginBottom: '1.25rem' }}>
            You'll have 60 seconds to prepare before recording starts.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => onTopicSelected(topic)}>
            Begin prep timer
          </button>
        </div>
      )}

      {phase === 'spinning' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--ink-400)', fontSize: '0.82rem' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--violet)', animation:'recordPulse 1s infinite' }}/>
          Randomising…
        </div>
      )}
    </div>
  );
}
