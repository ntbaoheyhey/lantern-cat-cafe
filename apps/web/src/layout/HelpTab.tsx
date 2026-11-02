import { isValidElement, useId, useState, type ReactNode } from 'react';
import { PixelIcon } from '../art/pixelIcons';
import { STEPS } from '../onboarding/HowToPlay';
import { isGameV2 } from './flag';
import { EmptyState, Tabs, type ScreenTab } from '../ui';
import { helpTopics } from './HelpTab.content';
import './HelpTab.css';

const textBlocks = new Set(['h3', 'p', 'li', 'dt', 'dd']);
function searchable(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(searchable).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    const text = searchable(node.props.children);
    return typeof node.type === 'string' && textBlocks.has(node.type) ? `${text} ` : text;
  }
  return '';
}
const normalized = (text: string) => text.replace(/\s+/g, ' ').trim().toLocaleLowerCase();

function Guide() {
  const id = useId();
  const [query, setQuery] = useState('');
  const [selected, select] = useState('getting-started');
  const topics = helpTopics();
  const matches = topics.filter(topic => normalized(searchable(topic.content)).includes(normalized(query)));
  const active = matches.find(topic => topic.id === selected) ?? matches[0];
  return <div className="help-v2-container">
    <header className="help-panel-header"><div className="help-panel-title">Cat Café Guide</div>
      <p className="help-panel-desc">Learn how Mochi explores, levels up, and finds treasures while you work.</p></header>
    <div className="help-columns"><aside className="help-topic-list" aria-label="Help topics">
      <label htmlFor={`${id}-search`}>Search help</label>
      <input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search help" />
      <div className="help-topic-count" role="status">{matches.length} topics</div>
      {matches.map(topic => <button type="button" key={topic.id} aria-current={active?.id === topic.id ? 'true' : undefined}
        aria-controls={`${id}-${topic.id}`} onClick={() => select(topic.id)}>{topic.title}<span aria-hidden="true">›</span></button>)}
    </aside><div className="help-answer">
      {topics.map(topic => <section key={topic.id} id={`${id}-${topic.id}`} className="help-v2-section" hidden={active?.id !== topic.id}>{topic.content}</section>)}
      {!active && <EmptyState title="No matching topics" action={{ label: 'Clear search', onAction: () => setQuery('') }}>Try a class, material or activity name.</EmptyState>}
      <div className="help-v2-action"><button type="button" className="pixel-btn help-v2-btn" onClick={() => {
        const stage = document.querySelector<HTMLElement>('.v2-stage');
        if (stage) { window.location.hash = 'home'; stage.tabIndex = -1; stage.focus(); }
      }}>Start Exploring</button></div>
    </div></div>
  </div>;
}

export interface HelpTabProps { additionalTabs?: readonly ScreenTab[] }
export function HelpTab({ additionalTabs = [] }: HelpTabProps = {}) {
  if (!isGameV2()) {
    return (
      <ol className="help-steps">
        {STEPS.map((step, i) => (
          <li key={step.icon} className="help-step-item">
            <div className="help-step-lead">
              <span className="help-step-badge" aria-hidden="true">
                {i + 1}
              </span>
              <span className="help-step-icon" aria-hidden="true">
                <PixelIcon name={step.icon} size={3} />
              </span>
            </div>
            <div className="help-step-text">{step.text}</div>
          </li>
        ))}
      </ol>
    );
  }

  return <Tabs label="Help sections" tabs={[{ id: 'guide', label: 'Guide', content: <Guide /> }, ...additionalTabs]} />;
}
