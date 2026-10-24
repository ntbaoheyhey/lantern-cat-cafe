import { useState, type CSSProperties } from 'react';
import { gearStat } from '@taskbar-hero/game-rules';
import type { GameApi, OwnedGear } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';
import { getGameApi, getGameLoop, useGameSnapshot } from '../game/store';
import { PixelIcon, type IconName } from '../art/pixelIcons';
import { LABELS } from '../theme/labels';
import { formatPower, groupBySlot, powerIfEquipped } from './gearView';
import { gainText, upgradeErrorText, upgradeLabel, upgradeView } from './upgrade';
import './inventory.css';

export interface InventoryTabProps {
  api?: GameApi;
  loop?: GameLoop;
}

/** Owned gear by slot: Equip for spare items (with the power change) and Upgrade for every item. */
export function InventoryTab({ api = getGameApi(), loop = getGameLoop() }: InventoryTabProps) {
  const { server, gold } = useGameSnapshot(loop);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gain, setGain] = useState<{ id: string; text: string } | null>(null);

  if (!server) return <p>Loading your bag…</p>;

  const groups = groupBySlot(server.inventory);
  const strongestPower = Math.max(1, ...server.inventory.map(gearStat));
  const hasSpare = groups.some((g) => g.spare.length > 0);

  const equip = async (item: OwnedGear) => {
    setPending(item.id);
    setError(null);
    try {
      loop.adopt(await api.equip(item.id));
    } catch {
      setError('Could not equip that item. Please try again.');
    } finally {
      setPending(null);
    }
  };

  const upgrade = async (item: OwnedGear) => {
    setPending(item.id);
    setError(null);
    setGain(null);
    const text = gainText(item, server.gear, item.equipped);
    try {
      // The shown gold is predicted; claim first so the server has counted it too.
      const cost = upgradeView(item, gold);
      if (cost.kind === 'ready' && server.gold < cost.cost) await loop.claim();
      loop.adopt(await api.upgrade(item.id));
      setGain({ id: item.id, text });
    } catch (e) {
      setError(upgradeErrorText(e).replaceAll('gold', LABELS.gold));
    } finally {
      setPending(null);
    }
  };

  const upgradeButton = (item: OwnedGear) => {
    const view = upgradeView(item, gold);
    return (
      <>
        {view.kind !== 'max' && <span className="inv-preview">Next: {gainText(item, server.gear, item.equipped)}</span>}
        {gain?.id === item.id && <span className="inv-gain" role="status">{gain.text}</span>}
        <button
          type="button"
          className="inv-upgrade pixel-btn"
          disabled={pending !== null || view.kind !== 'ready'}
          aria-label={`${upgradeLabel(view).replaceAll('gold', LABELS.gold)}: ${LABELS.rarities[item.rarity]} ${LABELS.slots[item.slot]}, level ${item.level}`}
          onClick={() => void upgrade(item)}
        >
          {pending === item.id ? 'Working…' : upgradeLabel(view).replaceAll('gold', LABELS.gold)}
        </button>
      </>
    );
  };

  return (
    <div className="inv">
      <p className="inv-power">
        {LABELS.power} <strong data-testid="inventory-power">{formatPower(server.power)}</strong>
        {' · '}{LABELS.gold} <strong data-testid="inventory-gold">{gold.toLocaleString('en-US')}</strong>
      </p>
      {error && <p role="alert" className="inv-error">{error}</p>}
      {!hasSpare && (
        <p className="inv-empty" data-testid="inventory-empty">
          No spare gear in your bag. Unequipped drops will appear here as {LABELS.hero} fights.
        </p>
      )}
      <div className="inv-slots">
        {groups.map(({ slot, equipped, spare }) => (
          <section key={slot} className="inv-slot pixel-card" aria-labelledby={`inv-${slot}`}>
            <h3 id={`inv-${slot}`}>{LABELS.slots[slot]}</h3>
            <ul>
              {equipped && (
                <li className={`inv-item is-equipped inv-icon-${equipped.rarity}`}>
                  <ItemLabel item={equipped} strongestPower={strongestPower} />
                  <span className="inv-tag">Equipped</span>
                  {upgradeButton(equipped)}
                </li>
              )}
              {spare.map((item) => {
                const after = powerIfEquipped(server.gear, item);
                const delta = after - server.power;
                return (
                  <li key={item.id} className={`inv-item inv-icon-${item.rarity}`}>
                    <ItemLabel item={item} strongestPower={strongestPower} />
                    <span className={`inv-delta ${delta >= 0 ? 'up' : 'down'}`}>
                      {formatPower(server.power)} → {formatPower(after)}
                    </span>
                    <button
                      type="button"
                      className="inv-equip pixel-btn"
                      disabled={pending !== null}
                      aria-label={`Equip ${LABELS.rarities[item.rarity]} ${LABELS.slots[item.slot]}, level ${item.level}`}
                      onClick={() => void equip(item)}
                    >
                      {pending === item.id ? 'Working…' : 'Equip'}
                    </button>
                    {upgradeButton(item)}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

const SLOT_ICONS = { weapon: 'wand', helm: 'ears', armor: 'collar', ring: 'bell' } as const satisfies Record<OwnedGear['slot'], IconName>;

function ItemLabel({ item, strongestPower }: { item: OwnedGear; strongestPower: number }) {
  const power = gearStat(item);
  return (
    <span className="inv-name">
      <span className={`inv-icon inv-icon-${item.rarity}`} aria-hidden="true"><PixelIcon name={SLOT_ICONS[item.slot]} size={3} /></span>
      <span className="inv-title">
        <span className="inv-item-name">{LABELS.slots[item.slot]}</span>
        <span className={`inv-rarity rarity-${item.rarity}`}>{LABELS.rarities[item.rarity]}</span>
        <span className="inv-meta">Lv {item.level} · Power {formatPower(power)}</span>
      </span>
      <span
        className="inv-power-bar"
        role="meter"
        aria-label={`${LABELS.rarities[item.rarity]} ${LABELS.slots[item.slot]} power compared with strongest owned item`}
        aria-valuemin={0}
        aria-valuemax={strongestPower}
        aria-valuenow={power}
        aria-valuetext={`${formatPower(power)} of ${formatPower(strongestPower)} power`}
        style={{ '--power-fill': `${power / strongestPower * 100}%` } as CSSProperties}
      >
        <span />
      </span>
    </span>
  );
}
