/** Opening a panel must not eagerly import its wallet and trading implementation. */
export type Tab='Judge'|'Market'|'Bag'|'Seal'|'History'|'Style'|'Forge'|'Campaign'|'Café';
export function openChainRoom(tab:Tab='Judge'){
 window.dispatchEvent(new CustomEvent('chain:open',{detail:tab}));
}
