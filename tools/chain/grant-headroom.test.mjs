import test from 'node:test';
import assert from 'node:assert/strict';
import {grantHeadroom} from './grant-headroom.mjs';
import {simulate,mixes,UNIT} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';

test('grant bound preserves every liability, accepts recycled gross claims, and rounds required burn upward',()=>{
  const b=grantHeadroom({grossClaims:20000n*UNIT,eligibleBurn:10000n*UNIT});
  assert.equal(b.headroom,0n);assert(b.alreadyWithinTwoX);
  assert.equal(grantHeadroom({grossClaims:20000n*UNIT,eligibleBurn:12000n*UNIT,
    unpaidClaims:1000n*UNIT,plannedGrants:2000n*UNIT}).headroom,1000n*UNIT);
  assert.equal(grantHeadroom({grossClaims:3n,eligibleBurn:1n}).additionalBurnRequired,1n);
  assert.equal(grantHeadroom({grossClaims:2_000_000_001n*UNIT,eligibleBurn:1_000_000_000n*UNIT}).headroom,0n);
  assert(!grantHeadroom({grossClaims:0n,eligibleBurn:0n}).alreadyWithinTwoX);
  for(const n of [-1n,0,NaN,'1'])assert.throws(()=>grantHeadroom({grossClaims:n,eligibleBurn:0n}));
});

test('moving a promise into paid claims cannot create fresh headroom',()=>{
  let seed=43113;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return BigInt(seed);};
  for(let i=0;i<2000;i++){
    const grossClaims=random(),eligibleBurn=random(),unpaidClaims=random(),plannedGrants=random();
    const before=grantHeadroom({grossClaims,eligibleBurn,unpaidClaims,plannedGrants});
    const paid=grantHeadroom({grossClaims:grossClaims+unpaidClaims,eligibleBurn,plannedGrants});
    assert.equal(before.headroom,paid.headroom);
    assert.equal(before.additionalBurnRequired,paid.additionalBurnRequired);
    const committed=grantHeadroom({grossClaims,eligibleBurn,unpaidClaims:unpaidClaims+before.headroom,plannedGrants});
    assert.equal(committed.headroom,0n);
  }
});

test('dynamic grant policy never promises against future demand or quietly waives old grant debt',()=>{
  const supply=loadSourceSupply();
  for(const demand of [1,.5,.1,0])for(const mix of mixes){
    const s=simulate(mix,{supply,rewardPolicy:'grant-headroom',demand,entitlementBps:2500});
    for(let i=0;i<s.budgets.length;i++){
      const b=s.budgets[i];
      assert(b.committed<=b.headroomAtOpen+1e-8);
      assert(b.committed<=b.closedOrganicBurn*.5+1e-8);
      assert(b.committed===0||b.grossClaimsAtOpen+b.committed<=2*b.cumulativeOrganicBurn+1e-8);
      assert(s.rows.slice(i*13,(i+1)*13).reduce((n,r)=>n+r.emission,0)<=b.committed+1e-8);
    }
    if(demand===0){
      assert.equal(s.rows.at(-1).inclusiveEmission,20000);
      assert.equal(s.rows.at(-1).cumulativeBurn,0);
      assert(s.budgets.every(b=>b.committed===0));
    }
  }
});

test('a collapse preserves already quoted rewards; dormant deployed caps never recover by inventing demand',()=>{
  const options={supply:loadSourceSupply(),rewardPolicy:'grant-headroom',entitlementBps:2500};
  const collapse=simulate(mixes[0],{...options,demandShockWeek:14,demandAfterShock:0});
  assert(collapse.budgets[1].committed>0);
  assert(collapse.rows.slice(13,26).some(r=>r.emission>0));
  assert(collapse.rows.slice(13).every(r=>r.burn===0));
  assert(collapse.rows.slice(26).every(r=>r.emission===0));
  const recovery=simulate(mixes[0],{...options,demand:0,demandShockWeek:27,demandAfterShock:1});
  assert(recovery.rows.slice(26).some(r=>r.burn>0));
  assert(recovery.rows.every(r=>r.emission===0));
});
