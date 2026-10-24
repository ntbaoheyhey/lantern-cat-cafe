import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BossTab } from './boss/BossTab';
import { ForgeTab } from './forge/ForgeTab';
import { DemoNote } from './game/DemoNote';
import { HeroTab } from './HeroTab';
import { InventoryTab } from './inventory/InventoryTab';
import { MarketTab } from './market/MarketTab';
import { HelpButton } from './onboarding/HowToPlay';

export const TABS = ['Hero', 'Inventory', 'Boss', 'Forge', 'Market'] as const;
export type TabName = (typeof TABS)[number];

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function Panel({
  id,
  tab,
  onTabChange,
}: {
  id: string;
  tab?: TabName;
  onTabChange?: (tab: TabName) => void;
}) {
  const [internalTab, setInternalTab] = useState<TabName>('Hero');
  const currentTab = tab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const container = tabsRef.current;
    if (!container) return;

    const updateIndicator = () => {
      const activeEl = container.querySelector<HTMLElement>(`#tab-${currentTab}`);
      if (activeEl && activeEl.offsetWidth > 0) {
        setIndicator({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };

    updateIndicator();

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(updateIndicator);
    }

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateIndicator);
      observer.observe(container);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', updateIndicator);
      return () => window.removeEventListener('resize', updateIndicator);
    }
  }, [currentTab]);

  return (
    <section id={id} className="panel" aria-label="Game panel">
      <div
        role="tablist"
        aria-label="Game panel tabs"
        className="tabs"
        ref={tabsRef}
        data-has-indicator={indicator ? 'true' : undefined}
      >
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            id={`tab-${name}`}
            aria-selected={currentTab === name}
            aria-controls="tabpanel"
            className="tab"
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
        {indicator && (
          <span
            className="tab-indicator"
            style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
            aria-hidden="true"
          />
        )}
        <HelpButton />
      </div>
      <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${currentTab}`} className="tabpanel">
        <div key={currentTab} className="tab-content">
          <h2>{currentTab}</h2>
          <DemoNote />
          {currentTab === 'Hero' ? <HeroTab /> : currentTab === 'Inventory' ? <InventoryTab /> : currentTab === 'Boss' ? <BossTab /> : currentTab === 'Forge' ? <ForgeTab /> : <MarketTab />}
        </div>
      </div>
    </section>
  );
}
