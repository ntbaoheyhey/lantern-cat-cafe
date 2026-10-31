import React, { useRef, type KeyboardEvent } from 'react';
import { CatPortrait } from '../CatPortrait';
import { PixelIcon, type IconName } from '../art/pixelIcons';
import { TabIcon } from '../layout/tabIcons';
import { RAIL_SCREENS, type ScreenId } from '../nav/screens';

export interface RailProps {
  activeScreen: ScreenId;
  onSelectScreen: (screenId: ScreenId) => void;
}

export function Rail({ activeScreen, onSelectScreen }: RailProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowDown: 1,
      ArrowUp: -1,
      ArrowRight: 1,
      ArrowLeft: -1,
    };
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]') ?? [])];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;

    let next: number | null = null;
    if (e.key in keys) {
      next = (at + keys[e.key]! + buttons.length) % buttons.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = buttons.length - 1;
    }

    if (next !== null) {
      e.preventDefault();
      buttons[next]!.focus();
      const id = buttons[next]!.getAttribute('data-screen-id') as ScreenId;
      if (id) {
        if (typeof window !== 'undefined') {
          (window as unknown as { __rail_arrow_nav?: boolean }).__rail_arrow_nav = true;
        }
        onSelectScreen(id);
      }
    }
  };

  return (
    <nav data-testid="rail" aria-label="Game menu" className="shell-rail">
      <div className="rail-top">
        <button
          type="button"
          className="rail-logo-btn"
          data-testid="rail-logo"
          aria-label="Taskbar Hero home"
          onClick={() => onSelectScreen('home')}
          title="Taskbar Hero"
        >
          <CatPortrait size={36} />
        </button>

        <div
          role="tablist"
          aria-label="Game panel tabs"
          className="rail-nav-list"
          ref={listRef}
          onKeyDown={onKeyDown}
        >
          {RAIL_SCREENS.map(({ id, label, icon }) => {
            const isActive = activeScreen === id;
            return (
              <button
                key={id}
                role="tab"
                id={`tab-${id}`}
                data-testid={`nav-${id}`}
                data-screen-id={id}
                aria-label={label}
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                aria-controls={`panel-${id}`}
                tabIndex={isActive ? 0 : -1}
                className={`rail-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectScreen(id)}
              >
                <span className="rail-item-icon" aria-hidden="true">
                  {icon === 'help' ? <TabIcon /> : <PixelIcon name={icon as IconName} size={3} />}
                </span>
                <span className="rail-item-label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rail-bottom">
        <div className="rail-fuji-badge" data-testid="rail-fuji" title="Avalanche Fuji Testnet">
          <span className="rail-fuji-dot" aria-hidden="true" />
          <span className="rail-fuji-label">Fuji</span>
        </div>
      </div>
    </nav>
  );
}
