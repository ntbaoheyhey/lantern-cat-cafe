import type {Scene} from 'three';
import {LanternRequiem} from './lantern-requiem';
import {StaffBolt} from './staff-bolt';
import {ShieldStrike} from './shield-strike';
import {HealingLeaves} from './healing-leaves';
import {OvenBastion} from './oven-bastion';
import {ThreadSnare} from './thread-snare';
import {TeaBlossoms} from './tea-blossoms';
import {NeedleStitches} from './needle-stitches';
import {YarnSurge} from './yarn-surge';

const factories={
 lantern:()=>new LanternRequiem(),basic:()=>new StaffBolt(),shield:()=>new ShieldStrike(),
 heal:()=>new HealingLeaves(),oven:()=>new OvenBastion(),thread:()=>new ThreadSnare(),
 tea:()=>new TeaBlossoms(),needle:()=>new NeedleStitches(),yarn:()=>new YarnSurge(),
};
type EffectName=keyof typeof factories;
type Effects={[K in EffectName]:ReturnType<typeof factories[K]>};
const ownerEffects:Record<string,readonly EffectName[]>={
 soot:['lantern','basic'],mochi:['shield'],clover:['heal'],panko:['oven'],
 'binding-thread':['thread'],'teacup-healer':['tea'],'needle-moth':['needle'],'yarn-giant':['yarn'],
};
export const isCraftOwner=(owner:string)=>Object.hasOwn(ownerEffects,owner);

/** Authored effects are production assets, loaded only for encounter owners. */
export class CraftEncounter {
 readonly effects:Partial<Effects>={};
 private loads=new Map<EffectName,Promise<void>>();
 private disposed=false;
 constructor(private scene:Scene){}
 prepare(owners:readonly string[]):Promise<void>{
  if(this.disposed)return Promise.resolve();
  const names=new Set(owners.flatMap(owner=>isCraftOwner(owner)?ownerEffects[owner]!:[]));
  return Promise.all([...names].map(name=>this.load(name))).then(()=>{});
 }
 private load(name:EffectName):Promise<void>{
  const cached=this.loads.get(name);if(cached)return cached;
  const pending=Promise.resolve().then(async()=>{
   if(this.disposed)return;
   const effect=factories[name]();Object.assign(this.effects,{[name]:effect});
   effect.hide();this.scene.add(effect.ground,effect.rear,effect.front);
   try{if('ready' in effect)await effect.ready;}
   catch(error){
    if(!this.disposed)effect.dispose();
    delete this.effects[name];throw error;
   }
  });
  this.loads.set(name,pending);return pending;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const effect of Object.values(this.effects))effect.dispose();
  for(const name of Object.keys(this.effects) as EffectName[])delete this.effects[name];
  this.loads.clear();
 }
}
