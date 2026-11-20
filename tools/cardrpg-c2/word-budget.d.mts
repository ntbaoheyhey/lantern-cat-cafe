export interface WordCount {count:number;words:string[];text:string}
export const screens:string[];
export function visibleWords(page:unknown,names:string[]):Promise<WordCount>;
export function runBudget(page:unknown,options?:{shots?:string;only?:string[]}):Promise<Array<WordCount & {screen:string}>>;
