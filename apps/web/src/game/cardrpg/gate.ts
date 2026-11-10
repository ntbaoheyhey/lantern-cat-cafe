/** The card RPG is opt-in inside the existing local squad sandbox. */
export const cardRpgEnabled=(query:string)=>new URLSearchParams(query).get('cardrpg')==='1';

/** A6 defaults OFF in every build; only ?a6=1 opts in. No behavior is attached yet. */
export const gameplayA6=(query=typeof location==='undefined'?'':location.search)=>new URLSearchParams(query).get('a6')==='1';
