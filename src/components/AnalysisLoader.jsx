import { useEffect, useState } from 'react';

const STEPS = [
  'Reading your transcript',
  'Detecting filler words',
  'Measuring speaking pace',
  'Scoring eye contact',
  'Identifying improvement areas',
  'Compiling your report',
];

export default function AnalysisLoader() {
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const s = setInterval(() => setStep(i => Math.min(i + 1, STEPS.length - 1)), 2000);
    const d = setInterval(() => setDots(n => n >= 3 ? 1 : n + 1), 500);
    return () => { clearInterval(s); clearInterval(d); };
  }, []);

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="container-sm page-top" style={{ textAlign:'center' }}>
      {/* Spinner ring */}
      <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'2rem' }}>
        <svg width={64} height={64}>
          <circle cx={32} cy={32} r={26} fill="none" stroke="var(--ink-600)" strokeWidth={4}/>
          <circle cx={32} cy={32} r={26} fill="none" stroke="var(--violet)" strokeWidth={4} strokeLinecap="round"
            strokeDasharray={`${2*Math.PI*26 * 0.25} ${2*Math.PI*26 * 0.75}`}
            style={{ transformOrigin:'center', animation:'spinSlow 1.2s linear infinite' }}
          />
        </svg>
      </div>

      <h1 style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:'0.5rem' }}>Analysing your speech</h1>
      <p style={{ color:'var(--ink-300)', marginBottom:'2.5rem', fontSize:'0.9rem' }}>Powered by Groq AI</p>

      {/* Current step */}
      <div className="surface anim-scale-in" key={step} style={{ padding:'1rem 1.5rem', marginBottom:'1.5rem', textAlign:'left', display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--violet)', flexShrink:0 }}/>
        <span style={{ fontSize:'0.9rem', color:'var(--ink-100)', fontWeight:500 }}>
          {STEPS[step]}{'.'.repeat(dots)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width:`${pct}%` }}/>
      </div>

      <p style={{ marginTop:'1rem', fontSize:'0.75rem', color:'var(--ink-400)' }}>Usually takes 5–10 seconds</p>
    </div>
  );
}
