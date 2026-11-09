/** URL registry in the lazy 3D route. GLBs load only after visual opt-in. */
const files = import.meta.glob('../../../../../../assets/cardrpg-look/game-models/*.glb', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
export const lookModelSources = Object.fromEntries(Object.entries(files).map(([path, url]) => [
  path.split('/').at(-1)!.replace(/\.glb$/, ''), url,
]));
