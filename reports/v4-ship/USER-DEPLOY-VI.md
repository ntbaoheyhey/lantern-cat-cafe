# Triển khai V4 ngày 20/11/2026 — thao tác của bạn

Source: `/Users/bao/taskbar-hero-chain`, nhánh `codex/v4-ship-2026-11-16`. Codex chưa triển khai SHIP lên Vercel/Supabase/Fuji. Các lệnh ghi vào dịch vụ bên dưới dành cho bạn ngày 20/11 sau khi xem kết quả freeze. Hiện G-CLASS, G-AUDIO và G-REPO còn điểm chưa đạt; xem [HANDOFF](HANDOFF-SHIP.md), [S6](S6/check.json) và [S11](S11/repo-open.json). Rehearsal local không chứng minh tốc độ giao dịch Fuji.

## 1. Chọn source và giữ điểm rollback

Ghi lại URL production hiện tại trong Vercel và phiên bản schema/functions đang chạy trước khi đổi. Giữ nguyên Git Deployment Enabled của nhánh SHIP là `false` trong hai file `vercel.json`; commit/push không phải thao tác deploy. Kiểm tra các job cũ trong Vercel vì kết quả của chúng chưa được xác minh.

```sh
cd /Users/bao/taskbar-hero-chain
git status --short --branch
git switch codex/v4-ship-2026-11-16
git pull --ff-only origin codex/v4-ship-2026-11-16
git rev-parse HEAD
git show --no-patch v4-freeze-2026-11-19
pnpm install --frozen-lockfile
pnpm -r typecheck
pnpm test
pnpm --filter @taskbar-hero/supabase-tests test
forge test --root contracts
node tools/chain/campaign-manifest.mjs --check
node scripts/ui/check-icons.mjs
node scripts/ui/check-typography.mjs
pnpm build
```

Tag chỉ được tạo khi freeze ngày 19/11; lệnh hiện tại sẽ chưa tìm thấy tag. Nếu HEAD khác tag, đối chiếu commit hotfix đã được ghi nhận. Kiểm tra parity và full rehearsal trong báo cáo freeze; `probe` chỉ so sánh hai runtime, chưa thay thế baseline class được duyệt. Không dùng một lần build thành công để bỏ qua các gate còn đỏ.

## 2. Tắt issuer, kiểm tra migration, rồi deploy functions

Supabase project `qoalewtxflagoprrxrgh`. Dùng CLI đã kiểm tra `2.122.0`. Giữ voucher signer/JWT/SIWE/sponsor trong Supabase Secrets; không in giá trị hoặc đưa `.env*` vào Git. Duy trì cùng signer đã đăng ký trên hợp đồng.

```sh
(
set -e
set +x
cd /Users/bao/taskbar-hero-chain
supabase login
supabase link --project-ref qoalewtxflagoprrxrgh
supabase secrets set --project-ref qoalewtxflagoprrxrgh \
  CHAIN_ECONOMY_V3_ENABLED=0 CHAIN_CAMPAIGN_ENABLED=0 \
  CHAIN_CAMPAIGN_REWARDS_ENABLED=0 CHAIN_YARN_ENABLED=0 \
  CHAIN_ITEMS_ENABLED=0 CHAIN_JUDGE_ENABLED=0 GUEST_DRIP_ENABLED=0
supabase migration list --linked
supabase db push --linked --dry-run
)
```

Đối chiếu mọi migration đang chờ với source và migration history đã áp dụng. Cần các bảng chain journal, guest drip, tester/reward budget, reward renewals và `20261113010000_economy_v3.sql`. Sao lưu bằng cơ chế hiện có của project trước khi áp dụng. Sau khi tắt issuer, đợi ít nhất 10 phút cho voucher đã ký hết hạn rồi chốt ngân sách. Không reset DB, không sửa migration history để bỏ lỗi.

```sh
(
set -e
cd /Users/bao/taskbar-hero-chain
supabase db push --linked
supabase functions deploy \
  chain-economy-v3 chain-campaign chain-campaign-reward chain-items \
  chain-cosmetics chain-judge guest-drip \
  auth-nonce auth-verify game-state idle-claim equip boss-fight upgrade \
  relic-forge relic-mint-report v2-choose-class v2-claim v2-equip v2-state \
  v2-craft v2-salvage v2-lock v2-relic-forge v2-boss-fight \
  --project-ref qoalewtxflagoprrxrgh --use-api --no-verify-jwt
)
```

Các handler tự xác minh session SIWE; `--no-verify-jwt` chỉ tắt xác minh JWT tại gateway. Không bật mock auth. Deploy lại nhóm dùng chung rules/import map; giữ các function không thuộc nhóm này.

## 3. Chốt nguồn YARN hữu hạn

Giữ envelope **600 YARN net cho v3 + 1.000 YARN cho tester**, tối đa 50 grant mới. Script bảo toàn ceiling lớn hơn, reservation và lịch sử có sẵn; không tự cấp lại ngân sách mỗi tuần. Quỹ thực tế còn phải phủ mọi envelope cũ. Retention Spool là **25%**, nằm lại trong quỹ, không phải lượng burn.

```sh
(
set -e
set +x
cd /Users/bao/taskbar-hero-chain
export FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
test "$(cast chain-id --rpc-url "$FUJI_RPC_URL")" = 43113
mkdir -p work/v3-shell
if [ ! -s work/v3-shell/fuji-start-block.txt ]; then
  cast block-number --rpc-url "$FUJI_RPC_URL" > work/v3-shell/fuji-start-block.txt
fi
export V3_POOL_WEI="$(cast call \
  0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b \
  'balanceOf(address)(uint256)' \
  0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11 \
  --rpc-url "$FUJI_RPC_URL" | cut -d ' ' -f 1)"
node tools/chain/prepare-v3-demo.mjs --pool-wei="$V3_POOL_WEI"
open work/v3-shell/activate-demo.sql
)
```

Đọc SQL, chạy trong Supabase SQL Editor trong 10 phút. Script chỉ tạo file. File `work/v3-shell/fuji-start-block.txt` là mốc lịch sử có sẵn dùng chung; giữ nó giữa các lần deploy. Nếu v3 đã hoạt động mà file mất, khôi phục mốc cũ từ bằng chứng triển khai trước khi dùng; không chọn block mới làm mất lịch sử. Nếu campaign fingerprint khác hoặc thiếu quỹ, giữ issuer tắt và xử lý tương thích; không xóa người chơi hoặc giảm `reserved_net`.

## 4. Kiểm tra sponsor và bật backend

Trong Secrets đặt đúng `SIWE_DOMAIN=taskbarhero-eight.vercel.app` và `SIWE_ALLOWED_ORIGIN=https://taskbarhero-eight.vercel.app`, hoặc host/origin production thật nếu thay đổi. Kiểm tra proxy/gateway bảo đảm hop cuối `x-forwarded-for` đáng tin trước khi bật guest/judge. Giữ quota 3 ví/IP/ngày và 50 ví/ngày.

Sponsor đã ghi nhận: **`0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000`**. Số dư tối thiểu cho lượt kế tiếp là **1 AVAX + tổng reservation đang chờ + 0,05 AVAX + 21.000 × gasPrice**. Gửi test AVAX từ Core/Fuji nếu thiếu; kiểm tra chain ID 43113 và địa chỉ trước khi gửi. Số dư đúng 1 AVAX không đủ.

Lấy tổng chờ bằng SQL chỉ đọc:

```sql
select coalesce(sum(50000000000000000 + 21000*gas_price),0)::text as pending_wei
from public.chain_guest_drips
where lower(sponsor)=lower('0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000')
  and status in ('reserved','pending');
```

Đặt `V4_PENDING_WEI` bằng số vừa trả về, rồi kiểm tra số dư/gas mới nhất; đây đều là số công khai:

```sh
(
set -e
set +x
: "${V4_PENDING_WEI:?Đặt tổng pending_wei vừa đọc từ SQL}"
export V4_PENDING_WEI
export V4_SPONSOR_BALANCE_WEI="$(cast balance \
  0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000 \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc)"
export V4_GAS_PRICE_WEI="$(cast gas-price --rpc-url https://api.avax-test.network/ext/bc/C/rpc)"
python3 - <<'PY'
import os
pending=int(os.environ['V4_PENDING_WEI'])
balance=int(os.environ['V4_SPONSOR_BALANCE_WEI'].split()[0])
gas=int(os.environ['V4_GAS_PRICE_WEI'].split()[0])
assert pending >= 0 and 0 < gas <= 200_000_000_000
minimum=10**18 + pending + 50_000_000_000_000_000 + 21000*gas
assert balance >= minimum, 'Sponsor cần bổ sung test AVAX'
print('Sponsor đủ tại thời điểm đọc; minimum_wei=', minimum)
PY
)
```

Reservation có thể đổi sau phép đọc; kiểm tra nguyên tử trong SQL vẫn quyết định cuối cùng. Sau khi xác minh đủ quỹ và gateway:

```sh
supabase secrets set --project-ref qoalewtxflagoprrxrgh \
  FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
  YARN_TOKEN_ADDRESS=0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b \
  SEASON_REWARDS_ADDRESS=0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11 \
  CHAIN_ECONOMY_V3_ENABLED=1 CHAIN_ECONOMY_V3_DEMO=1 \
  CHAIN_CAMPAIGN_ENABLED=1 CHAIN_CAMPAIGN_REWARDS_ENABLED=0 \
  CHAIN_ITEMS_ENABLED=1 CHAIN_YARN_ENABLED=1 CHAIN_TESTER_BUDGET_ENABLED=1 \
  GUEST_DRIP_ENABLED=1 CHAIN_JUDGE_ENABLED=1
```

Legacy campaign rewards tắt vì phần thưởng v3 vào Spool. Optional RelicForge/cosmetics giữ tắt; workshop dùng NFT/YARN/market hiện có, không cần hợp đồng mới.

## 5. Build trước, kiểm tra artifact, rồi publish một lần

Vercel project `taskbarhero`, scope `ntbaoheyheys-projects`, Root Directory `apps/web`, Node 24.x, include files outside root. [Giới hạn Hobby là 100 deploy/ngày](https://vercel.com/docs/limits); plan/quota tài khoản hiện chưa xác minh. Giữ hạn 100/ngày theo work order; kiểm tra dashboard và không lặp deploy khi quota hết. CLI cố định `65.14.0`.

```sh
(
set -e
set +x
cd /Users/bao/taskbar-hero-chain
pnpm dlx vercel@65.14.0 login
pnpm dlx vercel@65.14.0 link --yes --project taskbarhero --scope ntbaoheyheys-projects
pnpm dlx vercel@65.14.0 pull --yes --environment=production --scope ntbaoheyheys-projects
test -s work/v3-shell/fuji-start-block.txt
export VITE_V3_START_BLOCK="$(cat work/v3-shell/fuji-start-block.txt)"
export VITE_CHAIN_DEMO=0 VITE_ECONOMY_V3=1 VITE_GUEST_WALLET=1
export VITE_CHAIN_LOOP=1 VITE_ITEM_TRADING=1 VITE_YARN_TOKEN=1
export VITE_SHIP_JOURNEY=1 VITE_UI_V3=1 VITE_CHAIN_CAMPAIGN=1
export VITE_CHAIN_CAMPAIGN_REWARDS=0 VITE_RELIC_FORGE=0 VITE_YARN_COSMETICS=0
export VITE_ALLOW_MOCK_AUTH=0 VITE_CHAIN_MODE=fuji VITE_CHAIN_STATS_URL=
export VITE_YARN_ADDRESS=0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b
export VITE_MARKET_V2_ADDRESS=0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4
export VITE_SEASON_REWARDS_ADDRESS=0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11
export VITE_SUPABASE_URL=https://qoalewtxflagoprrxrgh.supabase.co
export VITE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
pnpm dlx vercel@65.14.0 build --prod --yes --scope ntbaoheyheys-projects
test -f .vercel/output/static/audio/LICENSES.json
test -f .vercel/output/static/chain/star-thread.svg
test -f .vercel/output/static/relics/0000000000000000000000000000000000000000000000000000000000007531.json
test -f .vercel/output/static/relics/00000000000000000000000000000000000000000000000000000000000080e8.json
)
```

Các cờ trên phải có **trước build**; [Vite nhúng biến `VITE_*` vào client](https://vite.dev/guide/env-and-mode.html). Chỉ giữ anon key hiện có nếu cần; service-role/signing key không được xuất hiện trong frontend. Ghi lại commit, cấu hình công khai và hash artifact đã kiểm tra. Chỉ chạy lệnh publish dưới khi artifact và các gate freeze đã được xem xét:

```sh
cd /Users/bao/taskbar-hero-chain
pnpm dlx vercel@65.14.0 deploy --prebuilt --prod --yes --scope ntbaoheyheys-projects
```

[`--prebuilt` tải artifact đã build](https://vercel.com/docs/cli/deploy); cờ metadata deploy không thay đổi JavaScript đã nhúng. Không redeploy hợp đồng Fuji; địa chỉ NFT/market lấy từ `packages/chain/deployments/43113.json`. Metadata NFT phải tiếp tục được phục vụ ở URI đã mint.

## 6. Smoke công khai và rollback

Mở profile mới ở `https://taskbarhero-eight.vercel.app/?demo=1&squad=1&cardrpg2=1&a6=1`, đổi host nếu cần. Không thêm `dev=1`. Làm đủ bảy bước, ghi thời gian từ landing:

1. Landing: 4 counter thật; khi mất mạng hiển thị số lưu và tuổi dữ liệu, không tự thay bằng số demo.
2. Play free → Start trial: không popup ví; battle ≤30 giây, ≤3 click.
3. Chờ trận và nhận trial reward.
4. Mint trial reward: receipt đầu ≤180 giây median, tối đa 240 giây; toast có thời gian, phí AVAX, payer và link Snowtrace mở được.
5. Fund workshop → Seal Epic → Forge Legendary → List for 5 YARN → Buy with demo wallet → Withdraw Spool. Mỗi giao dịch có receipt/chime. Rút 16 Spool giữ 4, nhận 12 YARN; retention không phải burn. Giữ nguyên hạn mức/cooldown, không sửa DB để làm smoke xanh.
6. Face the boss: healer không gây damage; nghe voice/SFX và kiểm tra mixer còn lưu khi reload.
7. My café on Avalanche: đối chiếu giao dịch bằng ví, receipt và Snowtrace; reload tại workshop rồi tiếp tục không trả phí lại. Link proof phải khớp chain thật.

Chạy 3/3 lượt public trên các IP/ngày hợp lệ theo quota; ghi thời gian, lỗi và hash giao dịch công khai. Không xin nhiều drip để né quota. Nếu đủ 3 ví/IP đã dùng, chờ cửa sổ quota hoặc dùng tài khoản có sẵn để chẩn đoán, không tính thành lượt guest mới. Kiểm tra `/audio/LICENSES.json` và URI metadata trả HTTP 200. Ghi `DEPLOYED <url>` cùng commit vào [INBOX](INBOX.md); Codex sẽ kiểm tra theo S12. Không chạy runner Anvil trên Fuji.

Nếu gặp crash hoặc lỗi tiền/giao dịch, tắt issuer trước:

```sh
supabase secrets set --project-ref qoalewtxflagoprrxrgh \
  CHAIN_ECONOMY_V3_ENABLED=0 CHAIN_CAMPAIGN_ENABLED=0 \
  CHAIN_CAMPAIGN_REWARDS_ENABLED=0 CHAIN_YARN_ENABLED=0 \
  CHAIN_ITEMS_ENABLED=0 CHAIN_JUDGE_ENABLED=0 GUEST_DRIP_ENABLED=0
```

Trong Vercel → Deployments, chọn production trước đó đã lưu → Instant Rollback. [Hobby chỉ cho quay về production trước](https://vercel.com/docs/cli/rollback). Nếu dùng CLI, đặt `V4_PREVIOUS_DEPLOYMENT` bằng URL đã lưu rồi:

```sh
: "${V4_PREVIOUS_DEPLOYMENT:?Đặt URL production trước đã xác minh}"
pnpm dlx vercel@65.14.0 rollback "$V4_PREVIOUS_DEPLOYMENT" --yes --scope ntbaoheyheys-projects
```

Rollback web không hoàn tác chain/DB; voucher cũ có thể còn hiệu lực đến 10 phút. Giữ sổ cái, reservation, Deed ID và migration history. Không reset chain, cấp lại budget hoặc đảo migration trực tiếp; sửa tương thích từ source rồi kiểm tra lại.

Nguồn triển khai và phép so sánh cờ: [LEARN/S8](LEARN/S8.md). Bản này sẽ được cập nhật bằng kết quả rehearsal/freeze, không tự coi là đã deploy thành công.
