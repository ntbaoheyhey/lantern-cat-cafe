import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { LootV2, MaterialStacks } from '../../api/GameApiV2';
import { BackdropView } from '../../art/backdrops/BackdropView';
import { backdropFor } from '../../art/backdrops';
import { V2PixelIcon, type V2IconName } from '../../art/v2Icons';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';
import { LootSummary } from './LootSummary';
import { lootLines } from './lootLines';
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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priorFocused = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null,
  );

  const allLines = lootLines(chest);
  const items = chest.items ?? [];
  const autoSalvaged = chest.autoSalvaged ?? [];
  const totalUnits = allLines.length + items.length + (autoSalvaged.length > 0 ? 1 : 0);

  const [isOpen, setIsOpen] = useState(reduced);
  const [revealedCount, setRevealedCount] = useState(() => (reduced ? totalUnits : 0));

  const restoreFocus = useCallback(() => {
    if (priorFocused.current && document.contains(priorFocused.current)) {
      priorFocused.current.focus();
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleDone = useCallback(() => {
    clearTimer();
    restoreFocus();
    onDone();
  }, [clearTimer, onDone, restoreFocus]);

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

  // Focus the action button on mount & restore focus on unmount
  useEffect(() => {
    buttonRef.current?.focus();
    return () => {
      restoreFocus();
    };
  }, [restoreFocus]);

  // Keyboard navigation: Escape to done, Tab trap
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDone();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleDone]);

  const title = firstClear ? 'First clear chest!' : 'Boss chest';

  let chestIconName: V2IconName;
  if (firstClear) {
    chestIconName = isOpen ? 'chestGoldOpen' : 'chestGold';
  } else {
    chestIconName = isOpen ? 'chestWoodOpen' : 'chestWood';
  }

  const revealedLoot = isOpen ? getRevealedLoot(chest, revealedCount) : null;

  return (
    <div className="loot-backdrop">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="loot-dialog chest-reveal-dialog"
      >
        {chapter !== undefined && (
          <div className="chest-reveal-backdrop-frame" aria-hidden="true">
            <BackdropView art={backdropFor(chapter)} className="chest-reveal-backdrop-art" />
            <div className="chest-reveal-scrim" />
          </div>
        )}
        <div className="chest-reveal-header">
          <h2 id={titleId} className="chest-reveal-title">
            {title}
          </h2>
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
      </div>
    </div>
  );
}
