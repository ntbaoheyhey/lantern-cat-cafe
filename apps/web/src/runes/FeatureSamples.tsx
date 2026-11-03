import { useState, type ReactNode } from 'react';
import { CONFIG } from '@taskbar-hero/game-rules';
import { COMPANION_SAMPLES } from '../pets/companionSamples';
import { ART2_QUALITIES, ART2_SKILLS, Art2Frame, Art2Image } from '../art/Art2';
import { OriginalArt } from '../original-preview/OriginalArt';
import { Tabs } from '../ui';
import './featureSamples.css';

const title = (value: string) => value[0]!.toUpperCase() + value.slice(1);
type Sample = { id: string; name: string; art: ReactNode; detail: ReactNode };

function SampleList({ label, entries }: { label: string; entries: readonly Sample[] }) {
  const [selected, setSelected] = useState(entries[0]!.id);
  const active = entries.find(entry => entry.id === selected) ?? entries[0]!;
  return <div className="feature-sample-columns">
    <ul className="feature-sample-list" aria-label={`${label} samples`}>
      {entries.map(entry => <li key={entry.id}><button type="button" aria-pressed={active.id === entry.id} onClick={() => setSelected(entry.id)}>
        <span className="feature-sample-thumb" aria-hidden="true">{entry.art}</span>
        <span><strong>{entry.name}</strong><small>Sample</small></span>
      </button></li>)}
    </ul>
    <section className="feature-sample-detail" aria-label={`${label} sample details`}>
      <header><div aria-hidden="true">{active.art}</div><div><h3>{active.name}</h3><span className="feature-sample-badge">Sample</span></div></header>
      <p className="feature-sample-unavailable">Unavailable in this run</p>
      {active.detail}
    </section>
  </div>;
}

function RuneSamples() {
  return <SampleList label="Rune" entries={ART2_QUALITIES.map(quality => ({ id: quality, name: `${title(quality)} rune socket`,
    art: <Art2Image id={`rune-slot-${quality}`} scale={2} />,
    detail: <><p>A sample socket in the {quality} frame style. Rune ownership and equipped slots are unavailable.</p>
      <dl><div><dt>Frame style</dt><dd>{title(quality)}</dd></div><div><dt>Owned runes</dt><dd>Unavailable</dd></div><div><dt>Equipped slots</dt><dd>Unavailable</dd></div></dl>
      <p>No rune is granted, equipped or upgraded by viewing this sample.</p></>,
  }))} />;
}

function CompanionSamples() {
  return <SampleList label="Companion" entries={COMPANION_SAMPLES.map(pet => ({ id: pet.id, name: pet.name,
    art: <Art2Image id="pet-slot-common" scale={2} />,
    detail: <><p>{pet.flavour}</p><p>This is a companion concept with a sample portrait placeholder.</p>
      <dl><div><dt>Ownership</dt><dd>Unavailable</dd></div><div><dt>Level and progress</dt><dd>Unavailable</dd></div><div><dt>Equipping</dt><dd>Unavailable</dd></div></dl>
      <p>Viewing this sample does not unlock a companion or apply a bonus.</p></>,
  }))} />;
}

function SkillDetails({ skillId }: { skillId: typeof ART2_SKILLS[number] }) {
  const [rank, setRank] = useState(1);
  const skill = CONFIG.originalEconomy.skills.entries[skillId];
  const amount = skill.perRank[rank - 1]!;
  return <><p>{skill.description}</p><label className="feature-sample-rank">Sample rank
    <select value={rank} onChange={event => setRank(Number(event.target.value))}>
      {skill.perRank.map((_, index) => <option key={index} value={index + 1}>Sample rank {index + 1}</option>)}
    </select></label>
    <dl><div><dt>Weapon</dt><dd>{title(skill.weaponType)}</dd></div><div><dt>Trigger</dt><dd>{skill.trigger === 'cooldown' ? `Every ${skill.every / 1000} seconds` : `Every ${skill.every} basic attacks`}</dd></div>
      <div><dt>Sample effect</dt><dd>{skill.effect === 'heal' ? `${amount * 100}% of maximum HP` : `${amount}× attack per hit`}</dd></div><div><dt>Hits per trigger</dt><dd>{skill.hits}</dd></div><div><dt>Owned rank</dt><dd>Unavailable</dd></div></dl>
    <p>Sample values describe the draft skill. No rank is purchased and no effect is applied to your run.</p></>;
}

function SkillSamples() {
  return <SampleList label="Skill" entries={ART2_SKILLS.map(id => ({ id, name: CONFIG.originalEconomy.skills.entries[id].name,
    art: <Art2Frame id={`skill-frame-${id}`}><OriginalArt kind="skill" id={id} scale={2} /></Art2Frame>,
    detail: <SkillDetails key={id} skillId={id} />,
  }))} />;
}

/** No ownership adapter exists yet. This view reads definitions, never the preview store. */
export default function FeatureSamples() {
  if (!CONFIG.features.originalEconomy) return null;
  return <section className="feature-samples" aria-label="Future feature samples">
    <header className="feature-samples-heading"><h2>Future feature samples</h2><p>Browse rune sockets, companions and skills. Every entry is a sample; these features are unavailable in your run.</p></header>
    <Tabs label="Sample categories" tabs={[
      { id: 'runes', label: 'Runes', content: <RuneSamples />, lazy: true },
      { id: 'companions', label: 'Companions', content: <CompanionSamples />, lazy: true },
      { id: 'skills', label: 'Skills', content: <SkillSamples />, lazy: true },
    ]} />
  </section>;
}
