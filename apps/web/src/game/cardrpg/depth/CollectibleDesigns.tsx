import { EditionLedgerV4 } from './EditionLedgerV4';
import { SCARCITY } from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';

export function CollectibleDesigns({ m }: { m: DepthModel }) {
  const state = m.state;
  if(state.gameplayV4)return <EditionLedgerV4 m={m}/>;
  return <section className="cr-panel dp-collectibles">
    <h2>Collectible designs</h2>
    <p><strong>Design only - not minted</strong></p>
    <p>{state.seals} boss seals · {state.masteries.length}/3 chapter masteries · Tower best {state.towerBest}</p>
    <details className="dp-collectibles-help">
      <summary>How effort and supply create rarity</summary>
      <p>Earn boss seals through successful routes. Reserving a design consumes seals and requires chapter progress.
        Each account can reserve each design once. Every reservation uses one place in both its total and seasonal supply.</p>
      <p>The prototype tracks these counters in this save. Shared issuance would require a global service.
        A reservation records a design and adds 0 battle stats.</p>
      <p>Invitation results, equipment, random drops and spendable currencies are account-bound.
        Only the deterministic designs below are collectible-eligible.</p>
    </details>
    <div className="dp-design-grid">{SCARCITY.map(spec => {
      const entry = R.designEligibility(state, spec.id);
      const counters = state.account.scarcity[spec.id]!;
      const reserved = state.designClaims.includes(spec.id);
      return <article key={spec.id} aria-label={spec.name}>
        <h3>{spec.name}</h3>
        <small>Collectible-eligible design · Design only - not minted</small>
        <dl className="cr-stats">
          <div><dt>Total supply · local counter</dt><dd>{counters.issuedDesign} / {entry.globalCap}</dd></div>
          <div><dt>Season supply · local counter</dt><dd>{counters.seasonIssuedDesign} / {entry.seasonCap}</dd></div>
          <div><dt>Reservation effect</dt><dd>0 battle stats</dd></div>
          <div><dt>Account limit</dt><dd>1 reservation</dd></div>
        </dl>
        <p>{entry.seals} boss seals and {spec.id === 'moon-collar'
          ? 'one chapter clear' : 'three chapter masteries or Tower floor five'}.</p>
        <p>{reserved ? 'Your local design is reserved.' : !entry.supply ? 'This supply is fully reserved.'
          : entry.effort ? 'Effort complete. A local reservation is available.' : 'Keep progressing toward the effort requirement.'}</p>
        <button disabled={!entry.eligible} onClick={() => m.apply(R.reserveDesignPreview(state, spec.id),
          `${spec.name} reserved. Design only - not minted. Both local counters increased by one.`)}>
          {reserved ? 'Design reserved' : `Reserve with ${entry.seals} seals`}
        </button>
      </article>;
    })}</div>
  </section>;
}
