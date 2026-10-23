import { useState } from 'react';
import { gearStat } from '@taskbar-hero/game-rules';
import type { GameApi, OwnedGear } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';
import { getGameApi, getGameLoop, useGameSnapshot } from '../game/store';
import { capitalize, formatPower, groupBySlot, powerIfEquipped } from './gearView';
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
      setError(upgradeErrorText(e));
    } finally {
      setPending(null);
    }
  };

  const upgradeButton = (item: OwnedGear) => {
    const view = upgradeView(item, gold);
    return (
      <>
        {gain?.id === item.id && <span className="inv-gain" role="status">{gain.text}</span>}
        <button
          type="button"
          className="inv-upgrade"
          disabled={pending !== null || view.kind !== 'ready'}
          aria-label={`${upgradeLabel(view)}: ${item.rarity} ${item.slot}, level ${item.level}`}
          onClick={() => void upgrade(item)}
        >
          {pending === item.id ? 'Working…' : upgradeLabel(view)}
        </button>
      </>
    );
  };

  return (
    <div className="inv">
      <p className="inv-power">
        Hero power <strong data-testid="inventory-power">{formatPower(server.power)}</strong>
        {' · '}Gold <strong data-testid="inventory-gold">{gold.toLocaleString('en-US')}</strong>
      </p>
      {error && <p role="alert" className="inv-error">{error}</p>}
      {!hasSpare && (
        <p className="inv-empty" data-testid="inventory-empty">
          Your bag is empty. Your hero picks up new gear while fighting, so check back soon.
        </p>
      )}
      <div className="inv-slots">
        {groups.map(({ slot, equipped, spare }) => (
          <section key={slot} className="inv-slot" aria-labelledby={`inv-${slot}`}>
            <h3 id={`inv-${slot}`}>{capitalize(slot)}</h3>
            <ul>
              {equipped && (
                <li className="inv-item is-equipped">
                  <ItemLabel item={equipped} />
                  <span className="inv-tag">Equipped</span>
                  {upgradeButton(equipped)}
                </li>
              )}
              {spare.map((item) => {
                const after = powerIfEquipped(server.gear, item);
                const delta = after - server.power;
                return (
                  <li key={item.id} className="inv-item">
                    <ItemLabel item={item} />
                    <span className={`inv-delta ${delta >= 0 ? 'up' : 'down'}`}>
                      {formatPower(server.power)} → {formatPower(after)}
                    </span>
                    <button
                      type="button"
                      className="inv-equip"
                      disabled={pending !== null}
                      aria-label={`Equip ${item.rarity} ${item.slot}, level ${item.level}`}
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

function ItemLabel({ item }: { item: OwnedGear }) {
  return (
    <span className="inv-name">
      <span className={`rarity-${item.rarity}`}>{capitalize(item.rarity)}</span>{' '}
      <span className="inv-meta">Lv {item.level} · Power {formatPower(gearStat(item))}</span>
    </span>
  );
}
