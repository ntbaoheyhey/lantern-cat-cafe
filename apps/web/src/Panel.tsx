import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BossTab } from './boss/BossTab';
import { ForgeTab } from './forge/ForgeTab';
import { DemoNote } from './game/DemoNote';
import { HeroTab } from './HeroTab';
import { InventoryTab } from './inventory/InventoryTab';
import { MarketTab } from './market/MarketTab';
import { HelpButton } from './onboarding/HowToPlay';

export const TABS = [
  { id: 'Hero', label: 'Hero', Component: HeroTab },
  { id: 'Inventory', label: 'Inventory', Component: InventoryTab },
  { id: 'Boss', label: 'Boss', Component: BossTab },
  { id: 'Forge', label: 'Forge', Component: ForgeTab },
  { id: 'Market', label: 'Market', Component: MarketTab },
] as const;
export type TabName = (typeof TABS)[number]['id'];

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
  const activeTab = TABS.find(({ id }) => id === currentTab)!;
  const ActiveTab = activeTab.Component;

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
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={currentTab === id}
            aria-controls="tabpanel"
            className="tab"
            onClick={() => setTab(id)}
          >
            {label}
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
          <h2>{activeTab.label}</h2>
          <DemoNote />
          <ActiveTab />
        </div>
      </div>
    </section>
  );
}
