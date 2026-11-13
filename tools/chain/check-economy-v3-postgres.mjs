// Real concurrent sessions against a disposable PostgreSQL, with no host ports.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),name=`v3-economy-proof-${process.pid}`;
const image='postgres:17-alpine@sha256:e5d2edd28b1f8d40a0a6c0c9cdc545b19b56a0d5d88f94bc11a97d970d4700d0';
const docker=args=>execFileSync('docker',args,{encoding:'utf8',timeout:60000,stdio:['pipe','pipe','pipe']});
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const sql=text=>new Promise(resolve=>{
 const p=spawn('docker',['exec','-i',name,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres']);let out='',error='';
 p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>error+=d);p.on('error',e=>resolve({code:-1,out:'',error:e.message}));
 p.on('close',code=>resolve({code,out:out.trim(),error:error.trim()}));p.stdin.end(text);
});
const ok=async text=>{const r=await sql(text);assert.equal(r.code,0,r.error);return r.out;};
let created=false;
try{
 docker(['run','-d','--rm','--network','none','--name',name,'--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust',image]);created=true;
 for(let i=0;;i++){try{docker(['exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{assert(i<100);await new Promise(r=>setTimeout(r,100));}}
 await ok(readFileSync(resolve(root,'supabase/tests/sql/bootstrap.sql'),'utf8'));
 for(const file of readdirSync(resolve(root,'supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await ok(readFileSync(resolve(root,'supabase/migrations',file),'utf8'));
 await ok('update chain_v3_budget set enabled=true,ceiling=24000000000000000000');
 const wallets=Array.from({length:8},(_,i)=>'0x'+String(i+1).repeat(40)),players=[];
 const initial={spool:'16000000000000000000',intents:[],deed:null};
 for(const wallet of wallets){const player=await ok(`select upsert_player_by_wallet(${quote(wallet)})`);players.push(player);await ok(`set role service_role;select chain_v3_read(${quote(player)},${quote(wallet)},${quote(JSON.stringify(initial))}::jsonb)`);}
 const actions=players.map(()=>crypto.randomUUID());
 const requests=players.map((player,i)=>`select chain_v3_commit(${quote(player)},${quote(wallets[i])},${quote(actions[i])},'proof',0,
  ${quote(JSON.stringify({...initial,spool:'0',intents:[{id:actions[i],kind:'withdraw',net:'12000000000000000000'}]}))}::jsonb)`);
 const race=await Promise.all(requests.map(r=>sql(`begin;set local role service_role;${r};select pg_sleep(0.1);commit`)));
 assert.equal(race.filter(r=>r.code===0).length,2);assert.equal(race.filter(r=>r.error.includes('routine_budget')).length,6);
 assert.equal(await ok('select reserved_net::text from chain_v3_budget'),'24000000000000000000');
 const winner=race.findIndex(r=>r.code===0);
 const retries=await Promise.all(Array.from({length:8},()=>sql(`set role service_role;${requests[winner]}`)));
 assert(retries.every(r=>r.code===0));assert.equal(new Set(retries.map(r=>r.out)).size,1);
 assert.equal(await ok('select count(*) from chain_v3_actions'),'2');
 const loser=race.findIndex(r=>r.code!==0),deedId=crypto.randomUUID();
 const deed=`select chain_v3_commit(${quote(players[loser])},${quote(wallets[loser])},${quote(deedId)},'deed',0,${quote(JSON.stringify(initial))}::jsonb,true)`;
 const deeds=await Promise.all(Array.from({length:8},()=>sql(`begin;set local role service_role;${deed};select pg_sleep(0.05);commit`)));
 assert(deeds.every(r=>r.code===0));assert.equal(new Set(deeds.map(r=>r.out)).size,1);
 assert.equal(await ok('select count(*) from chain_v3_deeds'),'1');
 assert.equal(await ok('select token from chain_v3_deeds'),'30001');
 assert.notEqual((await sql('set role authenticated;update chain_v3_budget set ceiling=999999999999999999999')).code,0);
 console.log('PASS PostgreSQL 17: 8 concurrent withdrawals admit exactly 2 within 24 YARN; 8 retries spend once; 8 Deed requests allocate once; client budget writes denied.');
}finally{if(created)docker(['rm','-f',name]);}
