/** Finite original ornaments; no tradable output, combat stats or rewards. */
export const FORGE_COST = 3n * 10n ** 18n;
export const FORGE_DESIGNS = [
  {id:0,name:'Orbit',color:'#abd8f5'},
  {id:1,name:'Bloom',color:'#c3e4ab'},
  {id:2,name:'Flare',color:'#ffd197'},
] as const;
export const isForgeInput = (id:bigint) => id>=20020n&&id<=20723n&&id%100n>=20n&&id%100n<=23n;
/** Additional self-source cost using available owned inputs. No sale-price assumption. */
export function forgePreparationCost(sealedEpics:bigint,sealFee:bigint){
  if(sealedEpics<0n||sealFee<0n)throw new Error('Nonnegative recipe inputs required');
  const missing=sealedEpics>=2n?0n:2n-sealedEpics;
  const preparation=missing*sealFee;
  return {missing,preparation,fee:FORGE_COST,total:preparation+FORGE_COST};
}
