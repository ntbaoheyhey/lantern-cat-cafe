import type { StatusId } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';

export type VisualStatusId = StatusId | 'snag' | 'bitter';
export interface StatusIdentity {
  name: string; subtitle: string; color: string; order: 0 | 1 | 2; path: string;
}
/** Original 16px line drawings, authored on a 24-unit grid; no imported artwork. */
export const STATUS_IDENTITIES = {
  scald: { name:'Burn', subtitle:'Scald', color:'#efaa73', order:0, path:'M12 2C14 8 20 9 19 15A7 7 0 0 1 5 15C5 11 8 9 9 7C9 12 13 12 12 2ZM12 14L10 18L14 18Z' },
  snag: { name:'Bleed', subtitle:'Snag', color:'#d9616b', order:0, path:'M4 3L15 17M10 2L21 16M3 12L14 4M9 20L20 12M6 16C2 20 4 23 6 23C9 23 10 20 6 16Z' },
  bitter: { name:'Bitter', subtitle:'Bitter tea', color:'#8d7aa6', order:0, path:'M4 12H17V17Q16 22 11 22Q5 22 4 17ZM17 13H21V17H17M7 2Q3 5 8 8M13 2Q9 5 14 8M3 22L21 3' },
  scent: { name:'Mark', subtitle:'Scented', color:'#f4db95', order:0, path:'M5 8H16V12A5 5 0 0 1 6 12ZM16 9H19V13H16M3 19Q12 22 21 19M9 3V5M13 2V5' },
  brittle: { name:'Shred', subtitle:'Brittle sugar', color:'#9fd3e0', order:0, path:'M12 2L21 6L19 15L12 22L5 15L3 6ZM13 3L10 9L14 12L9 17L12 22M14 12L19 11' },
  tangle: { name:'Shred', subtitle:'Tangle', color:'#9fd3e0', order:0, path:'M4 5L11 3L20 6L18 17L12 21L5 17ZM13 4L9 10L15 13L11 20M4 11Q10 7 17 17' },
  drowsy: { name:'Daze', subtitle:'Drowsy', color:'#c19ada', order:0, path:'M4 16A4 4 0 0 1 2 9A6 6 0 0 1 13 7A5 5 0 0 1 18 16ZM17 2L18 5L21 6L18 7L17 10L16 7L13 6L16 5M7 10H11L7 13H11' },
  hush: { name:'Daze', subtitle:'Hush', color:'#c19ada', order:0, path:'M4 17A4 4 0 0 1 3 9A6 6 0 0 1 14 7A5 5 0 0 1 20 17ZM8 12H15M19 2L20 4L22 5L20 6L19 8' },
  rattled: { name:'Daze', subtitle:'Rattled', color:'#c19ada', order:0, path:'M4 17A4 4 0 0 1 3 9A6 6 0 0 1 14 7A5 5 0 0 1 20 17ZM7 11L9 13L11 11L13 13L15 11M18 2L16 5L20 5L18 8' },
  steep: { name:'Regen', subtitle:'Steep', color:'#a3dba3', order:1, path:'M5 18C1 10 9 3 19 3C21 13 14 21 5 18ZM5 18L16 6M10 13V8M10 13H16M3 22L5 18' },
  cozy: { name:'Warm', subtitle:'Cozy', color:'#efbc73', order:1, path:'M12 2L21 6L19 15L12 22L5 15L3 6ZM6 10L9 13L12 10L15 13L18 10M8 15L12 18L16 15' },
  crumb: { name:'Crumb', subtitle:'Crumb trail', color:'#e6c392', order:2, path:'M3 5L9 3L11 8L6 11L2 9ZM14 12L20 10L22 16L18 21L12 18ZM14 3L17 4L16 7ZM4 17L7 16L8 20L5 22Z' },
  riposte: { name:'Riposte', subtitle:'Saucer riposte', color:'#efbc73', order:2, path:'M3 15Q12 22 21 15M5 12Q12 17 19 12M5 8C9 2 17 3 20 8M16 8H20V4M7 19L4 22' },
  link: { name:'Link', subtitle:'Apron link', color:'#9fd3e0', order:2, path:'M10 8L7 5C2 2 0 9 4 12L7 15M14 16L17 19C22 22 24 15 20 12L17 9M7 8L17 16M9 3L12 6M12 18L15 21' },
  sprout: { name:'Sprout', subtitle:'Second sprout', color:'#a3dba3', order:2, path:'M12 22V10M12 15C3 16 2 9 3 5C10 5 13 10 12 15ZM12 11C12 3 18 1 22 2C22 8 18 12 12 11M7 22H17' },
  decoy: { name:'Decoy', subtitle:'Yarn decoy', color:'#e6c392', order:2, path:'M4 10L3 3L9 7L15 7L21 3L20 10C24 22 0 24 4 10ZM5 13L19 17M6 18L18 11M9 9L12 21' },
  glaze: { name:'Glaze', subtitle:'Glaze', color:'#b7e1df', order:2, path:'M12 2C9 7 5 11 5 15A7 7 0 0 0 19 15C19 11 15 7 12 2ZM8 15Q8 19 12 19M18 3L19 6L22 7L19 8L18 11' },
  shelter: { name:'Shelter', subtitle:'Shelter', color:'#f4db95', order:2, path:'M2 11L12 2L22 11M5 10V21H19V10M9 21V14H15V21M8 7H16' },
} satisfies Record<VisualStatusId, StatusIdentity>;

export const statusIdentity = (id: string): StatusIdentity | undefined => STATUS_IDENTITIES[id as VisualStatusId];
