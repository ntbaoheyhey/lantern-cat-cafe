import { requireRule } from '../internal';
import { metaCommand, transactDepth } from './state';
import type { DepthAccount } from './contract';

export function firstInvitation(state: DepthAccount, seed: number) {
  return transactDepth(state, draft => {
    requireRule(!draft.freeInvite, 'ALREADY_CLAIMED', 'Your welcome invitation is already used.');
    draft.account.currencies.stamps += 150;
    const result = metaCommand(draft, { type: 'pull', bannerId: 'standard', seed });
    requireRule(result.ok, 'NOT_READY', 'Finish your run before opening the invitation.');
    Object.assign(draft, result.state);
    draft.freeInvite = true;
  });
}
