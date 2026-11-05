/** The card RPG is opt-in inside the existing local squad sandbox. */
export const cardRpgEnabled=(query:string)=>new URLSearchParams(query).get('cardrpg')==='1';
