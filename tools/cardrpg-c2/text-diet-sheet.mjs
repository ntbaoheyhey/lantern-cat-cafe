import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..');
const after=process.argv.find(v=>v.startsWith('--after='))?.slice(8);
if(!after)throw Error('Pass --after=/absolute/path to verified word-budget screenshots.');
const temporary=resolve(after,'webp');await mkdir(temporary,{recursive:true});
const names=['home','collection','team','inventory','gacha','map','prepare','result'];
const titles={home:'Cafe',collection:'Cats',team:'Team',inventory:'Bag',gacha:'Recruit',map:'Route',prepare:'Prepare',result:'Result'};
const data=async file=>'data:image/webp;base64,'+(await readFile(file)).toString('base64');
const cards=[];
for(const name of names){
 const file=resolve(temporary,name+'.webp');execFileSync('cwebp',['-quiet','-q','84',resolve(after,name+'.png'),'-o',file]);
 const before=await data(resolve(root,'docs/cardrpg-c2/text-before/1280-'+(name==='map'?'map-choose':name)+'.webp'));
 cards.push(`<article id="${name}"><h2>${titles[name]}</h2><div class="pair"><figure><figcaption>Before</figcaption><img src="${before}" alt="${titles[name]} before Lane C2"></figure><figure><figcaption>After</figcaption><img src="${await data(file)}" alt="${titles[name]} after C2"></figure></div></article>`);
}
await writeFile(resolve(root,'docs/cardrpg-c2/text-diet.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C2 · Text diet</title><style>body{margin:0;background:#231c27;color:#f6e7ca;font:16px system-ui}main{max-width:1680px;margin:auto;padding:32px}h1,h2{font-family:Georgia,serif}h1{font-size:44px}p{max-width:85ch;line-height:1.6}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#edc677}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}figcaption{padding:10px 0;color:#ddbf8f}img{width:100%;border-radius:12px}article{padding:20px 0;border-bottom:1px solid #6f5147}@media(max-width:850px){.pair{grid-template-columns:1fr}}</style><main><h1>Less text. More room to play.</h1><p>Eight retained baseline captures beside the C2 four-companion interface. Both use reviewer-unlocked accounts at 1280 × 720; progression and random rewards can differ. Explanations remain in keyboard-accessible “?” dialogs. Battle controls use portraits, rings and icons.</p><nav>${names.map(n=>`<a href="#${n}">${titles[n]}</a>`).join('')}</nav>${cards.join('')}</main></html>`);
console.log('Wrote docs/cardrpg-c2/text-diet.html (eight embedded comparisons).');
