export type IconName = 'cats' | 'team' | 'bag' | 'recruit' | 'events' | 'fight' | 'menu' | 'close' | 'relic' | 'chest';
const paths: Record<IconName,string> = {
 cats:'M5 11 4 3l6 4h4l6-4-1 8a8 8 0 1 1-14 0M8 13h.1M16 13h.1M10 17l2 1 2-1',
 team:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3a6 6 0 0 1 12 0v3M17 4a4 4 0 0 1 0 8m0 3a5 5 0 0 1 5 5v1',
 bag:'M4 8h16l1 13H3L4 8Zm4 0V6a4 4 0 0 1 8 0v2M9 13h6',
 recruit:'M2 5h20v15H2V5Zm0 1 10 8L22 6M2 20l7-7m6 0 7 7',
 events:'M5 3h14v19H5V3Zm4 5h6m-6 5h6m-6 5h3',
 fight:'m4 3 16 17M3 4l3-1 9 9-3 3L3 6V4Zm17-1L4 20m15-5 3 3M2 18l3-3',
 menu:'M4 6h16M4 12h16M4 18h16',close:'m6 6 12 12M18 6 6 18',
 relic:'m12 2 9 10-9 10L3 12 9 2Zm-9 10h18M12 2l4 10-4 10-4-10 4-10Z',
 chest:'M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v11H3V10Zm0 3h18M10 11h4v5h-4v-5Z',
};
export function Icon({name}:{name:IconName}) {return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>}
