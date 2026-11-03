import { memo, useId, useMemo, useState } from 'react';
import { CONFIG, createOriginalEconomyPreview, type OriginalItemId, type OriginalQualityId, type OriginalSkillId, type OriginalStatId } from '@taskbar-hero/game-rules';
import { V2PixelFrame, type V2FrameName } from '../art/v2Frames';
import { OriginalArt } from './OriginalArt';
import './originalCatalog.css';

const table = CONFIG.originalEconomy;
const itemIds = Object.keys(table.gear.items) as OriginalItemId[];
const statIds = Object.keys(table.stats) as OriginalStatId[];
const qualityIds = Object.keys(table.gear.qualities) as OriginalQualityId[];
const skillIds = Object.keys(table.skills.entries) as OriginalSkillId[];
const categories = ['items', 'stats', 'skills'] as const;
type Category = typeof categories[number];
type ItemFilter = 'all' | 'weapons' | 'armor' | 'accessories';
const number = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
const title = (value: string) => value[0]!.toUpperCase() + value.slice(1);
export const formatDraftStat = (id: OriginalStatId, value: number) => {
  const unit = table.stats[id].unit;
  return unit === 'fraction' || unit === 'probability' || unit === 'fraction/second'
    ? `${number(value * 100)}%${unit === 'fraction/second' ? '/s' : ''}` : number(value);
};
const hasId = <T extends string>(ids: readonly T[], value: string): value is T => (ids as readonly string[]).includes(value);
const inFilter = (id: OriginalItemId, filter: ItemFilter) => filter === 'all' || (filter === 'weapons'
  ? table.gear.items[id].slot === 'weapon'
  : filter === 'armor' ? ['helmet', 'armor', 'gloves', 'boots'].includes(table.gear.items[id].slot)
    : ['collar', 'earring', 'ring', 'charm'].includes(table.gear.items[id].slot));

function OriginalCatalog() {
  const controlsId = useId();
  // Only this component state opts into the pure calculator. Shared gameplay/server flag stays false.
  const [enabled, setEnabled] = useState<boolean>(CONFIG.features.originalEconomy);
  const [category, setCategory] = useState<Category>('items');
  const [filter, setFilter] = useState<ItemFilter>('all');
  const [itemId, setItemId] = useState<OriginalItemId>('seamblade');
  const [quality, setQuality] = useState<OriginalQualityId>('common');
  const [level, setLevel] = useState(1);
  const [skillId, setSkillId] = useState<OriginalSkillId>('seamsweep');
  const [rank, setRank] = useState(1);
  const preview = useMemo(() => createOriginalEconomyPreview({ enabled }), [enabled]);
  const items = itemIds.filter(id => inFilter(id, filter));
  const selectedItem = items.includes(itemId) ? itemId : items[0]!;
  const item = table.gear.items[selectedItem];
  const bonus = preview?.item(selectedItem, quality, level);
  const combined = preview?.stats(bonus);
  const shownStats = statIds.filter(id => ['hp', 'atk', 'def'].includes(id) || bonus?.[id] !== undefined);
  const skill = table.skills.entries[skillId];
  const effect = preview?.skill(skillId, rank);
  const unlock = table.skills.unlockLevels[rank - 1]!;
  const upgrade = preview?.upgradeCost(quality, level);
  return <section className="original-preview" aria-label="Original catalog preview">
    <header className="original-preview-header"><div><h3>Lamplit catalog <span className="original-draft-tag">Draft</span></h3><p>Local preview · your current run stays unchanged.</p></div>
      {preview && <div className="original-sections" role="group" aria-label="Catalog sections">{categories.map(kind => <button key={kind} type="button" aria-pressed={category === kind} onClick={() => setCategory(kind)}>{title(kind)}</button>)}</div>}
      <button type="button" role="switch" aria-label="Catalog preview" aria-checked={enabled} className="pixel-btn" onClick={() => setEnabled(value => !value)}>{enabled ? 'Turn preview off' : 'Enable preview'}</button>
    </header>
    {!preview ? <div className="original-preview-off"><h4>Preview is off</h4><p>Turn it on to explore 12 stats, 15 item examples, 5 qualities and 7 skills.</p><p className="original-preview-note">Switching Help tabs or reloading returns the preview to OFF.</p></div> : <>
      {category === 'stats' ? <div className="original-stat-scroll" tabIndex={0} aria-label="Scrollable draft stats"><table className="original-stat-table" aria-label="Draft stat definitions"><thead><tr><th>Stat</th><th>Base</th><th>Cap</th><th>Meaning</th></tr></thead><tbody>{statIds.map(id => <tr key={id} data-testid={`draft-stat-${id}`}><th scope="row"><OriginalArt kind="stat" id={id} /><span>{table.stats[id].name}</span></th><td>{formatDraftStat(id, table.stats[id].base)}</td><td>{table.stats[id].cap === null ? 'No draft cap' : formatDraftStat(id, table.stats[id].cap!)}</td><td>{table.stats[id].description}</td></tr>)}</tbody></table></div> : <div className="original-catalog-columns">
        <aside className="original-catalog-list">
          {category === 'items' && <div className="original-filters" role="group" aria-label="Item categories">{(['all', 'weapons', 'armor', 'accessories'] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{title(value)}</button>)}</div>}
          <ul aria-label={category === 'items' ? 'Preview items' : 'Preview skills'}>{category === 'items' ? items.map(id => <li key={id}><button type="button" aria-pressed={selectedItem === id} onClick={() => setItemId(id)}><OriginalArt kind="item" id={id} /><span><strong>{table.gear.items[id].name}</strong><small>{title(table.gear.items[id].slot)}</small></span></button></li>) : skillIds.map(id => <li key={id}><button type="button" aria-pressed={skillId === id} onClick={() => setSkillId(id)}><OriginalArt kind="skill" id={id} /><span><strong>{table.skills.entries[id].name}</strong><small>{title(table.skills.entries[id].weaponType)}</small></span></button></li>)}</ul>
        </aside>
        <section className="original-catalog-detail" aria-label={category === 'items' ? 'Draft item details' : 'Draft skill details'}>
          {category === 'items' ? <>
            <div className="original-detail-heading"><div className="original-framed-art"><V2PixelFrame name={`frame${title(quality)}` as V2FrameName} size={5} /><OriginalArt kind="item" id={selectedItem} scale={2} /></div><div><h4>{item.name}</h4><p>{title(item.slot)}{'weaponType' in item ? ` · ${title(item.weaponType)}` : ''}</p><p className="original-quality-label">{table.gear.qualities[quality].name} · {title(quality)}</p></div></div>
            <p>{item.description}</p>
            <div className="original-controls"><label><span id={`${controlsId}-quality`}>Preview quality</span><select aria-labelledby={`${controlsId}-quality`} value={quality} onChange={event => { if (hasId(qualityIds, event.target.value)) setQuality(event.target.value); }}>{qualityIds.map(id => <option key={id} value={id}>{table.gear.qualities[id].name} ({title(id)})</option>)}</select></label><label><span id={`${controlsId}-level`}>Preview item level</span><select aria-labelledby={`${controlsId}-level`} value={level} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= table.gear.maxLevel) setLevel(value); }}>{Array.from({ length: table.gear.maxLevel }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label></div>
            <div className="original-detail-stats"><div><h5>Item bonuses</h5><dl>{Object.entries(bonus!).map(([id, value]) => <div key={id}><dt>{table.stats[id as OriginalStatId].name}</dt><dd data-testid={`draft-bonus-${id}`}>+{formatDraftStat(id as OriginalStatId, value!)}</dd></div>)}</dl></div><div><h5>Draft base + this item</h5><dl>{shownStats.map(id => <div key={id}><dt>{table.stats[id].name}</dt><dd>{formatDraftStat(id, combined![id])}</dd></div>)}</dl></div></div>
            <p data-testid="draft-upgrade-cost">{upgrade === null ? 'Maximum preview level' : `Next draft upgrade: ${number(upgrade!)} Fish`}</p>
            <p className="original-preview-note">{number(table.gear.qualities[quality].weightBp / 100)}% of draft gear results use this quality. This is conditional on a gear result.</p>
          </> : <>
            <div className="original-detail-heading"><OriginalArt kind="skill" id={skillId} scale={2} /><div><h4>{skill.name}</h4><p>{title(skill.weaponType)} · {skill.effect === 'heal' ? 'Recovery' : 'Damage'}</p></div></div>
            <p>{skill.description}</p>
            <div className="original-controls"><label><span id={`${controlsId}-rank`}>Preview skill rank</span><select aria-labelledby={`${controlsId}-rank`} value={rank} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= table.skills.rankFish.length) setRank(value); }}>{table.skills.rankFish.map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label></div>
            <dl className="original-skill-facts"><div><dt>Trigger</dt><dd>{skill.trigger === 'cooldown' ? `Every ${number(skill.every / 1000)} seconds` : `Every ${skill.every} basic attacks`}</dd></div><div><dt>Interval at draft base</dt><dd>{number(effect!.intervalMs / 1000)} seconds</dd></div><div><dt>{skill.effect === 'heal' ? 'HP per trigger' : 'Raw damage per trigger'}</dt><dd data-testid="draft-skill-output">{number(effect!.amountPerActivation)}</dd></div><div><dt>Average extra output per second</dt><dd>{number(effect!.amountPerSecond)}</dd></div><div><dt>Hits per trigger</dt><dd>{skill.hits}</dd></div><div><dt>Draft rank cost</dt><dd>{number(preview.skillCost(rank, unlock)!)} Fish · requires level {unlock}</dd></div></dl>
            <p className="original-preview-note">Uses the draft base stats, one target, before defense. No gear or critical-hit modifier is included. This preview does not grant skill ranks.</p>
          </>}
        </section>
      </div>}
    </>}
  </section>;
}
export default memo(OriginalCatalog);
