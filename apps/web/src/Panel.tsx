import { useState } from 'react';
import { BossTab } from './boss/BossTab';
import { ForgeTab } from './forge/ForgeTab';
import { DemoNote } from './game/DemoNote';
import { HeroTab } from './HeroTab';
import { InventoryTab } from './inventory/InventoryTab';
import { MarketTab } from './market/MarketTab';
import { HelpButton } from './onboarding/HowToPlay';

export const TABS = ['Hero', 'Inventory', 'Boss', 'Forge', 'Market'] as const;
export type TabName = (typeof TABS)[number];

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

  return (
    <section id={id} className="panel" aria-label="Game panel">
      <div role="tablist" aria-label="Game panel tabs" className="tabs">
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
        <HelpButton />
      </div>
      <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${currentTab}`} className="tabpanel">
        <h2>{currentTab}</h2>
        <DemoNote />
        {currentTab === 'Hero' ? <HeroTab /> : currentTab === 'Inventory' ? <InventoryTab /> : currentTab === 'Boss' ? <BossTab /> : currentTab === 'Forge' ? <ForgeTab /> : <MarketTab />}
      </div>
    </section>
  );
}
