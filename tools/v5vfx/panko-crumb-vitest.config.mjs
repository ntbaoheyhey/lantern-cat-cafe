import {resolve} from 'node:path';
export default {root:resolve(import.meta.dirname,'../..'),envDir:false,test:{environment:'jsdom',include:[
 'apps/web/src/game/cardrpg/vfx-layered/skill-timeline.test.ts',
 'apps/web/src/game/cardrpg/vfx-layered/skill-player.test.ts',
 'apps/web/src/game/cardrpg/vfx-layered/enemy-skill-timelines.test.ts',
 'apps/web/src/game/cardrpg/spine/v5-texture-loader.test.ts',
]}};
