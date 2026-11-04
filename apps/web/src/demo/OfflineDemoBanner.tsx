import { useEffect, useState } from 'react';
import { DEMO_STACK_SHA } from './mode';
import { currentDemoProfile, resetDemoProfile, type DemoProfile } from './profiles';
import './offlineDemo.css';

export function OfflineDemoBanner() {
  const [notice, setNotice] = useState('');
  const profile = currentDemoProfile();
  useEffect(() => {
    const blockedLink = () => setNotice('External links are unavailable offline. Contract addresses are in Help.');
    window.addEventListener('offline-demo-link', blockedLink);
    return () => window.removeEventListener('offline-demo-link', blockedLink);
  }, []);
  const load = (next: DemoProfile) => {
    resetDemoProfile(next);
    window.location.hash = next === 'fresh' ? 'landing' : next === 'boss' ? 'map' : 'home';
    window.location.reload();
  };
  return <>
    <aside className="offline-demo-bar" aria-label="Offline candidate demo">
      <strong>Candidate build (stack tip {DEMO_STACK_SHA.slice(0, 7)}), not live.</strong>
      <span>{profile === 'fresh' ? 'Guest progress' : 'Sample progress'} · local only · no wallet</span>
      <label>Scenario <select aria-label="Demo scenario" value={profile} onChange={event => load(event.target.value as DemoProfile)}>
        <option value="tour">Tour sample</option><option value="boss">Boss sample</option><option value="fresh">Fresh guest</option>
      </select></label>
      <button type="button" onClick={() => load(profile)}>Restart scenario</button>
    </aside>
    {notice && <div className="offline-demo-notice" role="status">{notice} <button type="button" onClick={() => setNotice('')}>Dismiss</button></div>}
  </>;
}
