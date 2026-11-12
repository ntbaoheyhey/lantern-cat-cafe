# Đưa demo Fuji cho giám khảo

Đã xong: ba hợp đồng mới, quỹ10.000 YARN, migration/function, backend và smoke Fuji18 giao dịch. Không deploy lại hợp đồng hoặc chạy lại full smoke bằng hai ví đã nhận thưởng.

## Đã xác minh ngày12/11

- Vercel project `taskbarhero`, scope `ntbaoheyheys-projects`, domain production `taskbarhero-eight.vercel.app`.
- Root Directory `apps/web`; Vite; Node24.x; Build/Output/Install dùng mặc định; bật include files outside root. Đã đọc dashboard, không đổi cấu hình.
- Host trả200 nhưng `/chain/star-thread.svg` và metadata ERC1155 của10001 trả404. URI hợp đồng trỏ vào host này.
- Preview `CNkNYYvkXqBykVBxrpPwwLKHFcki` thực tế là Canceled dù GitHub status là SUCCESS. `apps/web/vercel.json` bỏ qua build Git trên nhánh khác main. Vì vậy dùng quy trình build local/prebuilt bên dưới; không cần sửa quy tắc build Git.
- V2 có0 listing. Ví bán giữ Relic1; ví mua giữ Relic3 và Star Thread. Ví mua còn2 voucher pass chưa mint, đủ tạo3 listing Relic qua script đã chuẩn bị.
- Hai giao dịch drip trong smoke có cùng người gửi `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000`. Số dư1,09999999999328 AVAX, mức dự trữ1 AVAX: tối đa khoảng1 drip mới với phí hiện tại, có thể ít hơn nếu còn reservation. Xem `DEMO-READINESS.json`.

**Cập nhật sau khi đẩy source:** Vercel trả `Deployment rate limited — retry in 24 hours.` cho cả hai project liên kết. Chờ quota mở lại rồi chạy bước triển khai dưới đây; `--prebuilt` chưa được xác minh là vượt được hạn mức này. Không lặp lệnh deploy khi vẫn còn báo giới hạn. GitHub Actions cũng chưa khởi chạy do billing/spending. Bằng chứng: `REMOTE-CHECKS.json`. Bạn vẫn có thể chuẩn bị build, seed hàng và nạp gas trong lúc chờ.

## 1. Liên kết đúng project

Chạy trong Terminal của bạn. CLI được cố định ở bản65.14.0 đã kiểm tra từ npm. Bỏ dòng login nếu Terminal đã đăng nhập Vercel.

```sh
cd /Users/bao/taskbar-hero-chain
pnpm dlx vercel@65.14.0 login
pnpm dlx vercel@65.14.0 link --yes --project taskbarhero --scope ntbaoheyheys-projects
```

## 2. Build và triển khai frontend

Sau khi Vercel hết giới hạn deploy, khối này thực sự cập nhật host demo ở lệnh cuối. Chỉ dùng cấu hình public; key ví không được đưa vào Vercel. `pull` giữ cấu hình môi trường hiện có trên máy; không gửi nội dung file `.vercel/.env*` vào chat hoặc Git.

```sh
(
set -e
set +x
cd /Users/bao/taskbar-hero-chain
pnpm dlx vercel@65.14.0 pull --yes --environment=production --scope ntbaoheyheys-projects
export VITE_CHAIN_DEMO=1
export VITE_CHAIN_MODE=fuji
export VITE_YARN_ADDRESS=0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b
export VITE_MARKET_V2_ADDRESS=0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4
export VITE_SEASON_REWARDS_ADDRESS=0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11
export VITE_SUPABASE_URL=https://qoalewtxflagoprrxrgh.supabase.co
export VITE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
pnpm dlx vercel@65.14.0 build --prod --yes --scope ntbaoheyheys-projects
test -f .vercel/output/static/chain/star-thread.svg
test -f .vercel/output/static/relics/0000000000000000000000000000000000000000000000000000000000002711.json
pnpm dlx vercel@65.14.0 deploy --prebuilt --prod --yes --scope ntbaoheyheys-projects
)
```

Biến VITE được đóng vào bản build này. Các lần build khác cần cùng cấu hình nếu muốn giữ demo CHAIN; mặc định source vẫn tắt các cờ trên live main. Quy trình CLI đã đối chiếu tài liệu Vercel [build](https://vercel.com/docs/cli/build), [pull](https://vercel.com/docs/cli/pull), [deploy](https://vercel.com/docs/cli/deploy), [link](https://vercel.com/docs/cli/link), đọc12/11/2026. Codex đã kiểm tra build Vite/Fuji local; chưa thực hiện Vercel pull/build/deploy với tài khoản của bạn.

## 3. Tạo3 món hàng bằng ví mua đã dùng

Dùng đúng Terminal còn `SMOKE_BUYER_PRIVATE_KEY`. Script chỉ mint2 voucher pass đã có, rồi niêm yết3 Relic giá1 test YARN; không yêu cầu drip, thưởng tester hoặc boss mới trên public Fuji. Chạy lại khi đủ3 listing là no-op. Dry-run đã chứng minh trên Anvil khóa mọi tài khoản RPC.

```sh
(
set -e
set +x
cd /Users/bao/taskbar-hero-chain
: "${SMOKE_BUYER_PRIVATE_KEY:?Dùng Terminal đã tạo ví mua; không gửi khóa vào chat}"
export BOT_PRIVATE_KEY="$SMOKE_BUYER_PRIVATE_KEY"
export FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
export SUPABASE_URL=https://qoalewtxflagoprrxrgh.supabase.co
export WEB_ORIGIN=https://taskbarhero-eight.vercel.app
node tools/chain/seed-market.mjs --fuji --run
)
```

Bot chỉ duy trì hàng trong kho, không tạo thêm nguồn cung. Sau khi3 món bán hết, cần cấp inventory hợp lệ rồi mới chạy `bot-seller.mjs --run --v2`; không tạo nhiều ví để lặp thưởng test. Nếu lần seed chạy ngay sau giao dịch mua, chờ đủ10 phút cooldown rồi chạy lại.

## 4. Nạp gas demo

Trong Core chọn **Avalanche Fuji C-Chain (43113)**, gửi **2,5 AVAX test** tới ví cấp gas đã xác minh:

`0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000`

Số dư khi đó khoảng3,6 AVAX: giữ1 AVAX dự trữ, đủ ngân sách cho50 lượt cấp0,05 AVAX và phí ở mức hiện tại. Vẫn áp dụng giới hạn50/ngày và3 ví/IP/ngày. Nếu chưa đủ test AVAX, lấy từ [faucet Avalanche](https://build.avax.network/console/primary-network/faucet); không mua hoặc chuyển AVAX mainnet cho bước này. Nếu bạn đã đổi sponsor sau snapshot, kiểm tra sender drip mới nhất trước khi nạp.

Kiểm tra chỉ đọc sau khi hoàn tất:

```sh
cast balance 0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000 --ether --rpc-url https://api.avax-test.network/ext/bc/C/rpc
curl --fail --silent --show-error https://taskbarhero-eight.vercel.app/chain/star-thread.svg > /dev/null
curl --fail --silent --show-error https://taskbarhero-eight.vercel.app/relics/0000000000000000000000000000000000000000000000000000000000002711.json > /dev/null
```

Sau đó mở `https://taskbarhero-eight.vercel.app/?demo=1&squad=1&cardrpg2=1&a6=1` và đo một lượt guest → mint → list → buy → Snowtrace. Chưa có bằng chứng luồng public đạt2 phút; thời gian local không thay cho phép đo này. Không thử liên tục nhiều ví mới trên cùng IP vì có quota.

GitHub Actions còn bị chặn Billing & plans; đây là việc chủ tài khoản xử lý nếu cần CI xanh trước tích hợp. Dữ liệu gameplay/tokenomics còn thiếu được ghi ở REQUESTS-TO-C2.md, không cần bạn thao tác ví để giải quyết phần đó.
