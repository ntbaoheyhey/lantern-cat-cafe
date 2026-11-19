/** V9 MVP ultimates. Names are shown in the cut-in; data names live in card-effect-data. */
export type UltCat='mochi'|'clover'|'soot';
export type UltSetPiece='lantern-dome'|'tea-clover'|'chimney-comet';
export interface UltRecipe {
 cat:UltCat;name:string;setPiece:UltSetPiece;
 /** Body lunge as a fraction of the field width; the sign is resolved per cast. */
 lunge:number;aim:'enemies'|'team';
 palette:{core:string;glow:string;accent:string;deep:string;text:[string,string,string]};
 /** Sound hooks (AGS ids, placeholders until they land). */
 sound:Record<'cutin'|'cast'|'impact'|'linger',string>;
}
const sound=(cat:UltCat)=>({cutin:`sfx.ult.${cat}.cutin`,cast:`sfx.ult.${cat}.cast`,impact:`sfx.ult.${cat}.impact`,linger:`sfx.ult.${cat}.tail`});
export const ULT_RECIPES:Record<UltCat,UltRecipe>={
 mochi:{cat:'mochi',name:'Last Lantern Vow',setPiece:'lantern-dome',lunge:.09,aim:'enemies',
  palette:{core:'#fff6d6',glow:'#ffc457',accent:'#ff9a2e',deep:'#5a2f08',text:['#fff7d1','#ffd36b','#e88a1c']},sound:sound('mochi')},
 clover:{cat:'clover',name:'Fourleaf Spring Brew',setPiece:'tea-clover',lunge:.035,aim:'team',
  palette:{core:'#fffbe8',glow:'#8fe08a',accent:'#f4d774',deep:'#1f4a24',text:['#fbfff0','#bdf0a2','#5fbf62']},sound:sound('clover')},
 soot:{cat:'soot',name:'Chimney Comet',setPiece:'chimney-comet',lunge:.05,aim:'enemies',
  palette:{core:'#fff1dc',glow:'#ff8a3c',accent:'#b06cff',deep:'#2a1240',text:['#fff0e0','#ffb067','#b46cff']},sound:sound('soot')},
};
export function ultRecipe(asset:string|undefined):UltRecipe|undefined{return asset?ULT_RECIPES[asset as UltCat]:undefined;}
