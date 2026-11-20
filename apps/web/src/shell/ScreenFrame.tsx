import { useEffect, useRef } from 'react';
import '../visual/scene.css';
import '../visual/visual.css';
import React, { type CSSProperties, type ReactNode } from 'react';
import { Rail } from './Rail';
import { Hud, type HudProps } from './Hud';
import { SCREEN_REGISTRY, type ScreenId } from '../nav/screens';
import './shell.css';

export interface ScreenFrameProps {
  activeScreen: ScreenId;
  onSelectScreen: (screenId: ScreenId) => void;
  showRail?: boolean;
  hudProps?: HudProps | null;
  style?: CSSProperties;
  dataLayout?: string;
  dataTall?: string;
  dataShortLandscape?: string;
  children: ReactNode;
}

export function ScreenFrame({
  activeScreen,
  onSelectScreen,
  showRail: showRailProp,
  hudProps,
  style,
  dataLayout,
  dataTall,
  dataShortLandscape,
  children,
}: ScreenFrameProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () => { if (host.current) host.current.dataset.visualPaused = String(document.hidden); };
    sync(); document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  const currentDef = SCREEN_REGISTRY.find((s) => s.id === activeScreen);
  const showRail = showRailProp !== undefined ? showRailProp && (currentDef?.rail ?? true) : (currentDef ? currentDef.rail : true);
  const showHud = Boolean(hudProps);

  return (
    <div
      ref={host}
      className="app-shell v2-shell"
      data-game-v2="stage-v2-enabled"
      data-active-screen={activeScreen}
      data-has-rail={showRail ? 'true' : 'false'}
      data-layout={dataLayout}
      data-tall={dataTall}
      data-short-landscape={dataShortLandscape}
      style={style}
    >
      {showRail && (
        <Rail
          activeScreen={activeScreen}
          onSelectScreen={onSelectScreen}
        />
      )}

      <div className="shell-body">
        {showHud && hudProps ? (
          <Hud {...hudProps} />
        ) : (
          <h1 className="visually-hidden-accessible">Taskbar Hero</h1>
        )}

        <main data-testid="screen" className="shell-screen" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
