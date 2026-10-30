-- U-4 (docs/proposals/relic-recovery.md): a voucher whose nonce was burned by RelicNFT.cancelNonce is
-- not a mint. Edge Functions mark it 'cancelled' and issue a fresh voucher for the same paid forge
-- (same relic_id and rarity, new nonce). Additive and idempotent: one status value, one function.
-- Apply by hand before deploying the Edge Function change. No data is modified.
begin;

alter table public.relic_vouchers drop constraint if exists relic_vouchers_status_check;
alter table public.relic_vouchers
  add constraint relic_vouchers_status_check check (status in ('issued', 'minted', 'expired', 'cancelled'));

-- Replace the player's issued voucher p_nonce with a new unsigned voucher for the same forge, whether
-- or not it has expired (the caller has proved on chain that the nonce was used without a mint).
-- Returns the new voucher as jsonb, or null if p_nonce is not the player's issued voucher.
create or replace function public.game_voucher_cancel_reissue(p_player uuid, p_nonce bigint, p_expires_at timestamptz)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  old public.relic_vouchers;
  v public.relic_vouchers;
begin
  perform 1 from public.players where id = p_player for update;
  select * into old from public.relic_vouchers
   where player_id = p_player and nonce = p_nonce and status = 'issued';
  if not found then
    return null;
  end if;
  update public.relic_vouchers set status = 'cancelled' where nonce = old.nonce;
  insert into public.relic_vouchers (player_id, forge_id, relic_id, rarity, expires_at)
  values (p_player, old.forge_id, old.relic_id, old.rarity, p_expires_at)
  returning * into v;
  return public.game_voucher_json(v);
end;
$$;

revoke all on function public.game_voucher_cancel_reissue(uuid, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.game_voucher_cancel_reissue(uuid, bigint, timestamptz) to service_role;

commit;
