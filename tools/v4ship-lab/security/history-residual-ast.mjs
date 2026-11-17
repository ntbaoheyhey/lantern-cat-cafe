/** Parse immutable source; emit provenance/booleans, never candidate values. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const ts=require('typescript'),oid=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const bytes=(commit,path)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:root,maxBuffer:30000000});
const parse=(path,data)=>{const source=ts.createSourceFile(path,data.toString(),ts.ScriptTarget.Latest,true);assert.equal(source.parseDiagnostics.length,0);return source;};
const unwrap=n=>(ts.isAsExpression(n)||ts.isSatisfiesExpression(n)||ts.isParenthesizedExpression(n))?unwrap(n.expression):n;
const propertyName=n=>ts.isIdentifier(n)||ts.isStringLiteral(n)||ts.isNumericLiteral(n)?n.text:null;
function declarations(source,name){const found=[];function visit(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text===name&&n.initializer)found.push(n);ts.forEachChild(n,visit);}visit(source);return found;}

function inventory(request){
 const data=bytes(request.commit,request.path);assert.equal(oid(data),request.oid);const document=JSON.parse(data);
 const sourceCommit=request.sourceCommit??request.commit;assert.equal(oid(bytes(sourceCommit,request.path)),request.oid);
 const producerPath='scripts/v3b2/inventory-economy.mjs',producer=bytes(sourceCommit,producerPath),producerAst=parse(producerPath,producer);
 const inputs=declarations(producerAst,'inputs');assert.equal(inputs.length,1);const array=inputs[0].initializer;assert(ts.isArrayLiteralExpression(array));
 const bindings=array.elements.map(e=>{assert(ts.isArrayLiteralExpression(e)&&ts.isStringLiteral(e.elements[0])&&ts.isStringLiteral(e.elements[1]));return {path:e.elements[0].text,name:e.elements[1].text};});
 const sources=new Map();for(const b of bindings){const data=bytes(sourceCommit,b.path);sources.set(b.path,{data,source:parse(b.path,data),oid:oid(data),binding:b.name});}
 function check(row){
  const entry=sources.get(row.path);if(!entry)return false;
  const keys=row.key.split('.');if(keys.shift()!==entry.binding)return false;
  const decl=declarations(entry.source,entry.binding);if(decl.length!==1)return false;
  let node=unwrap(decl[0].initializer);
  for(const key of keys){if(!ts.isObjectLiteralExpression(node))return false;const properties=node.properties.filter(p=>ts.isPropertyAssignment(p)&&propertyName(p.name)===key);if(properties.length!==1)return false;node=unwrap(properties[0].initializer);}
  return !ts.isObjectLiteralExpression(node)&&entry.source.getLineAndCharacterOfPosition(node.getStart(entry.source)).line+1===row.line&&node.getText(entry.source)===row.valueExpression;
 }
 const selected=request.indices.map(i=>({index:i,row:document.rows[i]}));assert.equal(new Set(request.indices).size,selected.length);
 let started=performance.now();const weak=selected.map(({row})=>sources.has(row.path)&&row.line>=1&&row.line<=sources.get(row.path).data.toString().split('\n').length);const weakMs=performance.now()-started;
 started=performance.now();const exact=selected.map(({row})=>check(row));const exactMs=performance.now()-started;
 if(!exact.every(Boolean))process.stderr.write(JSON.stringify({phase:'inventory',selected:selected.length,astAccepted:exact.filter(Boolean).length,rejectedIndices:selected.filter((_,i)=>!exact[i]).map(r=>r.index)})+'\n');
 assert(exact.every(Boolean));const sample=selected[0].row;
 const controls=[['changed-property-same-line',{...sample,key:sample.key+'.missing'}],['changed-line',{...sample,line:sample.line+1}],['changed-value-expression',{...sample,valueExpression:sample.valueExpression+' '}],['wrong-source-file',{...sample,path:producerPath}]];
 for(const [,row] of controls)assert.equal(check(row),false);
 return {pass:true,kind:'inventory',compilerVersion:ts.version,compilerPath:require.resolve('typescript'),producer:{commit:sourceCommit,path:producerPath,oid:oid(producer)},sameInventoryAtSourceCommit:true,
  rows:selected.map(({index,row})=>({index,commit:sourceCommit,path:row.path,line:row.line,sourceOid:sources.get(row.path).oid,exactPropertyPath:true,exactInitializer:true})),
  comparison:{entries:selected.length,lineOnly:{matched:weak.filter(Boolean).length,milliseconds:weakMs},ast:{matched:exact.filter(Boolean).length,milliseconds:exactMs},changedPropertyLineOnlyAccepted:true,changedPropertyAstAccepted:false},
  controls:controls.map(([name])=>({name,rejected:true}))};
}

function predicates(request){
 const data=bytes(request.commit,request.path);assert.equal(oid(data),request.oid);const source=parse(request.path,data);
 const implementationPath=request.path.replace('.test.ts','.ts'),implementation=bytes(request.commit,implementationPath),impl=parse(implementationPath,implementation);
 const members=new Set();function member(n){if((ts.isPropertySignature(n)||ts.isPropertyAssignment(n))&&n.name)members.add(propertyName(n.name));ts.forEachChild(n,member);}member(impl);
 const byteAt=index=>Buffer.byteLength(source.text.slice(0,index));
 function check(capture,text=source.text){
  const ast=text===source.text?source:parse('control.ts',Buffer.from(text));let matched=0;
  function visit(n){
   if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken&&ts.isPropertyAccessExpression(n.left)&&ts.isIdentifier(n.left.expression)&&ts.isStringLiteral(n.right)){
    const a=Buffer.byteLength(text.slice(0,n.left.getStart(ast))),b=Buffer.byteLength(text.slice(0,n.operatorToken.end));
    if(a===capture.ScalarStart&&b===capture.ScalarEnd&&members.has(n.left.name.text)&&ts.isArrowFunction(n.parent)&&n.parent.parameters.length===1&&n.parent.parameters[0].name.getText(ast)===n.left.expression.text){
     const call=n.parent.parent;if(ts.isCallExpression(call)&&ts.isPropertyAccessExpression(call.expression)&&call.expression.name.text==='find')matched++;
    }
   }ts.forEachChild(n,visit);
  }visit(ast);return matched===1;
 }
 const rows=request.captures.map(c=>{assert(c.ExactBytes&&check(c));return {line:c.StartLine,scalarStart:c.ScalarStart,scalarEnd:c.ScalarEnd,propertyAccessAndEquality:true,declaredTimelineMember:true,predicateParameterBound:true};});
 const c=request.captures[0],quoted=JSON.stringify(data.subarray(c.ScalarStart,c.ScalarEnd).toString());
 assert.equal(check({...c,ScalarStart:1,ScalarEnd:Buffer.byteLength(quoted)-1},quoted+';'),false);
 assert.equal(check({...c,ScalarStart:c.ScalarStart+1}),false);
 return {pass:true,kind:'predicates',compilerVersion:ts.version,compilerPath:require.resolve('typescript'),rows,
  implementation:{commit:request.commit,path:implementationPath,oid:oid(implementation)},controls:[{name:'code-substituted-with-string',rejected:true},{name:'shifted-code-position',rejected:true}]};
}

try{const request=JSON.parse(readFileSync(0,'utf8'));assert.equal(ts.version,'5.9.3');const result=request.kind==='inventory'?inventory(request):predicates(request);process.stdout.write(JSON.stringify(result)+'\n');}
catch{process.stderr.write('Residual AST review failed; details suppressed\n');process.exitCode=1;}
