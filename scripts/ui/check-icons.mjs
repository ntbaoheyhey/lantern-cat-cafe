import {readdirSync,statSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),icons=resolve(root,'apps/web/public/icons');
const bytes=readdirSync(icons).reduce((n,f)=>n+statSync(resolve(icons,f)).size,0);
// Session A owns the battle UI. It uses the shared asset contract independently.
const protectedFiles=new Set(['BattleHudV3.tsx','BattleLogV3.tsx','AutoNextA6.tsx','CatPreviewA6.tsx','Battle.tsx','battle-log-copy.ts']);
const glyph=/[♧◇✉◈⌁♜⚙♩♫✦✧▣◉▶◀✓○☑☐▲★◆♟☾☀⚡♥🔒↻↺↗→←⇧⇢↪↓↑⚔🧶🎟☕♨♛◷◒❖☯↟🛡⚒⚠↩🔥↔∞⌂▤▧☆☝]/u;
const glyphs=[];
for(const dir of ['ui-v3','shell','chain','depth'])for(const name of readdirSync(resolve(root,'apps/web/src/game/cardrpg',dir))){
 if(!/\.(tsx|ts|css)$/.test(name)||name.includes('.test.')||protectedFiles.has(name))continue;
 const file=resolve(root,'apps/web/src/game/cardrpg',dir,name);
 if(glyph.test(readFileSync(file,'utf8')))glyphs.push(file.replace(root+'/',''));
}
console.log(JSON.stringify({bytes,glyphs,scope:'All non-battle card-RPG screens, including retained legacy depth pages; Session A battle files excluded'},null,2));
process.exitCode=bytes>3*1024*1024||glyphs.length?1:0;
