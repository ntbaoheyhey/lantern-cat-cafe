import React, { useEffect, useId, useRef, useState } from 'react';
import { v2 } from '@taskbar-hero/game-rules';
import { V2PixelIcon } from '../../art/v2Icons';
import { CLASS_LOOKS } from '../../game/rig';
import './ClassPicker.css';

export interface ClassPickerProps {
  /** The classes available to choose from. Defaults to v2.CLASSES. */
  classes?: readonly v2.ClassDef[];
  /** The currently selected class id, if any. */
  selected?: v2.ClassId | null;
  /** Whether changing class is locked (e.g. during a boss fight). */
  locked?: boolean;
  /** True while class switch action is in flight. */
  busy?: boolean;
  /** A failed selection remains visible beside the unchanged choice. */
  error?: string | null;
  /** When true, clicking start immediately triggers onChoose without asking for confirmation. */
  directStart?: boolean;
  /** Callback fired with the chosen classId after confirmation. */
  onChoose?: (classId: v2.ClassId) => void;
}

/** Starter three classes for new game onboarding. */
export const STARTER_CLASSES: readonly v2.ClassDef[] = v2.CLASSES.slice(0, 3);

/** Returns an ordinal string (e.g. 1st, 2nd, 3rd, 5th). */
function formatOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

/** Plain-words one-line summary of a class's passive ability. */
export function formatClassPassive(passive: v2.ClassPassive): string {
  switch (passive.id) {
    case 'cleave':
      return `Cleave: every ${formatOrdinal(passive.params.every)} swing also hits the next monster for ${Math.round(
        passive.params.splash * 100,
      )}%`;
    case 'bonk':
      return `Bonk: each hit delays target attack by ${passive.params.delayMs} ms`;
    case 'twinStrike':
      return `Twin Strike: strikes ${passive.params.hits} times per attack`;
    case 'markPrey':
      return `Mark Prey: marks target (+${Math.round(passive.params.damageTaken * 100)}% damage taken) and +${Math.round(
        passive.params.materialFind * 100,
      )}% material find`;
    case 'volley':
      return `Volley: every ${formatOrdinal(passive.params.every)} shot fires ${passive.params.arrows} arrows for ${Math.round(
        passive.params.extraArrowDamage * 100,
      )}% extra damage`;
    case 'burn':
      return `Burn: bolts splash ${Math.round(passive.params.splash * 100)}% and burn for ${Math.round(
        passive.params.burnFraction * 100,
      )}% damage over ${passive.params.durationMs / 1000}s`;
    case 'poison':
      return `Poison: poisons for ${Math.round(passive.params.poisonFraction * 100)}% damage over ${
        passive.params.durationMs / 1000
      }s and heals ${Math.round(passive.params.healOnKill * 100)}% max HP on kill`;
  }
}

/** Formats a range/role identifier into a capitalized display string. */
export function formatRole(range: v2.Range): string {
  return range.charAt(0).toUpperCase() + range.slice(1);
}

/** Converts a 24-bit integer color to hex code string. */
function toHexColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function ClassPicker({
  classes = v2.CLASSES,
  selected = null,
  locked = false,
  busy = false,
  error = null,
  directStart = false,
  onChoose,
}: ClassPickerProps) {
  const [highlightId, setHighlightId] = useState<v2.ClassId | null>(() => selected ?? classes[0]?.id ?? null);
  const [isConfirming, setIsConfirming] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const radiogroupId = useId();
  const confirmationId = useId();

  useEffect(() => {
    if (isConfirming) confirmRef.current?.focus();
  }, [isConfirming]);

  // Keep internal highlight aligned when selected prop changes externally
  useEffect(() => {
    if (selected) {
      setHighlightId(selected);
    }
  }, [selected]);

  const activeIndex = classes.findIndex((c) => c.id === highlightId);
  const activeClass = classes[activeIndex] ?? classes[0];

  const handleSelect = (classId: v2.ClassId) => {
    if (locked) return;
    setHighlightId(classId);
    setIsConfirming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (locked) return;
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % classes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + classes.length) % classes.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = classes.length - 1;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const curr = classes[index];
      if (curr) {
        handleSelect(curr.id);
      }
      return;
    }

    if (nextIndex !== null) {
      const target = classes[nextIndex];
      if (target) {
        setHighlightId(target.id);
        setIsConfirming(false);
        cardRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleChooseClick = () => {
    if (locked || !activeClass) return;
    if (directStart) {
      onChoose?.(activeClass.id);
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirm = () => {
    if (locked || !activeClass) return;
    setIsConfirming(false);
    onChoose?.(activeClass.id);
  };

  const handleCancel = () => {
    setIsConfirming(false);
    chooseRef.current?.focus();
  };

  return (
    <div className="class-picker" data-testid="class-picker">
      <div className="class-picker__header">
        <p className="class-picker__eyebrow">Step 1 of 1 · New game</p>
        <h2 className="class-picker__title">Choose Your Class</h2>
        <p className="class-picker__subtitle">
          Pick your cat's class! You can switch anytime outside boss fights.
        </p>
      </div>

      {error && <p role="alert" id={`${radiogroupId}-error`} className="class-picker__error">{error}</p>}

      {locked && !busy && (
        <div
          className="class-picker__locked-notice"
          role="status"
          aria-live="polite"
          data-testid="class-picker-locked-notice"
        >
          <span className="class-picker__locked-icon" aria-hidden="true">
            🔒
          </span>
          <span className="class-picker__locked-text">
            Class switching is locked during a boss fight. You can switch back any time outside boss fights.
          </span>
        </div>
      )}

      <div
        id={radiogroupId}
        role="radiogroup"
        aria-label="Cat classes"
        aria-describedby={error ? `${radiogroupId}-error` : undefined}
        aria-disabled={locked}
        className="class-picker__cards"
      >
        {classes.map((c, index) => {
          const isSelected = c.id === highlightId;
          const look = CLASS_LOOKS[c.id];
          const furColor = look ? toHexColor(look.fur.o) : '#f0a040';
          const shadeColor = look ? toHexColor(look.fur.d) : '#c66a1a';
          const speedSec = (c.attackIntervalMs / 1000).toFixed(2);
          const passiveText = formatClassPassive(c.passive);
          const roleLabel = formatRole(c.range);

          // HP, ATK, DEF stat leaning bars (scaled relative to 1.5 max leaning)
          const hpPct = Math.min(100, Math.max(12, Math.round((c.stats.hp / 1.5) * 100)));
          const atkPct = Math.min(100, Math.max(12, Math.round((c.stats.atk / 1.5) * 100)));
          const defPct = Math.min(100, Math.max(12, Math.round((c.stats.def / 1.5) * 100)));

          const isRovingTabTarget =
            !locked && (isSelected || (highlightId === null && index === 0));

          return (
            <div
              key={c.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={locked}
              aria-label={`${c.name}, ${roleLabel} class. Attack speed ${speedSec}s. Passive: ${passiveText}`}
              tabIndex={isRovingTabTarget ? 0 : -1}
              onClick={() => handleSelect(c.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              data-testid={`class-card-${c.id}`}
              className={`class-card ${isSelected ? 'class-card--selected' : ''} ${
                locked ? 'class-card--disabled' : ''
              }`}
            >
              {/* Top row: weapon icon, name, role badge, and fur swatch */}
              <div className="class-card__top">
                <div className="class-card__identity">
                  <div className="class-card__weapon" title={`${c.name} weapon: ${c.weaponType}`}>
                    <V2PixelIcon name={c.weaponType} size={3} />
                  </div>
                  <div className="class-card__title-group">
                    <span className="class-card__name">{c.name}</span>
                    <span className="class-card__role">{roleLabel}</span>
                  </div>
                </div>

                <div
                  className="class-card__swatch-wrapper"
                  title={`Fur swatch: ${furColor}`}
                  aria-label={`${c.name} fur color`}
                >
                  <div
                    className="class-card__swatch"
                    style={{
                      backgroundColor: furColor,
                      borderColor: shadeColor,
                    }}
                  >
                    <span
                      className="class-card__swatch-ear class-card__swatch-ear--left"
                      style={{ borderBottomColor: furColor }}
                    />
                    <span
                      className="class-card__swatch-ear class-card__swatch-ear--right"
                      style={{ borderBottomColor: furColor }}
                    />
                    <span
                      className="class-card__swatch-pattern"
                      style={{ backgroundColor: shadeColor }}
                    />
                  </div>
                </div>
              </div>

              {/* Passive description: one-line plain words */}
              <div className="class-card__passive-row">
                <p className="class-card__passive" title={passiveText}>
                  {passiveText}
                </p>
              </div>

              {/* Stat leanings: HP, ATK, DEF small bars */}
              <div className="class-card__stats" aria-label={`${c.name} stat leanings`}>
                <div className="class-card__stat-item">
                  <span className="class-card__stat-label">HP</span>
                  <div className="class-card__stat-track" aria-hidden="true">
                    <div
                      className="class-card__stat-fill class-card__stat-fill--hp"
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  <span className="class-card__stat-value">{c.stats.hp}x</span>
                </div>

                <div className="class-card__stat-item">
                  <span className="class-card__stat-label">ATK</span>
                  <div className="class-card__stat-track" aria-hidden="true">
                    <div
                      className="class-card__stat-fill class-card__stat-fill--atk"
                      style={{ width: `${atkPct}%` }}
                    />
                  </div>
                  <span className="class-card__stat-value">{c.stats.atk}x</span>
                </div>

                <div className="class-card__stat-item">
                  <span className="class-card__stat-label">DEF</span>
                  <div className="class-card__stat-track" aria-hidden="true">
                    <div
                      className="class-card__stat-fill class-card__stat-fill--def"
                      style={{ width: `${defPct}%` }}
                    />
                  </div>
                  <span className="class-card__stat-value">{c.stats.def}x</span>
                </div>
              </div>

              {/* Attack speed in seconds */}
              <div className="class-card__speed-row">
                <span className="class-card__speed-label">Attack Speed:</span>
                <span className="class-card__speed-value">{speedSec}s</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation box inside the page */}
      {isConfirming && activeClass && (
        <div
          id={confirmationId}
          className="class-picker__confirm-box"
          role="region"
          aria-label="Confirm class switch"
          data-testid="class-picker-confirm-box"
          onKeyDown={event => {
            if (event.key === 'Escape' && !busy) {
              event.preventDefault();
              event.stopPropagation();
              handleCancel();
            }
          }}
        >
          <p className="class-picker__confirm-text" data-testid="class-picker-confirm-text">
            Switch to {activeClass.name}? You can switch back any time outside boss fights.
          </p>
          <div className="class-picker__confirm-actions">
            <button
              ref={confirmRef}
              type="button"
              className="pixel-btn class-picker__confirm-btn"
              disabled={busy}
              aria-busy={busy ? 'true' : 'false'}
              onClick={handleConfirm}
              data-testid="class-picker-confirm-button"
            >
              {busy && <span className="btn-spinner" aria-hidden="true" />}
              {busy ? 'Choosing...' : 'Confirm'}
            </button>
            <button
              type="button"
              className="pixel-btn class-picker__cancel-btn"
              disabled={busy}
              onClick={handleCancel}
              data-testid="class-picker-cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Choose button */}
      <div className="class-picker__footer">
        <button
          ref={chooseRef}
          type="button"
          aria-expanded={isConfirming}
          aria-controls={isConfirming ? confirmationId : undefined}
          disabled={locked || !activeClass || busy}
          aria-disabled={locked || !activeClass || busy}
          aria-busy={busy ? 'true' : 'false'}
          className="pixel-btn class-picker__choose-btn"
          onClick={handleChooseClick}
          data-testid="class-picker-choose-button"
        >
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          {busy
            ? 'Choosing...'
            : locked
            ? 'Locked During Boss Fight'
            : activeClass
            ? selected
              ? `Choose ${activeClass.name}`
              : `Start Adventure as ${activeClass.name}`
            : 'Select a Class'}
        </button>
      </div>
    </div>
  );
}
