/** Preserve raw CPU sampling semantics; every duration below is an estimate. */
import assert from 'node:assert/strict';
export function summarizeCpuProfile(profile, {countOnly = false} = {}) {
  const {nodes,samples,timeDeltas,startTime,endTime}=profile;
  assert.ok(samples?.length && samples.length===timeDeltas?.length);
  assert.ok(Number.isFinite(startTime)&&endTime>startTime);
  const byId=new Map(nodes.map(n=>[n.id,n]));assert.equal(byId.size,nodes.length);
  const parents=new Map();
  for(const n of nodes)for(const child of n.children??[]){assert.ok(byId.has(child));assert.ok(!parents.has(child));parents.set(child,n.id);}
  const self=new Map(),inclusive=new Map(),negativeTimeDeltas=[];let deltaSum=0;
  for(let i=0;i<samples.length;i++){
    const id=samples[i],delta=timeDeltas[i];assert.ok(byId.has(id));assert.ok(Number.isInteger(delta)&&(countOnly||delta>=0));
    if(delta<0)negativeTimeDeltas.push({index:i,nodeId:id,deltaUs:delta});
    deltaSum+=delta;const value=self.get(id)??{hits:0,deltaUs:0};value.hits++;value.deltaUs+=delta;self.set(id,value);
    const seen=new Set();let at=id;
    while(at!==undefined){assert.ok(!seen.has(at));seen.add(at);const v=inclusive.get(at)??{hits:0,deltaUs:0};v.hits++;v.deltaUs+=delta;inclusive.set(at,v);at=parents.get(at);}
  }
  const durationUs=endTime-startTime;
  const rows=map=>[...map].map(([id,v])=>({id,...byId.get(id).callFrame,samples:v.hits,sampleShare:v.hits/samples.length,uniformIntervalEstimateMs:v.hits/samples.length*durationUs/1000,rawSignedDeltaMs:v.deltaUs/1000,precedingDeltaEstimateMs:countOnly?null:v.deltaUs/1000})).sort((a,b)=>countOnly?b.samples-a.samples:b.precedingDeltaEstimateMs-a.precedingDeltaEstimateMs);
  const allSelf=rows(self);
  assert.equal([...self.values()].reduce((n,v)=>n+v.hits,0),samples.length);
  assert.equal([...self.values()].reduce((n,v)=>n+v.deltaUs,0),deltaSum);
  return {aggregation:countOnly?'raw-counts-only':'raw-count-and-delta',negativeTimeDeltas,precedingDeltaEstimateEnabled:!countOnly,nodes:nodes.length,samples:samples.length,durationMs:durationUs/1000,deltaSumMs:deltaSum/1000,unassignedTailMs:(durationUs-deltaSum)/1000,firstDeltaMs:timeDeltas[0]/1000,maxDeltaMs:timeDeltas.reduce((a,b)=>Math.max(a,b),0)/1000,rawHitCountMismatches:nodes.filter(n=>n.hitCount!==undefined&&n.hitCount!==(self.get(n.id)?.hits??0)).map(n=>n.id),topSelf:allSelf.slice(0,30),topInclusive:rows(inclusive).slice(0,30),allSelf,limits:['Hit-share and preceding-delta durations are sampling estimates, not measured exclusive CPU.','Count-only mode withholds preceding-delta attribution; signed totals are bookkeeping, not durations.','Inclusive ancestors overlap; do not sum their times.','Raw program/idle/GC samples retained; no sorting,clamping,DevTools display repair or source-map inference.']};
}
