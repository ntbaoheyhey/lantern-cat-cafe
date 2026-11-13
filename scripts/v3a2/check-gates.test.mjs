import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {numeric,cards,checkCard,filesMatching,fresh} from './check-gates.mjs';

test('every active requires one voice; half coverage must never pass',()=>{
  const gate=cards.V3.gates.find(g=>g.id==='active-voice');
  assert.equal(numeric(1,gate.op,gate.limit),true);
  assert.equal(numeric(.5,gate.op,gate.limit),false);
  assert.equal(numeric(.999,gate.op,gate.limit),false);
});

for(const op of ['min','max','eq','band']) test(`${op}: fake PASS and fake FAIL, NaN, absent target`,()=>{
  const limit=op==='band'?[1,3]:2;
  assert.equal(numeric(2,op,limit),true);
  assert.equal(numeric(op==='min'?1:4,op,limit),false);
  for(const value of [undefined,null,NaN,Infinity,'2'])assert.equal(numeric(value,op,limit),false);
  assert.equal(numeric(2,op,null),false);
});
test('every declared numeric gate rejects a failing value, including zero limits',()=>{
  let count=0;
  for(const spec of Object.values(cards))for(const g of spec.gates){
    const limit=typeof g.limit==='string'?(g.op==='band'?[1,2]:1):g.limit;
    const good=g.op==='band'?limit[0]:limit,bad=g.op==='band'?limit[1]+1:g.op==='min'?limit-1:limit+1;
    assert.ok(numeric(good,g.op,limit),g.id+' positive fixture');
    assert.equal(numeric(bad,g.op,limit),false,g.id+' negative fixture');count++;
  }
  assert.ok(count>=100);
});
test('absent evidence cannot pass using files or a past scheduled date',()=>{
  for(const id of Object.keys(cards)){
    const rows=checkCard(id,{base:join(tmpdir(),'nonexistent-v3a2'),data:null,skipFreshness:true,now:new Date('2027-01-01')});
    assert.ok(rows.every(r=>!r.pass),id);
  }
});
test('files: counts real nonempty files, rejects missing and empty artifacts',()=>{
  const dir=mkdtempSync(join(tmpdir(),'v3a2-gates-'));
  try {writeFileSync(join(dir,'compare-a.png'),'fixture');writeFileSync(join(dir,'compare-empty.png'),'');
    assert.equal(filesMatching(dir,'compare-*.png').length,1);assert.equal(filesMatching(dir,'missing.png').length,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('freshness: evidence from before the last source commit fails',()=>{
  const dir=mkdtempSync(join(tmpdir(),'v3a2-revision-'));
  const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  try{git('init');git('config','user.name','Gate fixture');git('config','user.email','fixture@example.invalid');
    writeFileSync(join(dir,'source'),'one');git('add','.');git('commit','-m','one');const first=git('rev-parse','HEAD');
    writeFileSync(join(dir,'source'),'two');git('commit','-am','two');const second=git('rev-parse','HEAD');
    const revision={commit:second,date:git('show','-s','--format=%cI')},generatedAt=new Date().toISOString();
    assert.equal(fresh({sourceCommit:second,generatedAt},revision,dir),true);
    assert.equal(fresh({sourceCommit:first,generatedAt},revision,dir),false);
    assert.equal(fresh({sourceCommit:second,generatedAt:'2000-01-01'},revision,dir),false);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('date gate: real future sync cannot pass before its exact UTC time',()=>{
  const data={_meta:{generatedAt:'2026-11-16T12:00:00Z'}};
  const at=time=>checkCard('SY1',{data,skipFreshness:true,now:new Date(time)}).find(r=>r.id==='SY1.date').pass;
  assert.equal(at('2026-11-16T11:59:59Z'),false);assert.equal(at('2026-11-16T12:00:00Z'),true);
});
test('fresh aggregate metadata cannot disguise an old raw motion capture',()=>{
  const repo=mkdtempSync(join(tmpdir(),'v3a2-inputs-')),base=join(repo,'evidence');
  const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  try{
    git('init');git('config','user.name','Gate fixture');git('config','user.email','fixture@example.invalid');
    const source=join(repo,'apps/web/src/game/cardrpg/battle-v3/motion.ts');mkdirSync(dirname(source),{recursive:true});
    writeFileSync(source,'one');git('add','.');git('commit','-m','one');const first=git('rev-parse','HEAD');
    writeFileSync(source,'two');git('commit','-am','two');const second=git('rev-parse','HEAD');
    const meta={sourceCommit:second,generatedAt:new Date().toISOString()};
    for(const input of cards.M1.inputs){const path=join(base,input);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify({_meta:meta}));}
    const row=()=>checkCard('M1',{repo,base,data:{_meta:meta}}).find(r=>r.id==='M1.input-freshness');
    assert.equal(row().pass,true);
    writeFileSync(join(base,cards.M1.inputs[0]),JSON.stringify({_meta:{...meta,sourceCommit:first}}));
    assert.equal(row().pass,false);assert.equal(row().measured,1);
    rmSync(join(base,cards.M1.inputs[1]));assert.equal(row().measured,2);
  }finally{rmSync(repo,{recursive:true,force:true});}
});
test('fixture matrix fails any missing fixture/resolution',()=>{
  const data={fixtures:{'wave1@1280x720':{maxFaceOcclusion:0}}};
  const rows=checkCard('F1',{data,skipFreshness:true});
  assert.equal(rows.filter(r=>r.id.includes('face-occlusion')&&r.pass).length,1);
  assert.equal(rows.filter(r=>r.id.includes('face-occlusion')&&!r.pass).length,5);
});
