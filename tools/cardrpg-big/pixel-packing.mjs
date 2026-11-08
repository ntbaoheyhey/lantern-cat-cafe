import assert from 'node:assert/strict';

const digits='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const encode=n=>digits[Math.floor(n/64)]+digits[n%64];
const rle=row=>{
 let out='';
 for(let i=0;i<row.length;){let end=i+1;while(end<row.length&&row[end]===row[i]&&end-i<35)end++;out+=(end-i).toString(36)+row[i];i=end;}
 return out;
};

/** Build encoding only: no source artwork, catalog field or pixel is modified. */
export function packPixels(source){
 const prefix='export const GAMEPLAY_MONSTERS: Readonly<Record<string, MonsterArt>> = ';
 assert(source.includes(prefix),'Unexpected generated art format');
 const data=JSON.parse(source.slice(source.indexOf(prefix)+prefix.length).trim().replace(/;$/,''));
 const rows=new Map(),frames=new Map(),roster={};
 for(const [id,art] of Object.entries(data)){
  roster[id]={...art,frames:{}};
  for(const [name,animation] of Object.entries(art.frames)){
   roster[id].frames[name]=animation.map(frame=>{
    const indices=frame.map(row=>{if(!rows.has(row))rows.set(row,rows.size);return encode(rows.get(row));}).join('');
    if(!frames.has(indices))frames.set(indices,frames.size);
    return encode(frames.get(indices));
   }).join('');
  }
 }
 assert(rows.size<=4096&&frames.size<=4096,'Packing alphabet capacity exceeded');
 const payload={rows:[...rows.keys()].map(rle),frames:[...frames.keys()],roster};
 // Getter decoding is deferred until a monster is actually rendered. The result is cached.
 const code=`const p=${JSON.stringify(payload)},digits=${JSON.stringify(digits)},rowCache=[];
 const ids=s=>{const a=[];for(let i=0;i<s.length;i+=2)a.push(digits.indexOf(s[i])*64+digits.indexOf(s[i+1]));return a;};
 const row=n=>{if(rowCache[n]===undefined){let s='',r=p.rows[n];for(let i=0;i<r.length;i+=2)s+=r[i+1].repeat(parseInt(r[i],36));rowCache[n]=s;}return rowCache[n];};
 for(const art of Object.values(p.roster)){const packed=art.frames;let frames;Object.defineProperty(art,'frames',{enumerable:true,configurable:true,get(){return frames??=Object.fromEntries(Object.entries(packed).map(([name,indices])=>[name,ids(indices).map(i=>ids(p.frames[i]).map(row))]));},set(value){frames=value;}});}
 export const GAMEPLAY_MONSTERS=p.roster;
 `;
 return {code,data,payload};
}

export function pixelPackingPlugin(){
 return {name:'lossless-generated-pixel-packing',enforce:'pre',apply:'build',transform(source,id){
  if(!id.replaceAll('\\','/').endsWith('/apps/web/src/art/monsters/gameplay.generated.ts'))return;
  return {code:packPixels(source).code,map:null};
 }};
}
