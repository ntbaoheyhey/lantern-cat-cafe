import { useEffect, useRef, useState } from 'react';

/** Acknowledged gains only. One short-lived cue; no initial-mount or spending cue. */
export function ResourceGain({ value }: { value: number }) {
  const previous = useRef(value);
  const [gain, setGain] = useState(0);
  useEffect(() => {
    const delta = value - previous.current;
    previous.current = value;
    setGain(delta > 0 && !document.hidden ? delta : 0);
    if (delta <= 0 || document.hidden) return;
    const timer = setTimeout(() => setGain(0), 900);
    const hide = () => { if (document.hidden) { clearTimeout(timer); setGain(0); } };
    document.addEventListener('visibilitychange', hide);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', hide); };
  }, [value]);
  return gain > 0 ? <span key={value} className="visual-gain" aria-hidden="true">+{gain.toLocaleString('en-US')}</span> : null;
}
