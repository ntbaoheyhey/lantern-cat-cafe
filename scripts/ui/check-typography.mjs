import {readdirSync,readFileSync,statSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';

// The faces live centrally; consumers select the existing tokens. LEARN/S11-typography-guard.md.
const central=new Set(['apps/web/src/ui/typography.css','apps/web/src/ui/legacy/typography.css']);
const approved=/^var\(\s*--font-(?:body|display|num|ui|title)\s*(?:,\s*(?:sans-serif|serif|monospace|system-ui))?\s*\)\s*(?:!important)?$/;
export function fontFamilyViolations(source){
 const withoutComments=source.replace(/\/\*[\s\S]*?\*\//g,' ');
 return [...withoutComments.matchAll(/\bfont-family\s*:\s*([^;}]+)/gi)]
  .map(match=>match[1].trim()).filter(value=>!approved.test(value));
}
export function checkTypography(root=resolve(import.meta.dirname,'../..')){
 const errors=[],walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(resolve(p,d.name)):[resolve(p,d.name)]);
 for(const file of walk(resolve(root,'apps/web/src')).filter(f=>/\.(css|tsx|ts)$/.test(f)&&!f.includes('.test.'))){
  const path=relative(root,file).replaceAll('\\','/');
  if(!central.has(path)&&fontFamilyViolations(readFileSync(file,'utf8')).length)errors.push(path);
 }
 const bytes=walk(resolve(root,'apps/web/public/fonts')).filter(f=>f.endsWith('.woff2')).reduce((sum,path)=>sum+statSync(path).size,0);
 if(bytes>400*1024)errors.push('Font payload exceeds 400 KB');
 return {bytes,errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const result=checkTypography();console.log(JSON.stringify(result,null,2));process.exitCode=result.errors.length?1:0;
}
