import { useEffect, useRef, useState } from 'react';

export default function CircularProgress({ value = 0, size = 100, strokeWidth = 8, color = 'var(--violet)', children }) {
  const [display, setDisplay] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (display / 100) * circ;

  useEffect(() => {
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} className="ring-track" strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={r} className="ring-fill" strokeWidth={strokeWidth} stroke={color}
          strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
        {children || <span style={{ fontSize: size * 0.2, fontWeight:800, color:'var(--ink-50)', fontFamily:"'Space Grotesk',sans-serif" }}>{display}</span>}
      </div>
    </div>
  );
}
