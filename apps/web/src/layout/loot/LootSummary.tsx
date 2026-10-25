import { useId } from 'react';
import type { GainsV2, LootV2, ItemV2 } from '../../api/GameApiV2';
import { PixelIcon } from '../../art/pixelIcons';
import { V2PixelIcon, type V2IconName } from '../../art/v2Icons';
import { V2PixelFrame } from '../../art/v2Frames';
import { frameFor, itemIconName, itemName, rarityLabel } from '../itemView';
import { formatAmount, isEmptyLoot, lootLines, type LootLineV2 } from './lootLines';
import './loot.css';

export interface LootSummaryProps {
  loot: LootV2 | GainsV2;
  heading: string;
  headingLevel?: 2 | 3;
}

function LineIcon({ id }: { id: LootLineV2['id'] }) {
  if (id === 'fish') {
    return <PixelIcon name="fish" size={3} />;
  }
  if (id === 'yarn') {
    return <PixelIcon name="yarn" size={3} />;
  }
  if (id === 'keys') {
    return <PixelIcon name="key" size={3} />;
  }
  return <V2PixelIcon name={id as V2IconName} size={3} />;
}

export function LootSummary({ loot, heading, headingLevel = 2 }: LootSummaryProps) {
  const headingId = useId();
  const HeadingTag = headingLevel === 3 ? 'h3' : 'h2';

  if (isEmptyLoot(loot)) {
    return (
      <section aria-labelledby={headingId} className="loot-summary">
        <HeadingTag id={headingId} className="loot-summary-heading">
          {heading}
        </HeadingTag>
        <p className="loot-summary-empty">Nothing new this time.</p>
      </section>
    );
  }

  const lines = lootLines(loot);
  const levelsGained = 'levelsGained' in loot ? Math.floor(loot.levelsGained) : 0;
  const xp = 'xp' in loot ? Math.floor(loot.xp) : 0;

  const hasLines = levelsGained > 0 || xp > 0 || lines.length > 0;
  const items: ItemV2[] = loot.items ?? [];
  const autoSalvaged = loot.autoSalvaged ?? [];

  return (
    <section aria-labelledby={headingId} className="loot-summary">
      <HeadingTag id={headingId} className="loot-summary-heading">
        {heading}
      </HeadingTag>

      {hasLines && (
        <ul className="loot-lines" aria-label="Loot lines">
          {levelsGained > 0 && (
            <li className="loot-line loot-line-levelup">
              <span className="loot-line-badge" aria-hidden="true">★</span>
              <span className="loot-line-text">Level up! +{levelsGained}</span>
            </li>
          )}
          {xp > 0 && (
            <li className="loot-line loot-line-xp">
              <span className="loot-line-badge" aria-hidden="true">XP</span>
              <span className="loot-line-text">+{formatAmount(xp)} XP</span>
            </li>
          )}
          {lines.map((line) => (
            <li key={line.id} className="loot-line">
              <span className="loot-line-icon" aria-hidden="true">
                <LineIcon id={line.id} />
              </span>
              <span className="loot-line-text">
                +{formatAmount(line.amount)} {line.label}
              </span>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="loot-items" aria-label="Items">
          {items.map((item, index) => (
            <li key={item.id || index} className="loot-item-tile">
              <span className="loot-item-art">
                <V2PixelFrame name={frameFor(item.rarity)} size={2} />
                <span className="loot-item-art-icon">
                  <V2PixelIcon name={itemIconName(item)} size={2} />
                </span>
              </span>
              <div className="loot-item-info">
                <span className="loot-item-name">{itemName(item.itemKey)}</span>
                <span className="loot-item-meta">
                  <span className={`loot-item-rarity-${item.rarity}`}>{rarityLabel(item.rarity)}</span>
                  {' · '}
                  <span>Lv {item.level}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {autoSalvaged.length > 0 && (
        <p className="loot-salvaged-note">
          {autoSalvaged.length === 1
            ? '1 item did not fit in your bag and was salvaged.'
            : `${autoSalvaged.length} items did not fit in your bag and were salvaged.`}
        </p>
      )}
    </section>
  );
}
