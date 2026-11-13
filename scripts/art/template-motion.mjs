/** Shared 30fps motion curves. No random wall-clock state; every pose is seekable. */
export function templateClips(nodes,style,contract){
 const node=name=>nodes.findIndex(n=>n.name===name),amp=style.amplitude??1,clips={};
 const track=(name,property,keys)=>({node:node(name),property,keys});
 const rotate=(name,keys)=>track(name,'rotate',keys.map(([time,value])=>({time,value:value*amp})));
 const move=(name,keys)=>track(name,'translate',keys.map(([time,x,y])=>({time,x:x*amp,y:y*amp})));
 const scale=(name,keys)=>track(name,'scale',keys.map(([time,x,y])=>({time,x:1+(x-1)*amp,y:1+(y-1)*amp})));
 const loop=(name,phase,amount,property='rotate')=>track(name,property,Array.from({length:55},(_,i)=>{const time=i/30,value=Math.sin(time/1.8*Math.PI*2-phase)-Math.sin(-phase);return property==='translate'?{time,x:0,y:value*amount*amp}:{time,value:value*amount*amp};}));
 const idle=[scale('torso',[[0,1,1],[.9,1,style.breathScale??1.025],[1.8,1,1]]),loop('head',.35,3,'translate'),loop('ear_l',.4,4),loop('ear_r',.8,-4),loop('tail_1',0,8),loop('tail_2',.42,10),loop('tail_3',.84,10)];
 if(style.template==='floating-insect')idle.push(loop('root',0,5,'translate'),loop('wing_l',0,8),loop('wing_r',Math.PI,-8));
 for(const [name,duration] of Object.entries(contract.clips))clips[name]={duration,tracks:[],visibility:[],events:(contract.events[name]??[]).map(([name,time])=>({name,time}))};
 clips.idle.tracks=idle;
 clips.attack.tracks=[rotate('torso',[[0,0],[.18,-8],[.26,7],[.32,7],[.55,0]]),move('root',[[0,0,0],[.18,-8,0],[.26,40,0],[.32,40,0],[.55,0,0]]),scale('torso',[[0,1,1],[.18,1.05,.95],[.26,.97,1.05],[.32,.97,1.05],[.55,1,1]]),rotate('arm_upper_l',[[0,0],[.18,18],[.26,-24],[.32,-24],[.55,0]]),rotate('arm_lower_l',[[0,0],[.18,10],[.26,-15],[.32,-15],[.55,0]])];
 clips.cast.tracks=[rotate('arm_upper_l',[[0,0],[.22,25],[.35,-12],[.45,-12],[.6,0]]),rotate('head',[[0,0],[.2,4],[.35,-3],[.6,0]]),move('torso',[[0,0,0],[.22,0,-5],[.35,0,6],[.6,0,0]])];
 clips.attack.tracks.push(rotate('arm_upper_r',[[0,0],[.18,style.weaponArc==='staff'?-12:-20],[.26,style.weaponArc==='staff'?14:28],[.32,style.weaponArc==='staff'?14:28],[.55,0]]));
 clips.cast.tracks.push(rotate('arm_upper_r',[[0,0],[.22,-18],[.35,12],[.45,12],[.6,0]]));
 clips.ultimate.tracks=[rotate('torso',[[0,0],[.4,-7],[.55,5],[.85,5],[1,0]]),scale('torso',[[0,1,1],[.4,1.05,.95],[.55,.96,1.06],[.85,.96,1.06],[1,1,1]]),rotate('arm_upper_l',[[0,0],[.4,32],[.55,-30],[.85,-30],[1,0]]),rotate('arm_upper_r',[[0,0],[.4,-18],[.55,16],[.85,16],[1,0]])];
 clips.hit.tracks=[move('root',[[0,0,0],[.06,-12,0],[.25,0,0]]),rotate('torso',[[0,0],[.06,-5],[.25,0]])];
 clips.stunned.tracks=[loop('head',0,4),rotate('torso',[[0,-4],[.9,-6],[1.8,-4]])];
 clips.frozen.tracks=[];
 clips.death.tracks=[move('root',[[0,0,0],[.25,-8,-8],[.7,-20,-32]]),rotate('torso',[[0,0],[.2,-10],[.7,-22]]),scale('torso',[[0,1,1],[.25,1.02,.96],[.7,1.12,.82]])];
 clips.victory.tracks=[...idle,loop('arm_upper_l',0,10),loop('root',0,3,'translate')];
 clips.enter.tracks=[move('root',[[0,-70,0],[.3,5,0],[.5,0,0]]),rotate('torso',[[0,8],[.3,-2],[.5,0]])];
 for(const [legacy,name] of Object.entries({skill:'cast',ult:'ultimate',hurt:'hit',ko:'death',appear:'enter','idle-phase2':'idle',enrage:'cast'}))clips[legacy]=structuredClone(clips[name]);
 for(const c of Object.values(clips))c.tracks=c.tracks.filter(t=>t.node>=0);
 return clips;
}
