import { useId, useState, type ReactNode } from 'react';
import { scrollBoundaryKey } from './scrollBoundaryKey';
export interface ScreenTab { id: string; label: string; content: ReactNode; lazy?: boolean }
export interface TabsProps { label: string; tabs: readonly ScreenTab[]; initialTab?: string }
/** Accessible tab host with automatic activation and roving keyboard focus. IDs must be unique. */
export function Tabs({ label, tabs, initialTab }: TabsProps) {
  const prefix = useId();
  const [selected, setSelected] = useState(initialTab ?? tabs[0]?.id);
  const active = tabs.some(tab => tab.id === selected) ? selected : tabs[0]?.id;
  return <div className="ui-tabs-host" onKeyDown={scrollBoundaryKey}>
    <div role="tablist" aria-label={label} className="ui-tabs">{tabs.map((tab, index) => <button type="button" key={tab.id}
      id={`${prefix}-tab-${tab.id}`} role="tab" aria-selected={active === tab.id} aria-controls={`${prefix}-panel-${tab.id}`} tabIndex={active === tab.id ? 0 : -1}
      onClick={() => setSelected(tab.id)} onKeyDown={event => {
        const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : offset ? (index + offset + tabs.length) % tabs.length : null;
        if (next === null) return;
        event.preventDefault(); const target = tabs[next]!; setSelected(target.id);
        document.getElementById(`${prefix}-tab-${target.id}`)?.focus();
      }}>{tab.label}</button>)}</div>
    {tabs.map(tab => <div key={tab.id} id={`${prefix}-panel-${tab.id}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${tab.id}`} hidden={active !== tab.id} className="ui-tab-content">{(!tab.lazy || active === tab.id) && tab.content}</div>)}
  </div>;
}
