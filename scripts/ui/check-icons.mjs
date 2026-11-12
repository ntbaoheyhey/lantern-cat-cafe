import {readdirSync,statSync,readFileSync} from 'node:fs';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),icons=resolve(root,'apps/web/public/icons');const bytes=readdirSync(icons).reduce((n,f)=>n+statSync(resolve(icons,f)).size,0);
const dirs=['apps/web/src/game/cardrpg/shell-v3','apps/web/src/ui/GameIcon.tsx'];let glyphs=[];function walk(p){return statSync(p).isDirectory()?readdirSync(p).flatMap(f=>walk(resolve(p,f))):[p];}
for(const file of dirs.flatMap(d=>walk(resolve(root,d))).filter(f=>/\.(tsx|ts|css)$/.test(f)))if(/[♧◇✉◈⌁♜⚙♩♫✦▣◉▶]/u.test(readFileSync(file,'utf8')))glyphs.push(file.replace(root+'/',''));
console.log(JSON.stringify({bytes,glyphs,scope:'V3 shell and icon component; legacy glyph inventory reported separately'},null,2));process.exitCode=bytes>3*1024*1024||glyphs.length?1:0;
