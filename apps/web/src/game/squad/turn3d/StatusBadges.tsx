import { useId, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { STATUS_BY_ID } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import type { Status } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import { statusIdentity } from './card-status-data';

export function statusDescription(status: Status) {
  const look = statusIdentity(status.id), rule = STATUS_BY_ID[status.id];
  return `${look?.name ?? status.id} — ${look?.subtitle ?? rule?.name ?? status.id}. ${rule?.description ?? 'Unknown status.'} Stacks ${status.stacks}/${rule?.cap ?? '?'}. ${status.remaining} rounds remaining.`;
}

/** Ordinary DOM outside postprocessing. Only mounted by the lookV2 branch. */
export function StatusBadges({ statuses, name }: { statuses: readonly Status[]; name: string }) {
  const tooltipId = useId();
  const [tip, setTip] = useState<{ key: string; text: string; x: number; y: number; above: boolean } | null>(null);
  const sorted = [...statuses].sort((a,b) => (statusIdentity(a.id)?.order ?? 2) - (statusIdentity(b.id)?.order ?? 2));
  const show = (element: HTMLElement, key: string, text: string) => {
    const box = element.getBoundingClientRect(), above = box.top > 160;
    setTip({ key, text, x:Math.max(8, Math.min(innerWidth - 288, box.left)), y:above ? innerHeight - box.top + 8 : box.bottom + 8, above });
  };
  const events = (key: string, text: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => show(e.currentTarget, key, text),
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { if (document.activeElement !== e.currentTarget) setTip(null); },
    onFocus: (e: React.FocusEvent<HTMLButtonElement>) => show(e.currentTarget, key, text),
    onBlur: () => setTip(null),
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => { if (e.key === 'Escape') setTip(null); },
    'aria-describedby': tip?.key === key ? tooltipId : undefined,
  });
  return <div className="dp-status-badges" aria-label={`${name} statuses`}>
    {sorted.slice(0,4).map(status => {
      const look = statusIdentity(status.id), rule = STATUS_BY_ID[status.id], text = statusDescription(status);
      return <button type="button" key={status.id} className="dp-status-badge" data-status={status.id}
        style={{ '--status-color':look?.color ?? '#fff0d2' } as CSSProperties}
        aria-label={text} {...events(status.id,text)}>
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="14" className="dp-status-ring-track" />
          <circle cx="16" cy="16" r="14" pathLength="1" strokeDasharray={`${Math.min(1,status.remaining / Math.max(rule?.duration ?? 1,status.remaining))} 1`} transform="rotate(-90 16 16)" className="dp-status-ring" />
          <path d={look?.path ?? 'M8 8H16V16H8Z'} transform="translate(3.2 3.2) scale(1.0667)" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        </svg><b aria-hidden="true">{status.stacks}</b>
      </button>;
    })}
    {sorted.length > 4 && <button type="button" className="dp-status-more" aria-label={`${sorted.length-4} more statuses. ${sorted.slice(4).map(statusDescription).join(' ')}`}
      {...events('more', sorted.slice(4).map(statusDescription).join('\n'))}>+{sorted.length-4}</button>}
    {tip && createPortal(<div id={tooltipId} className="dp-status-tooltip" role="tooltip"
      style={{left:tip.x,maxHeight:Math.max(80,innerHeight-tip.y-8), ...(tip.above ? {bottom:tip.y} : {top:tip.y})}}>{tip.text}</div>,document.body)}
  </div>;
}
