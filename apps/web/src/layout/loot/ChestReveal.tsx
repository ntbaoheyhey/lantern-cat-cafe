import { useCallback, useEffect, useRef, useState } from 'react';
import type { LootV2, MaterialStacks } from '../../api/GameApiV2';
import { BackdropView } from '../../art/backdrops/BackdropView';
import { backdropFor } from '../../art/backdrops';
import { V2PixelIcon, type V2IconName } from '../../art/v2Icons';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';
import { LootSummary } from './LootSummary';
import { lootLines } from './lootLines';
import { Modal } from '../../ui';
import './loot.css';

export interface ChestRevealProps {
  chest: LootV2;
  firstClear: boolean;
  onDone: () => void;
  chapter?: number;
}

function getRevealedLoot(chest: LootV2, count: number): LootV2 {
  const allLines = lootLines(chest);
  const linesToShow = allLines.slice(0, count);
  const itemsCount = Math.max(0, count - allLines.length);
  const itemsToShow = (chest.items ?? []).slice(0, itemsCount);
  const autoSalvagedCount = Math.max(0, count - allLines.length - (chest.items ?? []).length);
  const autoSalvagedToShow = autoSalvagedCount > 0 ? (chest.autoSalvaged ?? []) : [];

  const materials: MaterialStacks = {};
  let fish = 0;
  let yarn = 0;
  let keys = 0;

  for (const line of linesToShow) {
    if (line.id === 'fish') fish = line.amount;
    else if (line.id === 'yarn') yarn = line.amount;
    else if (line.id === 'keys') keys = line.amount;
    else materials[line.id] = line.amount;
  }

  return {
    fish,
    yarn,
    keys,
    materials,
    items: itemsToShow,
    autoSalvaged: autoSalvagedToShow,
  };
}

export function ChestReveal({ chest, firstClear, onDone, chapter }: ChestRevealProps) {
  const reduced = usePrefersReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allLines = lootLines(chest);
  const items = chest.items ?? [];
  const autoSalvaged = chest.autoSalvaged ?? [];
  const totalUnits = allLines.length + items.length + (autoSalvaged.length > 0 ? 1 : 0);

  const [isOpen, setIsOpen] = useState(reduced);
  const [revealedCount, setRevealedCount] = useState(() => (reduced ? totalUnits : 0));

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleDone = useCallback(() => {
    clearTimer();
    onDone();
  }, [clearTimer, onDone]);

  const isComplete = isOpen && revealedCount >= totalUnits;

  const handleSkipOrCollect = () => {
    if (isComplete) {
      handleDone();
    } else {
      clearTimer();
      setIsOpen(true);
      setRevealedCount(totalUnits);
    }
  };

  useEffect(() => {
    if (reduced) {
      clearTimer();
      setIsOpen(true);
      setRevealedCount(totalUnits);
      return;
    }

    if (!isOpen) {
      timerRef.current = setTimeout(() => {
        setIsOpen(true);
        setRevealedCount(1);
      }, 150);
      return () => clearTimer();
    }

    if (revealedCount < totalUnits) {
      timerRef.current = setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, 150);
      return () => clearTimer();
    }
  }, [isOpen, revealedCount, totalUnits, reduced, clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const title = firstClear ? 'First clear chest!' : 'Boss chest';

  let chestIconName: V2IconName;
  if (firstClear) {
    chestIconName = isOpen ? 'chestGoldOpen' : 'chestGold';
  } else {
    chestIconName = isOpen ? 'chestWoodOpen' : 'chestWood';
  }

  const revealedLoot = isOpen ? getRevealedLoot(chest, revealedCount) : null;

  return (
    <Modal open title={title} onClose={handleDone} initialFocusRef={buttonRef}
      className="loot-dialog chest-reveal-dialog" backdropClassName="loot-backdrop"
      closeOnBackdrop={false} showCloseButton={false}>
        {chapter !== undefined && (
          <div className="chest-reveal-backdrop-frame" aria-hidden="true">
            <BackdropView art={backdropFor(chapter)} className="chest-reveal-backdrop-art" />
            <div className="chest-reveal-scrim" />
          </div>
        )}
        <div className="chest-reveal-header">
          <div className="chest-reveal-icon-wrap">
            <V2PixelIcon name={chestIconName} size={4} title={title} />
          </div>
        </div>

        {revealedLoot && (
          <LootSummary loot={revealedLoot} heading="Rewards" headingLevel={3} />
        )}

        <div className="chest-reveal-actions">
          <button
            ref={buttonRef}
            type="button"
            className="pixel-btn chest-reveal-btn"
            onClick={handleSkipOrCollect}
          >
            {isComplete ? 'Collect' : 'Skip'}
          </button>
        </div>
    </Modal>
  );
}
