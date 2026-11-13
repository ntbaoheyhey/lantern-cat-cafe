# Triển khai demo ngày 20/11/2026

Bạn chạy các bước dưới trong Terminal của mình. Codex chưa triển khai web, function, migration hoặc hợp đồng v3 lên mạng công khai. Không deploy lại hợp đồng. Kinh tế v3 vẫn **PARTIAL**: tỷ lệ đốt/phát thưởng và cân bằng Star Thread chưa đạt; đây là demo Fuji, không có giá trị thật.

Nếu Session A đã hợp nhất hình ảnh/trận đấu ngày 18/11, dùng checkout tích hợp cuối cùng chứa cả hai nhánh. Các lệnh dưới dùng checkout B hiện tại. Không reset hoặc xóa thay đổi của Session A. Không đưa khóa ví, JWT, mật khẩu DB hay file `.env*` vào Git/chat.

## 1. Lấy source và kiểm tra local

```sh
cd /Users/bao/taskbar-hero-chain
git switch codex/v3-shell-2026-11-13
git pull --ff-only origin codex/v3-shell-2026-11-13
pnpm install --frozen-lockfile
pnpm -r typecheck
pnpm test
node tools/chain/campaign-manifest.mjs --check
node scripts/ui/check-icons.mjs
node scripts/ui/check-typography.mjs
forge build --root contracts
```

GitHub Actions bị chặn billing; các kiểm tra trên chạy local. Nếu manifest khác sau khi tích hợp, cần cập nhật và kiểm tra chính sách campaign trong source trước khi bật server. Không ghi đè fingerprint của campaign đang chơi để bỏ qua lỗi.

## 2. Migration và function Supabase

Project hiện có: `qoalewtxflagoprrxrgh`. Giữ các secret đang hoạt động: `VOUCHER_SIGNER_PRIVATE_KEY`, secret JWT, cấu hình SIWE và sponsor. Mọi giá trị private chỉ nằm trong kho bí mật/Supabase. Các biến bên dưới đều là cờ hoặc địa chỉ công khai.

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
  CHAIN_JUDGE_ENABLED=0 GUEST_DRIP_ENABLED=0
supabase migration list --linked
supabase db push --linked --dry-run
)
```

Đối chiếu danh sách migration còn thiếu. B6 thêm `20261113010000_economy_v3.sql`; nó cần các migration CHAIN trước đó, gồm journal, nguồn thưởng, ngân sách tester và reward renewals. Lệnh tiếp theo áp dụng **tất cả migration đang chờ** trong checkout này. Không dùng `db reset` hoặc `migration repair` để bỏ qua lỗi.

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

Các handler tự kiểm tra session SIWE; `--no-verify-jwt` là cấu hình gateway đã có. Redeploy cả nhóm vì import map/rules dùng chung đã đổi. Nếu trước đó đã phát voucher, đợi ít nhất 10 phút sau khi tắt các issuer để voucher cũ hết hạn trước khi chốt ngân sách mới.

## 3. Chốt ngân sách hữu hạn, không reset sổ cái

Phương án demo: tối đa **600 YARN net** cho v3, tương đương 50 lượt rút 12 YARN, và **1.000 YARN** cho tối đa 50 grant tester mới. Đây là tổng ngân sách chương trình, không tự nạp lại mỗi tuần. Các trần lớn hơn đã tồn tại được giữ nguyên và tính vào kiểm tra đủ quỹ; reservation đã trả/chưa trả không bị xóa.

```sh
(
set -e
cd /Users/bao/taskbar-hero-chain
export FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
mkdir -p work/v3-shell
if [ ! -s work/v3-shell/fuji-start-block.txt ]; then
  cast block-number --rpc-url "$FUJI_RPC_URL" > work/v3-shell/fuji-start-block.txt
fi
test "$(cast chain-id --rpc-url "$FUJI_RPC_URL")" = 43113
export V3_POOL_WEI="$(cast call \
  0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b \
  'balanceOf(address)(uint256)' \
  0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11 \
  --rpc-url "$FUJI_RPC_URL" | cut -d ' ' -f 1)"
node tools/chain/prepare-v3-demo.mjs --pool-wei="$V3_POOL_WEI"
open work/v3-shell/activate-demo.sql
)
```

Đọc file vừa tạo, dán vào **Supabase → SQL Editor**, rồi chạy trong vòng 10 phút. Script chỉ tạo SQL; nó không tự kết nối DB. SQL giữ 600 YARN trong `protected_yarn` của ngân sách tester để hai nguồn không tiêu cùng một khoản. Nó từ chối quỹ thiếu hoặc campaign cũ mang fingerprint khác; không xóa người chơi. Nếu bị từ chối do campaign cũ, giữ các issuer tắt và chuẩn bị migration tương thích trước khi tiếp tục.

Quỹ SeasonRewards từng được nạp 10.000 YARN ngày 12/11; số dư hiện tại phải lấy từ RPC. Nếu thiếu, bạn bổ sung test YARN vào `0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11` từ ví phân phối, rồi tạo lại SQL. Không dùng script funding cũ để giả định nó sẽ bổ sung một quỹ đã có số dư: script đó chỉ nạp khi quỹ bằng 0.

## 4. Bật backend và nạp gas

Kiểm tra trong Supabase Secrets rằng `SIWE_DOMAIN=taskbarhero-eight.vercel.app` và `SIWE_ALLOWED_ORIGIN=https://taskbarhero-eight.vercel.app` đúng với host cuối. Không thay secret JWT hoặc voucher signer đã dùng cho hợp đồng. Khi dùng host khác, đặt đúng host/origin đó và cập nhật CSP nếu đổi RPC/indexer.

```sh
supabase secrets set --project-ref qoalewtxflagoprrxrgh \
  FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
  YARN_TOKEN_ADDRESS=0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b \
  SEASON_REWARDS_ADDRESS=0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11 \
  CHAIN_ECONOMY_V3_ENABLED=1 CHAIN_ECONOMY_V3_DEMO=1 \
  CHAIN_CAMPAIGN_ENABLED=1 CHAIN_CAMPAIGN_REWARDS_ENABLED=0 \
  CHAIN_ITEMS_ENABLED=1 CHAIN_YARN_ENABLED=1 CHAIN_TESTER_BUDGET_ENABLED=1
```

Giữ legacy campaign rewards tắt: thưởng boss/mốc/season của v3 đi vào Spool. Khi v3 bật, tester grants cũng bắt buộc đi qua ngân sách hữu hạn dù thiếu cờ tester riêng. Không bật legacy RelicForge: fusion v3 dùng hợp đồng NFT/YARN hiện có.

Trong Core, chọn **Avalanche Fuji C-Chain, chain ID 43113**, gửi khoảng **2,5 AVAX test** tới sponsor đã xác minh:

`0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000`

Giữ mức dự trữ 1 AVAX và quota hiện có. Kiểm tra số dư chỉ đọc:

```sh
cast balance 0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000 --ether \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc
```

Sau khi sponsor đủ và gateway bảo đảm hop cuối `x-forwarded-for` đáng tin theo cấu hình CHAIN hiện hữu, bật guest/judge:

```sh
supabase secrets set --project-ref qoalewtxflagoprrxrgh \
  GUEST_DRIP_ENABLED=1 CHAIN_JUDGE_ENABLED=1
```

Nếu điều kiện gateway chưa xác minh, giữ hai cờ này tắt; dùng ví Core có gas và campaign. Không nâng quota để bỏ qua điều kiện đó.

## 5. Build và deploy Vercel

Project `taskbarhero`, scope `ntbaoheyheys-projects`, Root Directory `apps/web`, Node 24.x, bật include files outside root. Khi quota Vercel còn khóa, chuẩn bị source/build và chờ quota; không lặp deploy. Lệnh cuối dưới đây thực sự cập nhật production.

Chạy lần đầu trước **mọi mint Deed v3** để lưu block bắt đầu. Nếu đã có v3 trên Fuji, dùng lại file block đã lưu từ lần bật đầu tiên; không thay bằng block mới vì sẽ làm thiếu số liệu cũ.

```sh
(
set -e
set +x
cd /Users/bao/taskbar-hero-chain
pnpm dlx vercel@65.14.0 login
pnpm dlx vercel@65.14.0 link --yes --project taskbarhero --scope ntbaoheyheys-projects
pnpm dlx vercel@65.14.0 pull --yes --environment=production --scope ntbaoheyheys-projects
mkdir -p work/v3-shell
if [ ! -s work/v3-shell/fuji-start-block.txt ]; then
  cast block-number --rpc-url https://api.avax-test.network/ext/bc/C/rpc > work/v3-shell/fuji-start-block.txt
fi
export VITE_V3_START_BLOCK="$(cat work/v3-shell/fuji-start-block.txt)"
export VITE_CHAIN_DEMO=1
export VITE_ECONOMY_V3=1
export VITE_CHAIN_CAMPAIGN=1
export VITE_CHAIN_CAMPAIGN_REWARDS=0
export VITE_RELIC_FORGE=0
export VITE_YARN_COSMETICS=0
export VITE_CHAIN_MODE=fuji
export VITE_CHAIN_STATS_URL=
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
pnpm dlx vercel@65.14.0 deploy --prebuilt --prod --yes --scope ntbaoheyheys-projects
)
```

Build tạo metadata cho 3.000 Deed và các quality ID; không tăng payload hình cho từng NFT. Nếu URI NFT trỏ host cũ, host đó cũng phải phục vụ cùng metadata/hình. `VITE_*` chỉ chứa dữ liệu công khai. Giữ anon key hiện hữu từ cấu hình Vercel nếu ứng dụng cũ cần; tuyệt đối không dùng service-role key trên frontend.

Counter Deed/tx đọc log từ block đã lưu, tối đa 200.000 block mỗi lượt bắt đầu. Khi vượt giới hạn hoặc RPC lỗi, nó hiện `Offline`. Counter fusion hoàn tất và edition 600 cần indexer; hiện chưa có indexer được triển khai. Để trống `VITE_CHAIN_STATS_URL` là hợp lệ. Nếu bổ sung sau, ưu tiên URL cùng origin; định dạng và kiểm tra nằm trong `REPORT.md`. Không điền số liệu demo giả.

## 6. Seed market bằng ví mua đã dùng trong smoke

Chỉ dùng Terminal đang giữ khóa ví mua smoke cũ. Script tận dụng voucher pass cũ, không yêu cầu thêm tester grant/drip, rồi niêm yết 3 Relic giá 1 test YARN. Chạy lại khi đã đủ 3 listing không tạo thêm hàng. Sau mua/nhận mới, chờ đủ cooldown 10 phút.

```sh
(
set -e
set +x
cd /Users/bao/taskbar-hero-chain
: "${SMOKE_BUYER_PRIVATE_KEY:?Nạp khóa ví mua từ kho bí mật; không gửi vào chat}"
export BOT_PRIVATE_KEY="$SMOKE_BUYER_PRIVATE_KEY"
export FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
export SUPABASE_URL=https://qoalewtxflagoprrxrgh.supabase.co
export WEB_ORIGIN=https://taskbarhero-eight.vercel.app
node tools/chain/seed-market.mjs --fuji --run
)
```

## 7. Kiểm tra luồng công khai và rollback

Mở `https://taskbarhero-eight.vercel.app/?demo=1&squad=1&cardrpg2=1&a6=1` bằng một browser profile guest mới. Theo thứ tự:

1. Play free → Judge pass → Fight boss → Café → Complete quest → Mint free Deed.
2. Nhận grant tester 20 YARN một lần; Café có 16 Spool từ demo quest. Withdraw 16 phải hiển thị giữ 4, đốt 0, nhận 12 YARN. Một lần mỗi 7 ngày; demo chỉ bỏ điều kiện tuổi tài khoản.
3. Seal một Epic: 1 Boss Seal + 10 YARN đốt. Chờ receipt; kiểm tra quality trong Bag.
4. Fusion: 3 Epic cùng set + 2 Star Thread + 20 YARN đốt. Dùng Epic đã seal cùng hai Epic bound; phải có link chuyển input tới dead address và link mint output.
5. Chờ 10 phút, list Legendary; ví thứ hai mua bằng test YARN. Kiểm tra receipt trên Snowtrace và fee 5% = 2% đốt + 3% treasury.
6. Quay lại home: badge Deed, Spool, mute/mixer, tutorial/Guide và đường vào Season đều hoạt động. Counter lỗi phải ghi Offline. Không dùng nhiều ví mới liên tục vì quota 3 ví/IP/ngày và 50/ngày.

Đối chiếu metadata và audio:

```sh
curl --fail --silent --show-error https://taskbarhero-eight.vercel.app/audio/LICENSES.json > /dev/null
curl --fail --silent --show-error https://taskbarhero-eight.vercel.app/relics/0000000000000000000000000000000000000000000000000000000000007531.json > /dev/null
```

Nếu phải dừng phát voucher, đặt `CHAIN_ECONOMY_V3_ENABLED=0`, `CHAIN_CAMPAIGN_ENABLED=0`, `CHAIN_YARN_ENABLED=0`, `CHAIN_JUDGE_ENABLED=0`, `GUEST_DRIP_ENABLED=0`. Giữ nguyên sổ cái/reservation; voucher đã ký có thể dùng tới hạn 10 phút và giao dịch đã xác nhận không được hoàn tác. Rollback web bằng deployment Vercel trước đó hoặc build lại với các cờ demo/v3 bằng 0. Không reset DB, không tái sử dụng Deed ID, không giảm `reserved_net`.

Mùa gameplay dài 28 ngày; hợp đồng SeasonRewards vẫn dài 13 tuần. Phí rút 25% ở lại quỹ, không bị đốt. Deed chỉ chặn rút YARN; chơi, nhận Spool và các random outcome dùng Bell vẫn miễn phí. Launch cần rà soát pháp lý; demo Fuji không dùng tiền thật.
