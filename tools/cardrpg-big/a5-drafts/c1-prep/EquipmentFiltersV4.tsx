import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { EQUIPMENT_SLOTS, RARITY_ORDER } from '@taskbar-hero/game-rules/cardrpg';

type Option = readonly [string, string];
function Choices({ label, value, options, choose }: { label: string; value: string; options: readonly Option[]; choose: (value: string) => void }) {
  return <fieldset className="dp-v4-filter"><legend>{label}</legend><div className="cr-actions">{options.map(([id, text]) =>
    <button key={id} aria-pressed={id === value} onClick={() => choose(id)}>{text}</button>)}</div></fieldset>;
}
export function EquipmentFiltersV4({ state, cardId, slot, rarity, setId, ownership, sort, chooseCat, chooseSlot, chooseRarity, chooseSet, chooseOwnership, chooseSort }: {
  state: R.DepthAccount; cardId: string; slot: string; rarity: string; setId: string; ownership: string; sort: string;
  chooseCat: (value: string) => void; chooseSlot: (value: string) => void; chooseRarity: (value: string) => void;
  chooseSet: (value: string) => void; chooseOwnership: (value: string) => void; chooseSort: (value: string) => void;
}) {
  return <section className="dp-v4-filters" aria-label="Equipment filters">
    <Choices label="Equip for" value={cardId} options={state.account.cards.map(card => [card.cardId, R.CAT_BY_ID[card.cardId]!.name])} choose={chooseCat} />
    <Choices label="Slot" value={slot} options={[["all", "All slots"], ...EQUIPMENT_SLOTS.map(id => [id, id] as const)]} choose={chooseSlot} />
    <Choices label="Rarity" value={rarity} options={[["all", "All rarities"], ...RARITY_ORDER.map(id => [id, id] as const)]} choose={chooseRarity} />
    <details><summary>Set, ownership and sorting</summary>
      <Choices label="Set" value={setId} options={[["all", "All sets"], ...R.SETS.map(set => [set.id, set.name] as const)]} choose={chooseSet} />
      <Choices label="Ownership" value={ownership} options={[["all", "All owned"], ["equipped", "Equipped"], ["available", "Available"]]} choose={chooseOwnership} />
      <Choices label="Sort" value={sort} options={[["rarity", "Rarity"], ["enhancement", "Enhancement"], ["name", "Name"], ["new", "Newest"], ["utility", "Build estimate"]]} choose={chooseSort} />
    </details>
  </section>;
}
