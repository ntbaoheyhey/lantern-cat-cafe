/** Burn-backed emission guard. Lives in the chain package (not the hashed campaign
 * rule set) because it governs YARN claims, not gameplay. */
/** Burn-backed emission guard (server policy on top of the deployed SeasonRewards controller).
 * A Spool withdrawal is signed only while, for the current 13-week contract season,
 * emittedInSeason + amount <= launchAllowance + backingBp/10000 * burnedInSeason.
 * Both totals are public reads on Fuji, so anyone can audit the rule. Spool that
 * cannot be withdrawn yet stays spendable 1:1 in game; nothing is lost. */
export const EMISSION_GUARD={launchAllowance:2000,backingBp:9000} as const;
/** YARN (whole-token units, may be fractional) still claimable this contract season. */
export function emissionHeadroom(emitted:number,burned:number,guard:{launchAllowance:number;backingBp:number}=EMISSION_GUARD){
 if(![emitted,burned].every(v=>Number.isFinite(v)&&v>=0))throw new Error('Invalid emission totals');
 return Math.max(0,guard.launchAllowance+burned*guard.backingBp/10000-emitted);
}
/** Integer-wei form used by the server before it signs a SeasonRewards claim. */
export function emissionHeadroomWei(emitted:bigint,burned:bigint){
 if(emitted<0n||burned<0n)throw new Error('Invalid emission totals');
 const room=BigInt(EMISSION_GUARD.launchAllowance)*10n**18n+burned*BigInt(EMISSION_GUARD.backingBp)/10000n-emitted;
 return room>0n?room:0n;
}
