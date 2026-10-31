import React, { useEffect, useRef } from 'react';
import type { LoopEventV2 } from '../../game/v2/events';
import type { ServerStateV2 } from '../../api/GameApiV2';

export interface EventLogProps {
  state: ServerStateV2;
  events?: LoopEventV2[];
}

export function formatEventMessage(event: LoopEventV2, catName: string): string {
  switch (event.type) {
    case 'claimed':
      return catName + ' gathered ' + event.gains.fish + ' Fish and ' + event.gains.yarn + ' Yarn' + (event.gains.items.length > 0 ? ' (+' + event.gains.items.length + ' gear)' : '');
    case 'levelUp':
      return '🌟 ' + catName + ' leveled up to Lv. ' + event.to + '!';
    case 'roundUp':
      return '⚔️ Advanced to Chapter ' + event.chapter + ', Round ' + event.round;
    case 'chapterUp':
      return '🏆 Chapter ' + event.chapter + ' unlocked!';
    case 'bossFight':
      return event.result.won
        ? '🎉 Boss defeated! Victory rewards earned.'
        : '💀 Defeated by Boss. Train more and retry!';
    case 'crafted':
      return '🔨 Crafted ' + event.result.item.itemKey + ' (Lv. ' + event.result.item.level + ')';
    case 'salvaged':
      return '♻️ Salvaged gear for +' + event.result.gains.yarn + ' Yarn';
    case 'forged':
      return '✨ Forged Relic claim #' + event.result.claimId + '!';
    case 'refused':
      return 'Action prevented: ' + event.code;
    case 'error':
      return 'Notice: ' + event.message;
    default:
      return catName + ' continues exploring...';
  }
}

export function EventLog({ state, events = [] }: EventLogProps) {
  const catName = 'Mochi';
  const listRef = useRef<HTMLDivElement>(null);

  const defaultEntries = [
    catName + ' entered Chapter ' + state.progress.chapter + ' (Round ' + state.progress.round + ').',
    'Auto-battle active: exploring and defeating monsters.',
  ];

  const lines = events.length > 0
    ? events.slice(-8).map((e) => formatEventMessage(e, catName))
    : defaultEntries;

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="home-event-log" role="region" aria-label="Event log" data-testid="home-event-log">
      <div className="home-event-log__header">
        <span className="home-event-log__title">Battle Log</span>
        <span className="home-event-log__live-dot" aria-hidden="true" />
      </div>
      <div ref={listRef} className="home-event-log__list" tabIndex={0} aria-live="polite">
        {lines.map((line, idx) => (
          <div key={idx} className="home-event-log__entry">
            <span className="home-event-log__bullet">›</span>
            <span className="home-event-log__text">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
