import type { DepthModel, Screen } from './model';
import { SharpnessEvidence } from './SharpnessEvidence';
import baselineBattle from '../../../../../../reports/cardrpg-big/baseline/screens/1280-battle.png?url';
import sliceBattle from '../../../../../../reports/cardrpg-big/flow/screens/1280-mochi-4.png?url';
import layoutBounds from '../../../../../../reports/cardrpg-big/layout/1280-bounds.webp?url';

const checklist: Array<{ title: string; screen: Screen; action: string; detail: string }> = [
  { title: 'Effects and motion', screen: 'collection', action: 'Preview a companion', detail: 'Select a cat, then play its skills. The lab gallery also includes enemy actions and ultimates.' },
  { title: 'Image sharpness', screen: 'evidence', action: 'Compare native crops', detail: 'DPR 1 and 2 crops retain the measured gains and misses from the sharpness checkpoint.' },
  { title: 'Layout, scale and faces', screen: 'map', action: 'Open the route', detail: 'Prepare a fight, then compare camera A, B and C. Layout overlays are in Before / after.' },
  { title: 'Turn clarity and lag', screen: 'map', action: 'Watch an encounter', detail: 'Follow the action banner, actor, target and result. Enable the lab frame overlay to see hitches.' },
  { title: 'Card game and automatic battles', screen: 'team', action: 'Build a team', detail: 'Choose three cats, their rows and gear. Fight starts automatic playback.' },
  { title: 'A living cafe and stage', screen: 'hub', action: 'Visit the cafe', detail: 'The home shows your team and next route. Each chapter has its own tabletop scene.' },
  { title: 'Features beyond battle', screen: 'collection', action: 'Browse the collection', detail: 'Collect cards, inspect models, arrange a team, upgrade equipment and progress along routes.' },
  { title: 'Equipment and item organisation', screen: 'inventory', action: 'Open equipment', detail: 'Inspect slots, compare stats, enhance, tailor and salvage. The inventory groups five item types.' },
  { title: 'Rarity and balance', screen: 'inventory', action: 'Compare gear tiers', detail: 'Four rarity frames and named effects distinguish equipment. Measured tier win rates are in the item report.' },
  { title: 'Invitations and fairness', screen: 'gacha', action: 'Open invitations', detail: 'Use earned stamps, see the odds and guarantees, open one or ten cards, and review pull history.' },
  { title: 'Collectible value limits', screen: 'relics', action: 'Inspect design caps', detail: 'Inspect effort requirements and local season/global counters for the Relic design preview.' },
  { title: 'Original identity', screen: 'codex', action: 'Read the field guide', detail: 'Cafe companions, thread creatures and original procedural effects share a researched card-game structure.' },
];

export function BriefChecklist({ m }: { m: DepthModel }) {
  const visit = (screen: Screen) => {
    if (m.watching) return;
    m.labOpen = false;
    if (m.galleryBattle) m.closeGallery();
    m.go(screen);
  };
  return <>
    {m.watching && <p>Finish the fight or use Leave before visiting cafe screens.</p>}
    <ul className="dp-brief-list">{checklist.map(item => <li key={item.title}>
      <h3>{item.title}</h3><p>{item.detail}</p>
      <button disabled={m.watching} onClick={() => visit(item.screen)}>{item.action}</button>
    </li>)}</ul>
    <p className="dp-reference">REFERENCE — reports/cardrpg-big/baseline/COVERAGE.md · reports/cardrpg-big/memory/PROMPT.md</p>
  </>;
}

export function ComparisonEvidence() {
  return <>
    <h3>Battle presentation checkpoints</h3>
    <div className="dp-lab-comparison">
      <figure><img src={baselineBattle} alt="F0 battle with manual skill cards and fixed enemy panels" /><figcaption>F0 baseline · stage 57.120% of viewport height</figcaption></figure>
      <figure><img src={sliceBattle} alt="F5 automatic battle during Mochi's ultimate" /><figcaption>F5 starter slice · stage 78.889% at 1280×720</figcaption></figure>
    </div>
    <details><summary>Layout overlay · F1 checkpoint</summary><img className="dp-lab-layout" src={layoutBounds} alt="Stage, model and HUD bounds in the F1 measured layout" /></details>
    <p>The current build can be played alongside docs/cardrpg2/index.html. These captures identify their measured phase.</p>
    <p className="dp-reference">REFERENCE — reports/cardrpg-big/baseline/README.md · reports/cardrpg-big/layout/README.md · reports/cardrpg-big/flow/screens</p>
    <SharpnessEvidence />
  </>;
}
