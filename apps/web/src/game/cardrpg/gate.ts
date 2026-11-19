/** The card RPG is opt-in inside the existing local squad sandbox. */
export const cardRpgEnabled=(query:string)=>new URLSearchParams(query).get('cardrpg')==='1';

/** A6 defaults OFF in every build; only ?a6=1 opts in. */
export const gameplayA6=(query=typeof location==='undefined'?'':location.search)=>new URLSearchParams(query).get('a6')==='1';

/** The recording route is isolated from saved campaigns and explicit legacy visits. */
export function judgeDemoV9(query=typeof location==='undefined'?'':location.search) {
  const params=new URLSearchParams(query);
  return params.get('demo')==='1'&&params.get('legacy')!=='1';
}
