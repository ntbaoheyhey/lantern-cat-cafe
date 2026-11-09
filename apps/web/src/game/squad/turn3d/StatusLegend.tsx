import { useEffect, useState } from 'react';
import { statusIdentity } from './card-status-data';
// Session-only presentation preferences. No save/rule/storage writes.
const seen = new Set<string>();
let dismissed = false;
const hints: Record<string, string> = {
  scald: 'loses HP each round', snag: 'loses HP before acting', bitter: 'receives half healing and shielding',
  scent: 'takes more direct damage', brittle: 'loses defence and shield', tangle: 'loses defence and shield',
  drowsy: 'next action is weakened', hush: 'next action is weakened', rattled: 'next action is weakened',
  steep: 'heals each round', cozy: 'takes less direct damage',
};
export function StatusLegend({ ids, enabled }: { ids: string; enabled: boolean }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [closed, setClosed] = useState(dismissed);
  useEffect(() => {
    if (!enabled || closed || current) return;
    const next = ids.split(',').find(id => hints[id] && !seen.has(statusIdentity(id)!.name));
    if (next) { seen.add(statusIdentity(next)!.name); setCurrent(next); }
  }, [ids, enabled, closed, current]);
  useEffect(() => {
    if (!current) return;
    const timeout = window.setTimeout(() => setCurrent(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [current]);
  if (!enabled || closed || !current) return null;
  return <aside className="dp-status-legend" role="status" aria-label="Status hint">
    <span><strong>{statusIdentity(current)!.name}:</strong> {hints[current]}</span>
    <button type="button" aria-label="Hide status hints for this session" onClick={() => { dismissed = true; setClosed(true); }}>×</button>
  </aside>;
}
