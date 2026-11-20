/** Source identifiers only: no environment files, values, remote access or secret-store reads. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),attempt=process.argv[2],phase=process.argv[3];assert(/^\d+$/.test(attempt)&&['before','after'].includes(phase));
const output=resolve(root,`reports/v4-ship/S11/qa-prerequisites-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const bookPath='reports/v4-ship/USER-DEPLOY-VI.md',book=readFileSync(resolve(root,bookPath),'utf8');
const files=['_shared/auth.ts','_shared/game-server.ts','_shared/v2/server.ts','guest-drip/index.ts','chain-economy-v3/index.ts','chain-items/index.ts','chain-judge/index.ts'].map(p=>'supabase/functions/'+p);
const inputs=files.map(path=>({path,text:readFileSync(resolve(root,path),'utf8')})),lexical=[],ast=[],fallbacks=[];
const locate=(text,index)=>text.slice(0,index).split('\n').length,started=performance.now();
for(const {path,text} of inputs)for(const match of text.matchAll(/\b(?:Deno\.env\.get|env)\(\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\)/g))lexical.push({path,line:locate(text,match.index),name:match[1]});
const lexicalMs=performance.now()-started,parsed=performance.now();
for(const {path,text} of inputs){
 const source=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true);
 const envName=node=>ts.isCallExpression(node)&&['Deno.env.get','env'].includes(node.expression.getText(source))&&node.arguments.length===1&&ts.isStringLiteral(node.arguments[0])&&/^[A-Z][A-Z0-9_]*$/.test(node.arguments[0].text)?node.arguments[0].text:null;
 const terms=node=>ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.BarBarToken?[...terms(node.left),...terms(node.right)]:envName(node)?[envName(node)]:ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='jwtSecret'?['jwtSecret()']:[];
 function visit(node){
  const name=envName(node);if(name)ast.push({path,line:source.getLineAndCharacterOfPosition(node.getStart()).line+1,name});
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.BarBarToken&&!(ts.isBinaryExpression(node.parent)&&node.parent.operatorToken.kind===ts.SyntaxKind.BarBarToken)){
   const names=terms(node);if(names.length>1)fallbacks.push({path,line:source.getLineAndCharacterOfPosition(node.getStart()).line+1,names});
  }ts.forEachChild(node,visit);
 }visit(source);
}
const astMs=performance.now()-parsed,key=r=>`${r.path}:${r.line}:${r.name}`,sort=rows=>rows.map(key).sort();assert.deepEqual(sort(lexical),sort(ast));
const qaNames=['AUTH_JWT_SECRET','VOUCHER_SIGNER_PRIVATE_KEY','SPONSOR_PRIVATE_KEY','GAME_SEED_SECRET'];
const extra=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_JWT_SECRET','SIWE_DOMAIN','SIWE_ALLOWED_ORIGIN'];
const names=[...qaNames,...extra].map(name=>({name,sourceLocations:ast.filter(r=>r.name===name).map(r=>`${r.path}:${r.line}`),namedInRunbook:new RegExp('\\b'+name+'\\b').test(book),tableRows:book.split('\n').filter(l=>l.startsWith('|')&&l.includes('`'+name+'`')).length}));assert(names.every(n=>n.sourceLocations.length));
assert(fallbacks.some(r=>r.names.join(',')==='SUPABASE_JWT_SECRET,AUTH_JWT_SECRET'));
assert(fallbacks.some(r=>r.names.join(',')==='SPONSOR_PRIVATE_KEY,VOUCHER_SIGNER_PRIVATE_KEY'));
assert.equal(fallbacks.filter(r=>r.names.join(',')==='GAME_SEED_SECRET,jwtSecret()').length,2);
const links=[...book.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]).filter(p=>!/^https?:/.test(p)&&!p.startsWith('#')).map(path=>({path,exists:existsSync(resolve(root,'reports/v4-ship',path.split('#')[0]))}));
const qaNamed=names.filter(n=>qaNames.includes(n.name)&&n.namedInRunbook).length;
const checks={methodsAgree:true,exactFallbacksVerified:true,qaNames:qaNamed,allNinePrerequisitesInTable:names.every(n=>n.tableRows>0),allLocalLinksResolve:links.every(l=>l.exists),classified:phase==='before'?false:['Nền tảng cung cấp','Bắt buộc','Tùy chọn'].every(t=>book.includes(t))};
const pass=phase==='before'?qaNamed===0:qaNamed===4&&checks.allNinePrerequisitesInTable&&checks.allLocalLinksResolve&&checks.classified;
writeFileSync(output,JSON.stringify({at:new Date().toISOString(),phase,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),qaFinding:'QA-1',harness:signed(relative(root,import.meta.filename)),book:signed(bookPath),inputs:files.map(signed),comparison:{files:files.length,lexical:{calls:lexical.length,milliseconds:lexicalMs},ast:{calls:ast.length,milliseconds:astMs},identicalLocations:true},names,fallbacks,links,checks,pass,scope:'Static source and runbook only. Before pass means the four missing names were reproduced; after pass does not verify hosted settings or independent QA closure.'},null,2)+'\n');
console.log(JSON.stringify({output:relative(root,output),phase,pass,comparison:{lexicalCalls:lexical.length,astCalls:ast.length,lexicalMs,astMs},checks}));if(!pass)process.exitCode=1;
