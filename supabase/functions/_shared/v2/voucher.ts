import { rarityIndex } from "@taskbar-hero/game-rules";
import type { RelicVoucher } from "@taskbar-hero/api-contract";
import type { VoucherRow } from "../game.ts";
import { checksumAddress, type VoucherSigner } from "../relic.ts";
import type { V2Store } from "./game.ts";
import { V2Error } from "./http.ts";

/** game_voucher_json is shared with v1, including decimal-string uint256 fields. */
export type VoucherRowV2 = VoucherRow;

/** Sign only an unsigned row, persisting the signature before returning the API voucher. */
export async function signedVoucherV2(store: Pick<V2Store, "voucherSign">, signer: VoucherSigner | undefined, playerId: string, row: VoucherRowV2): Promise<RelicVoucher> {
  if (row.reissuePending) throw new V2Error("server_error");
  const fields = { player: checksumAddress(row.player), relicId: BigInt(row.relicId), rarity: rarityIndex(row.rarityName), nonce: BigInt(row.nonce), expiry: BigInt(row.expiry) };
  let signature = row.signature;
  if (!signature) {
    if (!signer) throw new V2Error("server_error");
    signature = (await signer.sign(fields)).toLowerCase();
    if (row.status !== "issued" || !(await store.voucherSign(playerId, row.nonce, signature))) throw new V2Error("server_error");
  }
  return { claimId: row.claimId, player: fields.player, relicId: row.relicId, rarity: fields.rarity, rarityName: row.rarityName, nonce: row.nonce, expiry: Number(row.expiry), signature: signature as `0x${string}` };
}
