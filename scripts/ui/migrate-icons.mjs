// One-time, syntax-aware migration of legacy presentation glyphs.
// Leaves Session A's battle views and all game rules untouched.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const names={'♧':'events','◇':'bag','✉':'invitations','◈':'wallet','⌁':'thread','♜':'team','⚙':'settings','♩':'sound','♫':'sound','✦':'season','✧':'season','▣':'bag','◉':'wallet','▶':'fight','◀':'arrow-left','✓':'check','○':'circle','☑':'check','☐':'circle','▲':'avax','★':'season','◆':'relic','♟':'team','☾':'moon','☀':'season','⚡':'power','♥':'heart','🔒':'lock','↻':'refresh','↺':'refresh','↗':'external','→':'arrow','←':'arrow-left','⇧':'upload','⇢':'arrow','↪':'arrow','↓':'download','↑':'upgrade','⚔':'fight','🧶':'yarn','🎟':'key','☕':'home','♨':'potion','♛':'boss','◷':'clock','◒':'fish','❖':'boss-seal','☯':'relic','↟':'tower','🛡':'shield','⚒':'forge','⚠':'warning','↩':'arrow-left','🔥':'burn','↔':'swap','∞':'bonds'};
const words={'✓':'Done','○':'Pending','☑':'Selected','☐':'All','▲':'AVAX','★':'Star ','⚡':'Power','♥':'HP','🔒':'Locked','→':'to','←':'from','↑':'Level','↓':'Collect','⚔':'ATK','🛡':'DEF','🧶':'YARN','◷':'Time','♛':'Boss','↻':'Refresh'};
const has=s=>[...s].some(c=>names[c]);
function plain(s){
 // Prose keeps its label; a glyph-only control receives a readable label.
 const remainder=[...s].filter(c=>!names[c]&&c!=='\ufe0f').join('');
 if(remainder.trim())return [...s].map(c=>c==='→'?'to':c==='←'?'from':names[c]?'':c==='\ufe0f'?'':c).join('').replace(/ {2,}/g,' ');
 return [...s].map(c=>names[c]?(words[c]??names[c].replaceAll('-',' ')):c==='\ufe0f'?'':c).join(' ');
}
const protectedFiles=new Set(['BattleHudV3.tsx','BattleLogV3.tsx','AutoNextA6.tsx','CatPreviewA6.tsx','Battle.tsx']);
let changed=0;
for(const dir of ['ui-v3','shell','chain','depth'])for(const name of readdirSync(resolve(root,'apps/web/src/game/cardrpg',dir))){
 if(!name.endsWith('.tsx')||name.includes('.test.')||protectedFiles.has(name))continue;
 const file=resolve(root,'apps/web/src/game/cardrpg',dir,name),source=readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 let addedIcon=false;
 function visit(node){
  const start=node.getStart(ast),end=node.end,raw=source.slice(start,end);
  if(ts.isJsxText(node)&&(has(raw)||raw.trim()==='×')){
   const content=raw.trim()==='×'?'<GameIcon name="close" size={20}/>':[...raw].map(c=>names[c]?`<GameIcon name="${names[c]}" size={18}/>`:c==='\ufe0f'?'':c).join('');
   edits.push({start,end,text:content});addedIcon=true;return;
  }
  if((ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node))&&has(raw)){
   const text=raw[0]+plain(raw.slice(1,-1))+raw.at(-1);
   edits.push({start,end,text});return;
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);if(!edits.length)continue;
 let next=source;for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);
 if(addedIcon&&!/import\s*\{[^}]*\bGameIcon\b[^}]*\}\s*from/.test(next))next="import {GameIcon} from '../../../ui/GameIcon';\n"+next;
 writeFileSync(file,next);changed++;
}
console.log(`Migrated ${changed} non-battle components. Inspect labels and run the UI gates.`);
