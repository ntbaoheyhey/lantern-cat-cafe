import React from 'react';
import type { GainsV2, ServerStateV2 } from '../../api/GameApiV2';
import { PixelIcon } from '../../art/pixelIcons';
import { ItemIcon } from '../ItemIcon';
import { itemName, rarityLabel } from '../itemView';
import { LootSummary } from '../loot/LootSummary';

export interface RecentLootCardProps {
  state: ServerStateV2;
  gains?: GainsV2 | null;
}

export function RecentLootCard({ state, gains }: RecentLootCardProps) {
  const recentItems = state.inventory.slice(-4).reverse();

  return (
    <div className="home-card home-card--loot" data-testid="home-recent-loot-card">
      <div className="home-card__header">
        <h2 className="home-card__title">Recent finds</h2>
      </div>

      <div className="home-card__body">
        {gains ? (
          <LootSummary loot={gains} heading="Recent finds" headingLevel={3} />
        ) : (
          <>
            <div className="home-loot-currencies">
              <div className="home-loot-curr-pill">
                <PixelIcon name="fish" size={2} />
                <span className="home-loot-curr-val">{state.currencies.fish.toLocaleString('en-US')}</span>
                <span className="home-loot-curr-name">Fish</span>
              </div>
              <div className="home-loot-curr-pill">
                <PixelIcon name="yarn" size={2} />
                <span className="home-loot-curr-val">{state.currencies.yarn.toLocaleString('en-US')}</span>
                <span className="home-loot-curr-name">Yarn</span>
              </div>
              <div className="home-loot-curr-pill">
                <PixelIcon name="key" size={2} />
                <span className="home-loot-curr-val">{state.currencies.keys}</span>
                <span className="home-loot-curr-name">Keys</span>
              </div>
            </div>

            <div className="home-loot-items">
              <h3 className="home-card__subtitle">Latest Drops</h3>
              {recentItems.length === 0 ? (
                <p className="home-loot-empty">Battles will drop weapons and armor.</p>
              ) : (
                <ul className="home-loot-list">
                  {recentItems.map((item) => (
                    <li key={item.id} className="home-loot-item">
                      <div className="home-loot-item__icon">
                        <ItemIcon item={item} />
                      </div>
                      <div className="home-loot-item__info">
                        <span className="home-loot-item__name">{itemName(item.itemKey)}</span>
                        <span className={'home-loot-item__rarity rarity-' + item.rarity}>
                          {rarityLabel(item.rarity)} Lv.{item.level}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
