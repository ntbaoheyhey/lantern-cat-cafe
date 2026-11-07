import {describe,it,expect} from 'vitest';
import * as R from './index';
import {clone} from '../internal';
const now=Date.UTC(2026,10,8);
function account(){const s=R.setGameplayV4(R.createDepthAccount(81),true);s.seals=10;s.cleared=[1,2,3];s.masteries=[1,2,3];for(let d=1;d<=10;d++)s.account.inventory.stacks[`depth-seal-${d}`]=1;return s;}
function command(s:R.DepthAccount):R.IssuanceCommand{return {kind:'reserve',edition:'moon-collar',accountId:R.localEditionAccount(s),commandId:'first',expectedRevision:0};}
describe('local edition account adapter',()=>{
 it('charges once, saves replayable ledger and preserves exact combat power',()=>{
  const s=account(),stats=R.battleCats(s),c=command(s),r=R.issueEditionV4(s,c,now);expect(r.ok,r.error).toBe(true);expect(r.state.seals).toBe(7);
  expect(R.issueEditionV4(r.state,c,now).state).toEqual(r.state);expect(R.battleCats(r.state)).toEqual(stats);
  expect(R.importSave(R.exportSave(r.state))).toEqual(r.state);expect(R.exportSave(r.state)).toMatch(/^THC11\./);
 });
 it('rejects legacy bypass and disabled-mode issuance without spending',()=>{
  const s=account();expect(R.reserveDesignPreview(s,'moon-collar').state).toBe(s);
  const off=R.setGameplayV4(s,false);expect(R.issueEditionV4(off,command(off),now).state).toBe(off);
 });
 it('never charges for rejected ownership, stale revision or missing effort',()=>{
  const s=account();for(const c of [{...command(s),accountId:'wrong'},{...command(s),expectedRevision:1}]){const r=R.issueEditionV4(s,c,now);expect(r.ok).toBe(false);expect(r.state).toBe(s);}
  s.seals=2;expect(R.issueEditionV4(s,command(s),now).state).toBe(s);
 });
 it('preserves legacy counts and disables issuance for inconsistent legacy snapshots',()=>{
  const s=account();s.account.scarcity['moon-collar']!.issuedDesign=1;s.account.scarcity['moon-collar']!.seasonIssuedDesign=1;s.designClaims=['moon-collar'];
  const l=R.editionLedgerV4(s,now);expect(l.reservations[0]).toMatchObject({legacy:true,status:'live'});expect(R.issueEditionV4(s,command(s),now).state).toBe(s);
  const broken=clone(s);broken.account.scarcity['moon-collar']!.issuedDesign=0;expect(R.issueEditionV4(broken,command(broken),now).state).toBe(broken);
 });
 it('consumes proof identities for tailoring before subsequent design reservation',()=>{
  const s=account();s.materials=100;s.account.chapter=4;s.account.currencies={fish:1000,threads:1000,essence:100,stamps:1000};
  const item=R.GEAR.find(g=>g.rarity==='legendary')!,r=R.craftGear(s,item.id);expect(r.ok,r.error).toBe(true);expect(r.state.v4!.spentEffortIds).toHaveLength(1);
  const issued=R.issueEditionV4(r.state,command(r.state),now);expect(issued.ok,issued.error).toBe(true);
  expect(issued.state.v4!.issuance!.consumedProofIds).not.toContain(r.state.v4!.spentEffortIds![0]);expect(issued.state.seals).toBe(6);
 });
 it('labels legacy local effort rather than inventing trusted boss receipts',()=>{
  const s=account();s.account.inventory.stacks={};const r=R.issueEditionV4(s,command(s),now);expect(r.ok,r.error).toBe(true);
  expect(r.state.v4!.issuance!.events[0]!.context.effort.every(p=>p.source==='legacy-local')).toBe(true);
 });
});
