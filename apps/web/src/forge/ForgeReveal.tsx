import { useEffect, useState } from 'react';
import type { Rarity } from '@taskbar-hero/game-rules';
import { PixelIcon } from '../art/pixelIcons';
import { relicImageUrl } from '../market/marketText';
import { LABELS } from '../theme/labels';
import { relicName } from './forgeText';

export type RevealStage = 'charge' | 'flash' | 'rise' | 'banner';

/** When each stage starts, as a fraction of the whole reveal. */
const STAGES: [RevealStage, number][] = [
  ['charge', 0],
  ['flash', 0.36],
  ['rise', 0.44],
  ['banner', 0.8],
];

export interface ForgeRevealProps {
  relicId: string;
  rarityName: Rarity;
  /** Total length in ms. The parent ends the reveal at this time (or on skip). */
  revealMs: number;
  onSkip: () => void;
}

/**
 * The forge reveal: charge (shake and glow), flash, the Relic rises with sparkles, the rarity banner
 * slides in. Pure CSS keyframes keyed on `data-stage`; the result is already known, this only delays
 * showing it. Skip button or Escape ends it early.
 */
export function ForgeReveal({ relicId, rarityName, revealMs, onSkip }: ForgeRevealProps) {
  const [stage, setStage] = useState<RevealStage>('charge');

  useEffect(() => {
    const timers = STAGES.slice(1).map(([s, at]) => setTimeout(() => setStage(s), revealMs * at));
    return () => timers.forEach(clearTimeout);
  }, [revealMs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onSkip]);

  const shown = stage === 'rise' || stage === 'banner';
  return (
    <div className="forge-stage" data-stage={stage} data-testid="forge-reveal" style={{ ['--reveal-ms' as string]: `${revealMs}ms` }}>
      <div className={`forge-stage-art rarity-${rarityName}`}>
        <div className="fz-glow" aria-hidden="true" />
        <div className="fz-core" aria-hidden="true">
          <PixelIcon name="yarn" size={6} />
        </div>
        <div className="fz-flash" aria-hidden="true" />
        {shown && (
          <>
            <div className={`relic-tile rarity-${rarityName} fz-relic`}>
              <img src={relicImageUrl(BigInt(relicId))} alt="" width={64} height={64} />
            </div>
            <span className="fz-spark s1" aria-hidden="true" />
            <span className="fz-spark s2" aria-hidden="true" />
            <span className="fz-spark s3" aria-hidden="true" />
          </>
        )}
      </div>
      <p className="fz-banner" aria-live="polite">
        {stage === 'banner' ? (
          <>
            <strong className={`rarity-${rarityName}`}>{relicName(rarityName)}</strong>{' '}
            <span className={`forge-tag rarity-${rarityName}`}>{LABELS.rarities[rarityName]}</span>
          </>
        ) : (
          <span className="forge-reveal forging">Forging…</span>
        )}
      </p>
      <button type="button" className="forge-btn forge-skip" onClick={onSkip}>
        Skip
      </button>
    </div>
  );
}
