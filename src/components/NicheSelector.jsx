import { useState } from 'react';
import { NICHES } from '../constants/niches';

export default function NicheSelector({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const pick = (niche) => {
    setSelected(niche.id);
    setTimeout(() => onSelect(niche), 300);
  };

  return (
    <div className="container-sm page-top">
      <div className="step-pill anim-fade-up" style={{ marginBottom: '1.75rem' }}>
        Step 1 of 6
      </div>

      <h1 className="anim-fade-up d1" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.6rem' }}>
        Pick a speaking niche
      </h1>
      <p className="anim-fade-up d2" style={{ color: 'var(--ink-300)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
        We'll randomly assign you a topic from this category.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {NICHES.map((niche, i) => (
          <button
            key={niche.id}
            className={`niche-card anim-fade-up d${i + 1}`}
            style={{ textAlign: 'left', width: '100%', cursor: 'pointer', background: selected === niche.id ? 'rgba(124,58,237,0.08)' : undefined, borderColor: selected === niche.id ? 'var(--violet)' : undefined }}
            onClick={() => pick(niche)}
            aria-pressed={selected === niche.id}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Color swatch */}
              <div
                style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: niche.color + '20',
                  border: `1px solid ${niche.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                {niche.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-50)', marginBottom: '0.15rem' }}>
                  {niche.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-300)' }}>
                  {niche.description}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-400)', flexShrink: 0 }}>
                {niche.topics.length} topics
              </div>
              {selected === niche.id && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--violet-xl)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="2,8 6,12 14,4"/>
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
