import { useState } from 'react';
import { gearStat } from '@taskbar-hero/game-rules';
import type { GameApi, OwnedGear } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';
import { getGameApi, getGameLoop, useGameSnapshot } from '../game/store';
import { capitalize, formatPower, groupBySlot, powerIfEquipped } from './gearView';
import './inventory.css';

export interface InventoryTabProps {
  api?: GameApi;
  loop?: GameLoop;
}

/** Owned gear by slot, with an Equip button and the power change for each spare item. */
export function InventoryTab({ api = getGameApi(), loop = getGameLoop() }: InventoryTabProps) {
  const { server } = useGameSnapshot(loop);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="inv">
      <p className="inv-power">
        Hero power <strong data-testid="inventory-power">{formatPower(server.power)}</strong>
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
                      {pending === item.id ? 'Equipping…' : 'Equip'}
                    </button>
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
