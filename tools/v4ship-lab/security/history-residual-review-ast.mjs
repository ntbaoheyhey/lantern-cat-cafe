/** Independent tree enumeration and lexical classification; no source values emitted. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const oid=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const get=(commit,path)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:root,maxBuffer:30000000});
const parse=(path,data)=>{const source=ts.createSourceFile(path,data.toString(),ts.ScriptTarget.Latest,true);assert.equal(source.parseDiagnostics.length,0);return source;};
function lex(data){const text=data.toString(),scanner=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,text),tokens=[];for(let kind=scanner.scan();kind!==ts.SyntaxKind.EndOfFileToken;kind=scanner.scan())tokens.push({kind,start:Buffer.byteLength(text.slice(0,scanner.getTokenPos())),end:Buffer.byteLength(text.slice(0,scanner.getTextPos())),text:scanner.getTokenText()});return tokens;}
function inventory(request){
 const {proofs,ast}=request;const sourceCommit=ast.producer.commit;
 const data=get(sourceCommit,proofs[0].mapping.path);assert.equal(oid(data),proofs[0].oid);const document=JSON.parse(data);
 assert.equal(oid(get(sourceCommit,ast.producer.path)),ast.producer.oid);
 const groups=new Map();for(const proof of proofs){const row=document.rows[proof.jsonPath[1]],rootName=row.key.split('.')[0];if(!groups.has(row.path))groups.set(row.path,new Set());groups.get(row.path).add(rootName);}
 let enumerated=0;
 for(const [path,roots] of groups){
  const bytes=get(sourceCommit,path),source=parse(path,bytes),leaves=new Map();
  function walk(node,names){
   while(ts.isAsExpression(node)||ts.isSatisfiesExpression(node)||ts.isParenthesizedExpression(node))node=node.expression;
   if(ts.isObjectLiteralExpression(node)){for(const property of node.properties){if(!ts.isPropertyAssignment(property))continue;assert(ts.isIdentifier(property.name)||ts.isStringLiteral(property.name)||ts.isNumericLiteral(property.name));walk(property.initializer,[...names,property.name.text]);}}
   else {const key=names.join('.');assert(!leaves.has(key));leaves.set(key,{line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1,expression:node.getText(source)});}
  }
  function visit(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&roots.has(node.name.text)){assert(node.initializer);walk(node.initializer,[node.name.text]);}ts.forEachChild(node,visit);}visit(source);
  enumerated+=leaves.size;
  for(const proof of proofs.filter(p=>p.source.path===path)){
   const row=document.rows[proof.jsonPath[1]],actual=leaves.get(row.key);assert(actual);assert.equal(actual.line,row.line);assert.equal(actual.expression,row.valueExpression);assert.equal(proof.source.sourceOid,oid(bytes));assert.equal(proof.source.commit,sourceCommit);
   assert(!leaves.has(row.key+'.missing'));
  }
 }
 return {pass:true,kind:'inventory',verified:proofs.length,enumeratedLeaves:enumerated,method:'Enumerate every source leaf, then join to inventory by independently reconstructed property path.'};
}
function predicates(request){
 const data=get(request.mapping.commit,request.mapping.path);assert.equal(oid(data),request.oid);const tokens=lex(data);
 const result=request.captures.map(c=>{
  const selected=tokens.filter(t=>t.start>=c.ScalarStart&&t.end<=c.ScalarEnd);
  assert.equal(selected[0]?.start,c.ScalarStart);assert.equal(selected.at(-1)?.end,c.ScalarEnd);
  assert.deepEqual(selected.map(t=>t.kind),[ts.SyntaxKind.Identifier,ts.SyntaxKind.DotToken,ts.SyntaxKind.Identifier,ts.SyntaxKind.EqualsEqualsEqualsToken]);
  const quoted=lex(Buffer.from(JSON.stringify(data.subarray(c.ScalarStart,c.ScalarEnd).toString())));assert.equal(quoted.length,1);assert.equal(quoted[0].kind,ts.SyntaxKind.StringLiteral);
  return {line:c.StartLine,lexicalCodeOnly:true};
 });return {pass:true,kind:'predicates',verified:result.length,rows:result};
}
function solidity(request){
 const data=get(request.mapping.commit,request.mapping.path);assert.equal(oid(data),request.oid);const tokens=lex(data),c=request.capture;
 const index=tokens.findIndex(t=>t.start===c.ScalarStart&&t.end===c.ScalarEnd);assert(index>0);assert.equal(tokens[index].kind,ts.SyntaxKind.Identifier);
 assert([ts.SyntaxKind.CommaToken,ts.SyntaxKind.OpenParenToken].includes(tokens[index-1].kind));assert.equal(tokens[index+1].kind,ts.SyntaxKind.Identifier);assert([ts.SyntaxKind.CommaToken,ts.SyntaxKind.CloseParenToken].includes(tokens[index+2].kind));
 const source=get(request.reference.commit,request.reference.path);assert.equal(oid(source),request.reference.oid);const declared=lex(source);
 assert(declared.some((t,i)=>t.text==='contract'&&declared[i+1]?.text===tokens[index].text));
 const quoted=lex(Buffer.from(JSON.stringify(tokens[index].text)));assert.equal(quoted.length,1);assert.equal(quoted[0].kind,ts.SyntaxKind.StringLiteral);
 return {pass:true,kind:'solidity-type',verified:1,exactIdentifierToken:true,typedTuplePosition:true,declarationMatched:true};
}
try{assert.equal(ts.version,'5.9.3');const request=JSON.parse(readFileSync(0,'utf8'));const result=request.kind==='inventory'?inventory(request):request.kind==='predicates'?predicates(request):solidity(request);process.stdout.write(JSON.stringify({...result,compilerVersion:ts.version})+'\n');}
catch{process.stderr.write('Independent AST/lexer review failed; details suppressed\n');process.exitCode=1;}
