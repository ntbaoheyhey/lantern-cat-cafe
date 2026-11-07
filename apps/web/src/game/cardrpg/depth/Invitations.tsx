import { useEffect, useRef, useState } from 'react';
import { BANNERS, CARD_BY_ID, ITEM_BY_ID, CARD_RPG_CONFIG, emptyPity, getBannerOdds, getDrawPool,
  type GachaResult } from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { firstInvitation } from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import { PageTitle, ItemIcon, rarityStyle } from '../shared';
import { CompanionCard } from './CompanionCard';
import { CompanionPreview } from './CompanionPreview';
import type { DepthModel } from './model';
import './invitations.css';

type RevealPhase = 'sealed' | 'hint' | 'reveal' | 'summary';
const resultName = (result: GachaResult) => result.cardId
  ? CARD_BY_ID[result.cardId]!.name : R.GEAR_BY_ID[result.itemId!]!.name;

export function Invitations({ m }: { m: DepthModel }) {
  const fairness = useRef<HTMLElement>(null);
  const stage = useRef<HTMLElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [bannerId, setBannerId] = useState('standard');
  const [results, setResults] = useState<GachaResult[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<RevealPhase>('summary');
  const banner = BANNERS.find(candidate => candidate.id === bannerId)!;
  const pity = m.state.account.pity[banner.pityGroup] ?? emptyPity();
  const odds = getBannerOdds(banner, pity);
  const active = results[index];
  const revealing = results.length > 0 && phase !== 'summary';
  const reducedMotion = m.state.settings.reducedMotion || systemReducedMotion;
  const inRun = !!m.state.run && !m.state.run.complete;
  const stamps = m.state.account.currencies.stamps;
  const cost = banner.cost.stamps!;
  const available = CARD_RPG_CONFIG.maxDrawsPerDay - m.state.account.daily.draws;
  const featuredId = banner.kind === 'cat' ? banner.featuredCardId ?? 'clover' : undefined;
  const history = [...m.state.account.history].reverse();
  const rareCard = revealing && active?.cardId && (active.rarity === 'epic' || active.rarity === 'legendary')
    ? active.cardId : undefined;
  const entranceKey = rareCard && active && phase === 'reveal' ? `${active.bannerId}-${active.index}` : undefined;
  const previewId = rareCard ?? featuredId;
  const previewVisible = !revealing || !!entranceKey;

  // Cache sticky-header clearance on resize, never read layout in the pull handler.
  useEffect(() => {
    const header = fairness.current;
    const content = header?.closest<HTMLElement>('.cr-content');
    if (!header || !content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const height = entries[0]?.borderBoxSize?.[0]?.blockSize;
      if (height === undefined) return;
      const padding = Number.parseFloat(getComputedStyle(content).paddingTop) || 0;
      content.style.setProperty('--invitation-clearance', `${height + padding + 12}px`);
    });
    observer.observe(header);
    return () => { observer.disconnect(); content.style.removeProperty('--invitation-clearance'); };
  }, []);
  useEffect(() => {
    const destination = revealing ? stage.current : summary.current;
    if (!results.length || !destination) return;
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => destination.scrollIntoView?.({ block: 'start', behavior: 'instant' }), 0);
    });
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [revealing, results.length]);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!preference) return;
    const update = () => setSystemReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  function nextResult() {
    if (index + 1 === results.length) setPhase('summary');
    else { setIndex(index + 1); setPhase('sealed'); }
  }

  useEffect(() => {
    if (!revealing) return;
    if (reducedMotion) { setPhase('summary'); return; }
    const delay = phase === 'sealed' ? 550 : phase === 'hint' ? 500
      : active?.rarity === 'legendary' ? 3200 : active?.rarity === 'epic' ? 2600 : 1700;
    const timer = window.setTimeout(() => {
      if (phase === 'sealed') setPhase('hint');
      else if (phase === 'hint') setPhase('reveal');
      else if (index + 1 === results.length) setPhase('summary');
      else { setIndex(index + 1); setPhase('sealed'); }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [revealing, reducedMotion, phase, active?.rarity, index, results.length]);

  function invite(count: number, welcome = false) {
    if (revealing) return;
    const seed = m.state.account.seed + pity.totalPulls * 101 + 39;
    const result = welcome ? firstInvitation(m.state, 4)
      : R.metaCommand(m.state, { type: 'pull', bannerId, count, seed });
    if (!m.apply(result, 'Invitations opened. Every result is saved in your account history.')) return;
    setResults(m.state.account.history.slice(-count));
    setIndex(0);
    setPhase(reducedMotion ? 'summary' : 'sealed');
  }

  return <><PageTitle eyebrow="Earned stamps only" title="A new face at the door." />
    <div className="cr-tabs dp-banner-tabs" aria-label="Invitation banners">{BANNERS.map(choice =>
      <button key={choice.id} aria-pressed={bannerId === choice.id} disabled={revealing}
        onClick={() => { setBannerId(choice.id); setResults([]); }}>{choice.name}</button>)}</div>
    <section ref={fairness} className="dp-invitation-fairness" aria-label="Invitation fairness">
      <div className="dp-fairness-pity"><strong>Legendary guaranteed in {banner.hardPity - pity.sinceLegendary}</strong>
        <span>{pity.sinceLegendary}/{banner.hardPity} pulls · Next legendary {(odds.legendary / 100).toFixed(2)}%</span></div>
      <div className="dp-fairness-odds"><span>Base odds</span>{Object.entries(banner.oddsBp).map(([rarity, value]) =>
        <span key={rarity}>{rarity} {value / 100}%</span>)}</div>
      <p>{cost} stamps each · Earned in game</p>
      <a href="#invitation-history">{history[0] ? `Latest · ${resultName(history[0])} · ${history[0].rarity}` : 'Recent invitations'}
        {history[0]?.cardId && history[0].duplicate ? ` · ${history[0].shards} shards` : ''} · View history ({history.length})</a>
    </section>
    <div className="dp-invitation-grid">
      <section className="cr-panel dp-banner-info" aria-label="Invitation costs and odds">
        <h2>{banner.name}</h2>
        <div className="dp-stamp-balance"><strong>{stamps.toLocaleString('en-US')}</strong><span>earned stamps</span></div>
        <div className="cr-actions">
          {bannerId === 'standard' && !m.state.freeInvite && <button className="cr-primary"
            disabled={revealing || inRun || available < 1} onClick={() => invite(1, true)}>Open free welcome invitation</button>}
          <button className="cr-primary" disabled={revealing || inRun || stamps < cost || available < 1}
            onClick={() => invite(1)}>Invite once · {cost} stamps</button>
          <button disabled={revealing || inRun || stamps < cost * 10 || available < 10}
            onClick={() => invite(10)}>Invite ten · {cost * 10} stamps</button>
        </div>
        <small>{available} invitations left today · Account-bound</small>
        <p>{banner.description} Earn stamps from cafe service, routes and quests.</p>
        {inRun && <p>Finish your current route to open invitations.</p>}
        <div className="dp-pity"><strong>Legendary pity progress</strong>
          <progress aria-label="Legendary pity" value={pity.sinceLegendary} max={banner.hardPity} />
          <small>{pity.sinceLegendary}/{banner.hardPity} · Soft pity begins on pull {banner.softPity}</small>
        </div>
        {banner.featuredCardId && <p>{pity.featuredGuaranteed ? 'Your next legendary is Marigold.'
          : 'Legendary results have a 50% Marigold chance. After a miss, your next legendary is Marigold.'}</p>}
        <table className="dp-invitation-odds"><caption>Published rarity odds</caption>
          <thead><tr><th>Rarity</th><th>Base</th><th>Next pull</th></tr></thead>
          <tbody>{Object.entries(odds).map(([rarity, value]) => <tr key={rarity}>
            <th scope="row">{rarity}</th><td>{banner.oddsBp[rarity as keyof typeof odds] / 100}%</td><td>{(value / 100).toFixed(2)}%</td>
          </tr>)}</tbody></table>
        <details className="dp-exact-odds"><summary>Exact next-pull probabilities</summary>
          {getDrawPool(m.state.account, bannerId).map(item => <p key={item.id}>
            {CARD_BY_ID[item.id]?.name ?? R.GEAR_BY_ID[item.id]?.name ?? item.id} · {(item.probability * 100).toFixed(4)}%</p>)}
        </details>
      </section>
      <section ref={stage} className={`cr-panel dp-invitation-stage ${revealing ? 'is-revealing' : ''} ${entranceKey ? 'is-rare-reveal' : ''}`} aria-label="Invitation reveal">
        {revealing && active ? <>
          <div className="dp-reveal-toolbar"><span>Invitation {index + 1} of {results.length}</span>
            <button onClick={() => setPhase('summary')}>Skip reveal</button></div>
          <div key={`${index}-${phase}`} className={`dp-ceremony dp-ceremony-${phase}`} style={rarityStyle(active.rarity)}>
            {phase !== 'reveal' ? <div className="dp-envelope" aria-label={phase === 'sealed' ? 'Sealed invitation' : `${active.rarity} invitation`}>
              <div className="dp-envelope-fold" /><div className="dp-envelope-seal"><span className="dp-seal-cup" /></div>
              <p>{phase === 'sealed' ? 'A little knock at the door…' : `${active.rarity} invitation`}</p>
            </div> : <div className="dp-flip-result">
              {active.cardId ? <CompanionCard id={active.cardId} m={m} />
                : <div className="dp-invitation-item"><ItemIcon slot={ITEM_BY_ID[active.itemId!]!.slot} /><h3>{resultName(active)}</h3><p>{active.rarity}</p></div>}
              <p role="status">{active.cardId && active.duplicate ? `Duplicate → ${active.shards} ${resultName(active)} shards`
                : active.cardId ? 'A new companion joins your collection.' : 'Equipment added to your inventory.'}</p>
              <small>Account-bound</small>
              <button onClick={nextResult}>{index + 1 === results.length ? 'View results' : 'Next invitation'}</button>
            </div>}
          </div>
        </> : <div className="dp-featured-card">
          <small>{banner.featuredCardId ? 'Featured companion' : banner.kind === 'cat' ? 'Meet your cafe companions' : 'Equipment for your companions'}</small>
          {featuredId ? <><CompanionCard id={featuredId} m={m} />
            <p>{R.CAT_BY_ID[featuredId]!.skills[0]!.name}</p></>
            : <div className="dp-equipment-banner"><ItemIcon slot="weapon" /><ItemIcon slot="outfit" />
              <ItemIcon slot="charm" /><ItemIcon slot="relic" /><p>Four equipment slots · Account-bound</p></div>}
        </div>}
        {previewId && <div className="dp-invitation-preview" hidden={!previewVisible}>
          <CompanionPreview m={m} id={previewId} skillId={rareCard ? undefined : `${previewId}-1`}
            entranceKey={entranceKey} visible={previewVisible} />
        </div>}
      </section>
    </div>
    {results.length > 0 && !revealing && <section ref={summary} className="cr-panel dp-batch-results" aria-label="Invitation results">
      <h2>Your invitations</h2><p>Every result is account-bound. Duplicate companions grant matching shards.</p>
      <div className="dp-batch-grid">{results.map((result, resultIndex) => <article key={`${result.index}-${resultIndex}`} style={rarityStyle(result.rarity)}>
        {result.cardId ? <CompanionCard id={result.cardId} m={m} />
          : <div className="dp-invitation-item"><ItemIcon slot={ITEM_BY_ID[result.itemId!]!.slot} /><h3>{resultName(result)}</h3><small>{result.rarity} · Account-bound</small></div>}
        <p>{result.cardId && result.duplicate ? `Duplicate → ${result.shards} shards` : result.duplicate ? 'Another equipment piece' : 'New to your collection'}</p>
      </article>)}</div><div className="cr-actions"><button onClick={() => m.go('team')}>Build your team</button><button onClick={() => m.go('inventory')}>View inventory</button></div>
    </section>}
    <section id="invitation-history" className="cr-panel dp-pull-history"><h2>Recent invitations</h2>
      <p>{history.length} recorded results · Latest first · Each banner keeps its own pity</p>
      {history.length === 0 ? <p>Your opened invitations will appear here.</p> : <div className="dp-history-scroll"><table>
        <thead><tr><th>Banner / pull</th><th>Result</th><th>Rarity</th><th>Received</th></tr></thead>
        <tbody>{history.map((result, historyIndex) => <tr key={`${result.bannerId}-${result.index}-${historyIndex}`}>
          <td>{BANNERS.find(choice => choice.id === result.bannerId)?.name ?? result.bannerId} · {result.index}</td>
          <td>{resultName(result)}</td><td>{result.rarity}</td>
          <td>{result.cardId && result.duplicate ? `${result.shards} matching shards` : result.cardId ? 'Companion' : 'Equipment'} · Account-bound</td>
        </tr>)}</tbody></table></div>}
    </section>
  </>;
}
