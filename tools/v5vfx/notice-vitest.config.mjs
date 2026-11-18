import config from './battle-context-vitest.config.mjs';
export default {...config,test:{...config.test,include:[...config.test.include,
 'src/game/cardrpg/depth/battle-scene-loader.test.tsx',
 'src/game/cardrpg/battle-v3/controls.test.ts',
]}};
