import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value, duration = 1200, suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = null;
    const startVal = 0;
    const endVal = value;

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + eased * (endVal - startVal)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}
