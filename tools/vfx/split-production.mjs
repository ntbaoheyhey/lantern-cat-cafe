/** Extract the authored key and eight parts without repainting or removing alpha. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{PNG}=require('pngjs');
const [id,revision='production-original']=process.argv.slice(2);
if(!/^[a-z0-9-]+(?::[a-z0-9-]+)*$/.test(id??'')||!/^[a-z0-9-]+$/.test(revision))throw Error('Provide skill ID and source revision');
const dir=resolve('/Users/bao/art/vfx-2026-11-12',id.replaceAll(':','-'));
const source=PNG.sync.read(readFileSync(resolve(dir,revision+'.png')));
// Image tools obey the layout approximately. Split at the actual transparent
// gutters, never at a coordinate that cuts a painted stroke.
const alpha=(x,y)=>source.data[(y*source.width+x)*4+3];
function gutter(axis,low,high,otherLow,otherHigh){
 const counts=[];
 for(let i=low;i<high;i++){
  let count=0;for(let j=otherLow;j<otherHigh;j++)if((axis==='y'?alpha(j,i):alpha(i,j))>16)count++;
  counts.push(count);
 }
 let best=null,start=0;
 for(let i=0;i<=counts.length;i++){
  if(i<counts.length&&counts[i]===0)continue;
  if(i-start>=4&&(!best||i-start>best.length))best={at:low+Math.floor((start+i)/2),length:i-start};
  start=i+1;
 }
 if(!best)throw Error('No clean separator: inspect or repair the production sheet');
 return best.at;
}
const middle=gutter('y',Math.floor(source.height*.42),Math.ceil(source.height*.60),0,source.width);
const second=gutter('y',Math.floor(source.height*.70),Math.ceil(source.height*.83),0,source.width);
function save(name,result){
 const file=resolve(dir,name),bytes=PNG.sync.write(result);
 if(existsSync(file)&&!readFileSync(file).equals(bytes))throw Error('Preserve existing extraction: '+file);
 writeFileSync(file,bytes);
}
const key=new PNG({width:source.width,height:middle});PNG.bitblt(source,key,0,0,source.width,middle,0,0);save('key-original.png',key);
const cells=[];
for(let row=0;row<2;row++){
 const top=row?second:middle,bottom=row?source.height:second,bounds=[0];
 for(let col=1;col<4;col++)bounds.push(gutter('x',Math.floor(source.width*(col/4-.055)),Math.ceil(source.width*(col/4+.055)),top,bottom));
 bounds.push(source.width);
 for(let col=0;col<4;col++){
  const width=bounds[col+1]-bounds[col],height=bottom-top;
  cells.push({col,row,left:bounds[col],top,width,height});
 }
}
const cell=Math.max(...cells.flatMap(c=>[c.width,c.height])),sheet=new PNG({width:cell*4,height:cell*2});
for(const c of cells)PNG.bitblt(source,sheet,c.left,c.top,c.width,c.height,c.col*cell+Math.floor((cell-c.width)/2),c.row*cell+Math.floor((cell-c.height)/2));
save('layers-clean.png',sheet);
console.log(id,source.width+'×'+source.height,'retained source alpha; detected row gutters',middle,second);
