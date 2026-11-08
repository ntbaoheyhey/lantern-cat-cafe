import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';

/** The opening points to normal crafting/equipment commands; it grants no special item. */
export function FirstEquipmentV4({ m, reveal }: { m: DepthModel; reveal: () => void }) {
  const state = m.state;
  if (!R.gameplayV4(state) || !state.freeInvite || state.tutorial < 3 || state.cleared.length
    || state.run && !state.run.complete) return null;
  if (state.tutorial >= 4) return <section className="cr-panel dp-v4-opening" aria-label="Your first route">
    <h2>Let your new piece tell its story.</h2><p>Watch its cat on the next result. Your first stop also reveals a boss clue.</p>
    <button className="cr-primary" onClick={() => m.start(1)}>Start tonight’s route</button>
  </section>;
  return <section className="cr-panel dp-v4-opening" aria-label="Your first equipment choice">
    <h2>A stronger wand or a fuller cup?</h2><p>Choose one piece. Compare its stats, then equip it.</p>
    <div className="dp-v4-grid">{([
      ['soot', 'moonwick-weapon-rare', 'A stronger wand', 'Give Soot more attack. Watch his damage on the next result.'],
      ['clover', 'mossbrew-relic-rare', 'A fuller cup', 'Give Clover more health. Watch her healing on the next result.'],
    ] as const).map(([catId, templateId, title, description]) => {
      const owned = state.gear.find(g => g.templateId === templateId);
      const preview = owned ? null : R.craftGear(state, templateId);
      const cost = preview?.ok ? Object.entries(state.account.currencies)
        .flatMap(([id, n]) => { const spent = n - preview.state.account.currencies[id as keyof typeof state.account.currencies]; return spent > 0 ? [`${spent} ${id}`] : []; }).join(' · ') : null;
      const choose = () => {
        if (owned) { m.cardId = catId; m.itemId = owned.id; reveal(); m.notify(false); return; }
        const result = R.craftGear(m.state, templateId);
        if (result.ok) { m.cardId = catId; m.itemId = result.state.gear.at(-1)!.id; reveal(); }
        m.apply(result, `${R.GEAR_BY_ID[templateId]!.name} is ready. Compare it, then equip it.`);
      };
      return <article key={catId}><h3>{R.CAT_BY_ID[catId]!.name} · {title}</h3><p>{description}</p>
        <button disabled={!owned && !preview?.ok} onClick={choose}>
          {owned ? `Compare ${R.CAT_BY_ID[catId]!.name}’s piece` : `Tailor for ${R.CAT_BY_ID[catId]!.name}`}</button>
        <small>{owned ? 'Already on your shelf.' : cost ?? preview?.error}</small>
      </article>;
    })}</div>
  </section>;
}

export function PracticePayoffV4({ battle }: { battle: R.Battle }) {
  const outcome = R.outcomeV4(battle);
  const front = battle.initial.cats.filter(c => c.row === 'front').map(c => R.CAT_BY_ID[c.id]!.name).join(' and ');
  return <section className="cr-panel dp-v4-opening" aria-label="Your placement paid off">
    <h2>Your first choice: who takes the bump?</h2>
    <p>{front} held the front: {outcome.damageByRow.front} HP lost.</p>
    <p>The back row lost {outcome.damageByRow.rear} HP. Keep your healer and attacker where they can work.</p>
    <p>Your welcome invitation is ready. Then choose a piece for your first route.</p>
  </section>;
}
