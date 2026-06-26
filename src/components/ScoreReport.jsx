import { useEffect, useState } from 'react';
import CircularProgress from './ui/CircularProgress';

function scoreColor(s) {
  if (s >= 78) return 'var(--green)';
  if (s >= 55) return 'var(--amber)';
  return 'var(--rose)';
}
function scoreLabel(s) {
  if (s >= 85) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Fair';
  return 'Needs work';
}

function Ring({ label, value, color, sub, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  const c = color || scoreColor(typeof value === 'number' ? value : 50);

  return (
    <div className="metric-card" style={{ opacity: show ? 1 : 0, transition:'opacity 0.4s ease' }}>
      {show && typeof value === 'number' && value <= 100 && (
        <CircularProgress value={value} size={80} strokeWidth={6} color={c}/>
      )}
      {(typeof value !== 'number' || value > 100) && (
        <div style={{ fontSize:'1.4rem', fontWeight:800, color:c, fontFamily:"'Space Grotesk',sans-serif" }}>{value}</div>
      )}
      <div>
        <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--ink-100)', marginBottom:'0.1rem' }}>{label}</div>
        {sub && <div style={{ fontSize:'0.72rem', color:'var(--ink-400)' }}>{sub}</div>}
        {typeof value === 'number' && value <= 100 && (
          <div style={{ fontSize:'0.7rem', color:c, fontWeight:700, marginTop:'0.1rem' }}>{scoreLabel(value)}</div>
        )}
      </div>
    </div>
  );
}

export default function ScoreReport({ result, topic, niche, duration, onNewSession, onDashboard }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 150); return () => clearTimeout(t); }, []);

  if (!result) return null;
  const {
    confidence_score = 0, eye_contact_score = 0, pronunciation_score = 0,
    pace_wpm = 0, filler_count = 0, filler_words = [], stammer_instances = [],
    pauses_score = 0, top_3_improvements = [], encouragement_message = '', strengths = [],
  } = result;

  const paceOk = pace_wpm >= 120 && pace_wpm <= 165;
  const paceColor = pace_wpm < 100 || pace_wpm > 185 ? 'var(--rose)' : paceOk ? 'var(--green)' : 'var(--amber)';
  const fillerColor = filler_count <= 3 ? 'var(--green)' : filler_count <= 8 ? 'var(--amber)' : 'var(--rose)';
  const stamColor = stammer_instances.length === 0 ? 'var(--green)' : stammer_instances.length <= 3 ? 'var(--amber)' : 'var(--rose)';

  return (
    <div className="container" style={{ paddingTop:'5.5rem', paddingBottom:'5rem' }}>
      {/* Header */}
      <div style={{ marginBottom:'2.5rem' }}>
        <div className="step-pill anim-fade-up" style={{ marginBottom:'1rem' }}>
          Session complete · {niche.name}
        </div>
        <h1 className="anim-fade-up d1" style={{ fontSize:'clamp(1.6rem,3.5vw,2.2rem)', fontWeight:800, marginBottom:'0.35rem' }}>
          Your speech report
        </h1>
        <p className="anim-fade-up d2" style={{ color:'var(--ink-300)', fontSize:'0.9rem' }}>"{topic}"</p>
      </div>

      {/* ── Hero score ── */}
      <div
        className="surface-accent anim-fade-up d2"
        style={{
          padding:'2rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'2rem', flexWrap:'wrap',
          opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(12px)', transition:'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {ready && (
          <CircularProgress value={confidence_score} size={120} strokeWidth={10} color={scoreColor(confidence_score)}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.8rem', fontWeight:900, color:scoreColor(confidence_score), fontFamily:"'Space Grotesk',sans-serif", lineHeight:1 }}>
                {confidence_score}
              </div>
              <div className="label" style={{ marginTop:'0.1rem' }}>/100</div>
            </div>
          </CircularProgress>
        )}
        <div style={{ flex:1, minWidth:200 }}>
          <div className="label" style={{ marginBottom:'0.4rem' }}>Overall confidence</div>
          <div style={{ fontSize:'1.8rem', fontWeight:800, color:'var(--ink-50)', marginBottom:'0.5rem' }}>
            {scoreLabel(confidence_score)}
          </div>
          <div style={{ display:'flex', gap:'1.75rem', flexWrap:'wrap' }}>
            {[
              { l:'Duration', v:`${Math.round(duration)}s` },
              { l:'Filler words', v:filler_count },
              { l:'Pace', v:`${pace_wpm} wpm` },
              { l:'Eye contact', v:`${eye_contact_score}%` },
            ].map(({l,v}) => (
              <div key={l}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--ink-50)', fontFamily:"'Space Grotesk',sans-serif" }}>{v}</div>
                <div className="label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Metrics grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <Ring label="Eye contact"    value={eye_contact_score}       delay={0}/>
        <Ring label="Pronunciation"  value={pronunciation_score}      delay={80}/>
        <Ring label="Pauses"         value={pauses_score}             delay={160}/>
        <Ring label="Pace"           value={pace_wpm} color={paceColor} sub={paceOk ? 'Good pace' : pace_wpm < 120 ? 'Too slow' : 'Too fast'} delay={240}/>
        <Ring label="Filler words"   value={filler_count} color={fillerColor} sub={`${filler_count} instances`} delay={320}/>
        <Ring label="Stammering"     value={stammer_instances.length} color={stamColor} sub={stammer_instances.length === 0 ? 'None detected' : `${stammer_instances.length} events`} delay={400}/>
      </div>

      {/* ── Filler breakdown ── */}
      {filler_words.length > 0 && (
        <div className="surface anim-fade-up" style={{ padding:'1.25rem 1.5rem', marginBottom:'1rem' }}>
          <div className="label" style={{ marginBottom:'0.75rem' }}>Filler word breakdown</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
            {filler_words.map((fw, i) => (
              <span key={i} style={{ padding:'0.3rem 0.7rem', borderRadius:6, background:'rgba(217,119,6,0.1)', border:'1px solid rgba(217,119,6,0.25)', fontSize:'0.8rem', color:'var(--amber)', fontWeight:600 }}>
                "{fw.word}" ×{fw.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stammer instances ── */}
      {stammer_instances.length > 0 && (
        <div className="surface anim-fade-up" style={{ padding:'1.25rem 1.5rem', marginBottom:'1rem' }}>
          <div className="label" style={{ marginBottom:'0.75rem' }}>Stammer / repetitions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
            {stammer_instances.slice(0,5).map((s, i) => (
              <div key={i} style={{ padding:'0.6rem 0.9rem', borderRadius:8, background:'rgba(225,29,72,0.05)', border:'1px solid rgba(225,29,72,0.15)', fontSize:'0.82rem' }}>
                <span style={{ color:'var(--rose)', fontWeight:700 }}>"{s.text}"</span>
                {s.context && <span style={{ color:'var(--ink-400)', marginLeft:'0.5rem' }}>…{s.context}…</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2-col: improvements + strengths ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
        <div className="surface anim-fade-up" style={{ padding:'1.25rem 1.5rem' }}>
          <div className="label" style={{ marginBottom:'0.9rem', color:'var(--amber)' }}>Top improvements</div>
          {top_3_improvements.map((tip, i) => (
            <div key={i} style={{ display:'flex', gap:'0.75rem', marginBottom: i<2 ? '0.85rem' : 0 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(217,119,6,0.12)', border:'1px solid rgba(217,119,6,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'var(--amber)', flexShrink:0 }}>{i+1}</div>
              <p style={{ margin:0, fontSize:'0.83rem', color:'var(--ink-200)', lineHeight:1.6 }}>{tip}</p>
            </div>
          ))}
        </div>
        <div className="surface anim-fade-up d1" style={{ padding:'1.25rem 1.5rem' }}>
          <div className="label" style={{ marginBottom:'0.9rem', color:'var(--green)' }}>Strengths</div>
          {(strengths.length ? strengths : ['Keep going — strengths build with practice']).map((s, i) => (
            <div key={i} style={{ display:'flex', gap:'0.6rem', marginBottom: i < strengths.length-1 ? '0.6rem' : 0 }}>
              <span style={{ color:'var(--green)', fontWeight:700, fontSize:'0.75rem', marginTop:'0.05rem', flexShrink:0 }}>✓</span>
              <span style={{ fontSize:'0.83rem', color:'var(--ink-200)', lineHeight:1.6 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Encouragement ── */}
      {encouragement_message && (
        <div className="surface-accent anim-fade-up" style={{ padding:'1.25rem 1.75rem', marginBottom:'2rem' }}>
          <div className="label-accent" style={{ marginBottom:'0.5rem' }}>Coach note</div>
          <p style={{ margin:0, fontSize:'0.95rem', color:'var(--ink-200)', lineHeight:1.75, fontStyle:'italic' }}>
            "{encouragement_message}"
          </p>
        </div>
      )}

      {/* ── CTAs ── */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={onNewSession}>New session</button>
        <button className="btn btn-ghost" onClick={onDashboard}>View dashboard</button>
      </div>
    </div>
  );
}
