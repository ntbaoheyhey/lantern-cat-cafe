/** Independent candidate CLI/runbook review; no product writes or chain mutations. */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn, execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
const qa='/Users/bao/taskbar-hero-qa', ship='/Users/bao/taskbar-hero-chain';
const relative='tools/chain/check-sponsor-budget.mjs';
const sha=p=>createHash('sha256').update(readFileSync(`${ship}/${p}`)).digest('hex');
const report={at:new Date().toISOString(),committedTarget:execFileSync('git',['rev-parse','HEAD'],{cwd:ship,encoding:'utf8'}).trim(),candidateCommitted:false,
  scope:'Independent CLI and literal cast-output review of uncommitted SHIP candidate. No new runtime or public-chain verdict.',
  hashes:Object.fromEntries([relative,'apps/web/src/game/cardrpg/chain/api.ts','reports/v4-ship/USER-DEPLOY-VI.md'].map(p=>[p,sha(p)])),cases:[]};
async function command(file,args){return await new Promise(resolve=>{
  const child=spawn(file,args,{cwd:ship,stdio:['ignore','pipe','pipe']});let out='',err='';
  child.stdout.on('data',c=>out+=c);child.stderr.on('data',c=>err+=c);
  const timer=setTimeout(()=>child.kill('SIGTERM'),10000);
  child.on('error',e=>{clearTimeout(timer);resolve({code:null,out,err:e.code??'spawn_failed'});});
  child.on('close',code=>{clearTimeout(timer);resolve({code,out:out.trim(),err:err.trim()});});
});}
const base={'balance-wei':'1208400000000000000','pending-wei':'0','gas-price-wei':'25000000000','runs':'1','funded-wallets':'0'};
async function check(name,changes,expected){
  const args={...base,...changes};
  const result=await command(process.execPath,[`${ship}/${relative}`,...Object.entries(args).map(([k,v])=>`--${k}=${v}`)]);
  let actual;try{actual=JSON.parse(result.out);}catch{actual=null;}
  const pass=result.code===expected.exit && Object.entries(expected.fields??{}).every(([k,v])=>actual?.[k]===v);
  report.cases.push({name,args,expected,exit:result.code,actual,error:result.err,pass});
}
await check('reported-low-balance',{'balance-wei':'1075000000000000000'},{exit:1,fields:{budgetPass:false,minimumWei:'1208400000000000000',shortfallWei:'133400000000000000',newWallets:2}});
await check('one-run-exact-boundary',{}, {exit:0,fields:{budgetPass:true,minimumWei:'1208400000000000000',shortfallWei:'0'}});
await check('one-wei-below',{'balance-wei':'1208399999999999999'},{exit:1,fields:{shortfallWei:'1'}});
await check('three-fresh-runs',{'runs':'3','balance-wei':'1425200000000000000'},{exit:0,fields:{newWallets:6,minimumWei:'1425200000000000000'}});
await check('batch-plus-existing-obligations',{'runs':'3','pending-wei':'101050000000000000','balance-wei':'1526250000000000000'},{exit:0,fields:{minimumWei:'1526250000000000000'}});
await check('one-funded-wallet',{'funded-wallets':'1','balance-wei':'1154200000000000000'},{exit:0,fields:{newWallets:1,minimumWei:'1154200000000000000'}});
await check('all-funded-still-preserves-pending',{'funded-wallets':'2','pending-wei':'101050000000000000','balance-wei':'1201050000000000000'},{exit:0,fields:{newWallets:0,minimumWei:'1201050000000000000'}});
await check('gas-ceiling',{'gas-price-wei':'200000000000'},{exit:0,fields:{minimumWei:'1208400000000000000'}});
await check('gas-over-ceiling',{'gas-price-wei':'200000000001'},{exit:2});
await check('zero-gas',{'gas-price-wei':'0'},{exit:2});
await check('negative-pending',{'pending-wei':'-1'},{exit:2});
await check('too-many-funded-wallets',{'funded-wallets':'3'},{exit:2});
await check('fractional-runs',{'runs':'1.5'},{exit:2});
await check('decimal-annotation',{'balance-wei':'1208400000000000000 [1.208e18]'},{exit:2});
const methods=[]; const balance='0x'+1208400000000000000n.toString(16),gas='0x'+25000000000n.toString(16);
const server=createServer((req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',()=>{
  try{const input=JSON.parse(body);const one=q=>{methods.push(q.method);const values={eth_getBalance:balance,eth_gasPrice:gas,eth_chainId:'0xa869',web3_clientVersion:'QA-read-only-mock'};
    return Object.hasOwn(values,q.method)?{jsonrpc:'2.0',id:q.id,result:values[q.method]}:{jsonrpc:'2.0',id:q.id,error:{code:-32601,message:'Read-only QA mock'}};};
    res.setHeader('content-type','application/json');res.end(JSON.stringify(Array.isArray(input)?input.map(one):one(input)));
  }catch{res.statusCode=400;res.end();}
});});
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(6204,'127.0.0.1',resolve);});
  const address='0x0000000000000000000000000000000000000001',url='http://127.0.0.1:6204';
  const balanceResult=await command('cast',['balance',address,'--rpc-url',url]);
  const gasResult=await command('cast',['gas-price','--rpc-url',url]);
  const cli=await command(process.execPath,[`${ship}/${relative}`,'--runs=1','--funded-wallets=0','--pending-wei=0',`--balance-wei=${balanceResult.out}`,`--gas-price-wei=${gasResult.out}`]);
  report.castBridge={version:execFileSync('cast',['--version'],{encoding:'utf8'}).split('\n')[0],balance:balanceResult,gas:gasResult,cli,methods,
    pass:balanceResult.code===0&&gasResult.code===0&&cli.code===0};
}finally{await new Promise(resolve=>server.close(resolve));}
report.complete=true;report.pass=report.cases.every(r=>r.pass)&&report.castBridge.pass;
report.candidateUnchanged=Object.entries(report.hashes).every(([p,h])=>sha(p)===h);
writeFileSync(`${qa}/reports/v4-qa/Q2/qa8-candidate-preflight-1.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({complete:report.complete,arithmeticCases:report.cases.length,passed:report.cases.filter(r=>r.pass).length,castBridgePass:report.castBridge.pass,candidateUnchanged:report.candidateUnchanged}));
process.exitCode=report.pass&&report.candidateUnchanged?0:1;
