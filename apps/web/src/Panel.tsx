import { useState } from 'react';
import { BossTab } from './boss/BossTab';
import { ForgeTab } from './forge/ForgeTab';
import { DemoNote } from './game/DemoNote';
import { HeroTab } from './HeroTab';
import { InventoryTab } from './inventory/InventoryTab';
import { MarketTab } from './market/MarketTab';
import { HelpButton } from './onboarding/HowToPlay';
import { NextStepHint } from './onboarding/NextStepHint';

export const TABS = ['Hero', 'Inventory', 'Boss', 'Forge', 'Market'] as const;
export type TabName = (typeof TABS)[number];

export function Panel({ id }: { id: string }) {
  const [tab, setTab] = useState<TabName>('Hero');
  return (
    <section id={id} className="panel" aria-label="Game panel">
      <NextStepHint onGo={setTab} />
      <div role="tablist" aria-label="Game panel tabs" className="tabs">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            id={`tab-${name}`}
            aria-selected={tab === name}
            aria-controls="tabpanel"
            className="tab"
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
        <HelpButton />
      </div>
      <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${tab}`} className="tabpanel">
        <h2>{tab}</h2>
        <DemoNote />
        {tab === 'Hero' ? <HeroTab /> : tab === 'Inventory' ? <InventoryTab /> : tab === 'Boss' ? <BossTab /> : tab === 'Forge' ? <ForgeTab /> : <MarketTab />}
      </div>
    </section>
  );
}
