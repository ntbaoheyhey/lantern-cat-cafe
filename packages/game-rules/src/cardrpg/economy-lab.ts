import {ECONOMY_V3} from './economy-v3';
import {ECONOMY_C2} from './depth/economy-c2';

/** Scenario assumptions, not measured player behaviour or production entitlements.
 * Both ledgers receive this object. Policy references are the actual rule tables. */
export const ECONOMY_LAB = {
  policy:ECONOMY_V3, c2:ECONOMY_C2,
  population:500, tokenWeeks:52, cohortDays:42, startEpoch:Date.UTC(2026,10,13),
  initial:{testerYarn:20,testerRecipients:100,marketYarnPerParticipant:40},
  profiles:[
    {id:'casual',hours:.5,hoursSigma:.35,sessionMinutes:18,activeDays:.7,churnFirst:.055,churnLater:.012,deed:.55,withdraw:.7,sink:.5,market:.2,sell:.5,buy:.25,upgrades:1},
    {id:'regular',hours:1,hoursSigma:.3,sessionMinutes:30,activeDays:.85,churnFirst:.035,churnLater:.008,deed:.75,withdraw:.8,sink:.7,market:.45,sell:.6,buy:.45,upgrades:2},
    {id:'heavy',hours:3,hoursSigma:.3,sessionMinutes:50,activeDays:.95,churnFirst:.02,churnLater:.005,deed:.85,withdraw:.9,sink:.85,market:.65,sell:.7,buy:.6,upgrades:3},
    {id:'whale-free',hours:6,hoursSigma:.25,sessionMinutes:75,activeDays:.98,churnFirst:.015,churnLater:.004,deed:.9,withdraw:.95,sink:.95,market:.8,sell:.8,buy:.75,upgrades:3},
    {id:'bot',hours:12,hoursSigma:.15,sessionMinutes:180,activeDays:.99,churnFirst:.01,churnLater:.003,deed:.85,withdraw:1,sink:.05,market:.9,sell:1,buy:.05,upgrades:3},
  ],
  // Human shares are normalized after inserting the independently varied bot share.
  mixes:{'casual-heavy':[.7,.2,.08,.02],balanced:[.4,.35,.2,.05],'heavy-heavy':[.15,.3,.4,.15]},
  // Explicit session timing assumptions; combat rewards still execute real C2 rules.
  timing:{decisionSeconds:2,battleActionSeconds:2.8,minimumEncounterSeconds:12},
} as const;
