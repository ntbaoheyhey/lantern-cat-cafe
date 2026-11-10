import { invitationBannerV4 } from './gacha-v4';
import { gameplayV4 } from './gameplay-v4';
import { requireRule } from '../internal';
import { metaCommand, transactDepth } from './state';
import type { DepthAccount } from './contract';

export function firstInvitation(state: DepthAccount, seed: number) {
  return transactDepth(state, draft => {
    requireRule(!draft.freeInvite, 'ALREADY_CLAIMED', 'Your welcome invitation is already used.');
    const marks=gameplayV4(draft)?draft.v4?.selectorMarks:undefined;
    draft.account.currencies.stamps += gameplayV4(draft)?invitationBannerV4('standard',draft).cost.stamps!:150;
    const result = metaCommand(draft, { type: 'pull', bannerId: 'standard', seed });
    requireRule(result.ok, 'NOT_READY', 'Finish your run before opening the invitation.');
    Object.assign(draft, result.state);
    if(gameplayV4(draft)){if(marks===undefined)delete draft.v4!.selectorMarks;else draft.v4!.selectorMarks=marks;}
    draft.freeInvite = true;
  });
}
