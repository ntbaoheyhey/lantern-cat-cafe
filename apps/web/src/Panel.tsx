import { useState } from 'react';

export const TABS = ['Hero', 'Inventory', 'Boss', 'Forge', 'Market'] as const;
export type TabName = (typeof TABS)[number];

export function Panel({ id }: { id: string }) {
  const [tab, setTab] = useState<TabName>('Hero');
  return (
    <section id={id} className="panel" aria-label="Game panel">
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
      </div>
      <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${tab}`} className="tabpanel">
        <h2>{tab}</h2>
        <p>Coming soon.</p>
      </div>
    </section>
  );
}
