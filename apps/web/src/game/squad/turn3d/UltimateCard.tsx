import type {EffectFrame} from './effects';
declare global {interface Window {__TURN3D_PORTRAITS__?:Record<string,string>}}
const SHOTS:Record<string,{hero:string;title:string;line:string;glyph:string}>={
 hearthwall:{hero:'guardian',title:'Mochi · The hearthkeeper',line:'A place for everyone.',glyph:'◈'},
 lanternstorm:{hero:'witch',title:'Soot · Keeper of the wick',line:'One light becomes a sky.',glyph:'✦'},
 nineLives:{hero:'alchemist',title:'Clover · The last warm cup',line:'Nobody goes home alone.',glyph:'❋'},
};
/** Original GLB render portraits; cinematic lasts 1.45 seconds at x1 and shares Skip action. */
export function UltimateCard({frame,calm}:{frame:EffectFrame;calm:boolean}){
 if(frame.plan.skillId==='bossIntro'&&frame.elapsed<1450)return <div className="t3-boss-intro"><span>THE YARN GIANT</span><h3>The knot awakens.</h3><p>Watch the woven arms. Break the exposed knot.</p><small>S to skip</small></div>;
 const shot=SHOTS[frame.plan.skillId];if(!shot||frame.elapsed>=1450)return null;
 const src=window.__TURN3D_PORTRAITS__?.[shot.hero]??`${import.meta.env.BASE_URL}art/turn3d/portraits/${shot.hero}.png`;
 return <div className={`t3-ultimate-card ${shot.hero}${calm?' calm':''}`} style={{'--signature':frame.color,'--arrival':1} as React.CSSProperties} aria-label={`${frame.plan.name} cinematic`}>
  <div className="t3-portrait-frame"><img src={src} alt={shot.title}/><span>{shot.glyph}</span></div><div><small>{shot.title}</small><h3>{frame.plan.name}</h3><p>{shot.line}</p><span>ULTIMATE · S to skip</span></div>
 </div>;
}
