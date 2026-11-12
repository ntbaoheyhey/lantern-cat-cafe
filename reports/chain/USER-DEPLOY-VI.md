# Triển khai CHAIN — chỉ Fuji 43113, không có giá trị thật

**Cập nhật12/11:** Bạn đã hoàn tất deploy hợp đồng, cấp quỹ, migration/function và smoke18 giao dịch. Không chạy lại bước2–5 hoặc smoke bằng hai ví đã dùng. Phần còn lại ở [FRONTEND-READINESS-VI](FRONTEND-READINESS-VI.md). Các bước dưới là tài liệu tham chiếu cho lần triển khai ban đầu. Codex không thực hiện public deploy. Giữ nguyên RelicNFT `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D` và RelicMarket `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`. Không chạy script Deploy.s.sol cũ. Tất cả khóa chỉ được nạp từ môi trường/kho bí mật của bạn; không dán vào chat, INBOX hay Git.

1. Lấy nhánh đã kiểm thử, cài công cụ, chạy kiểm tra tại máy của bạn:

```sh
cd /Users/bao/taskbar-hero-chain
git pull --ff-only origin codex/chain-2026-11-12
pnpm install --frozen-lockfile
git submodule update --init --recursive
forge build --root contracts
pnpm test
pnpm typecheck
forge test --root contracts
pnpm chain:test
node tools/chain/fuji-smoke.mjs --dry-run
```

2. Nạp `CHAIN_DEPLOYER_PRIVATE_KEY` vào môi trường từ kho bí mật của bạn (ví Fuji đã có AVAX). Tắt shell tracing; không dùng `echo`, `env`, `set -x` hoặc Forge `-vvvv` để kiểm tra khóa. Điền **địa chỉ công khai** của ví nhận tổng cung và kho bạc:

```sh
set +x
export FUJI_RPC_URL='https://api.avax-test.network/ext/bc/C/rpc'
export CHAIN_VOUCHER_SIGNER_ADDRESS="$(cast call 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D 'signer()(address)' --rpc-url "$FUJI_RPC_URL")"
export YARN_DISTRIBUTOR_ADDRESS='THAY_BANG_DIA_CHI_VI_NHAN_YARN'
export YARN_TREASURY_ADDRESS='THAY_BANG_DIA_CHI_KHO_BAC'
export MARKET_FEE_BPS=500
test "$(cast chain-id --rpc-url "$FUJI_RPC_URL")" = 43113
```

3. Mô phỏng rồi **tự chạy lệnh broadcast** sau khi xem kết quả. Script có chốt chain, NFT hiện hữu và signer; chỉ tạo YARN, Market V2, SeasonRewards. Không tự chạy lại nếu một phần giao dịch đã được phát: kiểm tra `contracts/broadcast/DeployChainV2.s.sol/43113/run-latest.json`, dùng `--resume` cùng tham số khi cần; tránh tạo hai bộ địa chỉ.

```sh
cd /Users/bao/taskbar-hero-chain/contracts
forge script script/DeployChainV2.s.sol:DeployChainV2 --rpc-url "$FUJI_RPC_URL"
forge script script/DeployChainV2.s.sol:DeployChainV2 --rpc-url "$FUJI_RPC_URL" --broadcast
cd /Users/bao/taskbar-hero-chain
```

Lưu ba địa chỉ công khai và Epoch từ output vào `reports/chain/INBOX.md`. Phí 500 bps không đổi sau deploy. Tổng cung 1 tỷ vào distributor; **không có hợp đồng khóa vesting**. SeasonRewards ban đầu rỗng, cần cấp vốn. Nó không có quyền rút quỹ tùy ý và không in YARN.

4. Cấp 10.000 YARN test cho quỹ thưởng bằng ví distributor. Nạp khóa của distributor vào `DISTRIBUTOR_PRIVATE_KEY` từ kho bí mật rồi chạy script dưới đây; script không in khóa và kiểm tra signer/pool/token. Điền địa chỉ vừa triển khai:

```sh
export YARN_TOKEN_ADDRESS='THAY_BANG_YarnToken'
export MARKET_V2_ADDRESS='THAY_BANG_RelicMarketV2'
export SEASON_REWARDS_ADDRESS='THAY_BANG_SeasonRewards'
node tools/chain/fund-rewards.mjs --run
```

5. Trong Supabase dashboard của `qoalewtxflagoprrxrgh`, tự xem và áp dụng theo thứ tự ba migration mới (không chạy db push mù với toàn bộ migration của nhánh):

- `supabase/migrations/20261112010000_guest_drip.sql`
- `supabase/migrations/20261112020000_chain_judge.sql`
- `supabase/migrations/20261112030000_chain_items.sql`

Trong trang Secrets, giữ `VOUCHER_SIGNER_PRIVATE_KEY` đã có. Drip dùng khóa đó nếu không đặt `SPONSOR_PRIVATE_KEY` riêng; số dư sponsor phải >=1 AVAX **sau phần dự phòng**. Thêm các biến công khai/flag: `FUJI_RPC_URL`, `YARN_TOKEN_ADDRESS`, `SEASON_REWARDS_ADDRESS`, `GUEST_DRIP_ENABLED=1`, `CHAIN_JUDGE_ENABLED=1`, `CHAIN_ITEMS_ENABLED=1`, `CHAIN_YARN_ENABLED=1`. Kiểm tra `SUPABASE_JWT_SECRET`, `SIWE_DOMAIN`, `SIWE_ALLOWED_ORIGIN` khớp host demo. Chỉ bật drip/judge nếu gateway bảo đảm hop cuối x-forwarded-for đáng tin; nếu chưa có bảo đảm, giữ tắt và dùng faucet.

Tự deploy ba function (verify_jwt=false có trong config; từng function tự xác minh session SIWE):

```sh
supabase functions deploy guest-drip --project-ref qoalewtxflagoprrxrgh
supabase functions deploy chain-judge --project-ref qoalewtxflagoprrxrgh
supabase functions deploy chain-items --project-ref qoalewtxflagoprrxrgh
```

6. Build/deploy frontend demo bằng quy trình hiện tại của bạn. Chỉ demo bật `VITE_CHAIN_DEMO=1`; live giữ bằng 0. Set `VITE_CHAIN_MODE=fuji`, `VITE_YARN_ADDRESS`, `VITE_MARKET_V2_ADDRESS`, `VITE_SEASON_REWARDS_ADDRESS`, `VITE_SUPABASE_URL`, `VITE_FUJI_RPC_URL`. Host phải phục vụ metadata `/relics/000…2711.json` và hình `/chain/star-thread.svg`; script không đổi URI của NFT cũ. Nếu URI cũ trỏ host khác, cập nhật tài sản trên host đó bằng quy trình deploy frontend hiện hữu. Không đổi tên hoặc deploy lại NFT.

7. Bot cần sở hữu Relic sẵn và gas. Không mint bằng bot script. Chuyển 3–6 Relics test hợp lệ vào ví bot qua ví của bạn; nạp `BOT_PRIVATE_KEY` từ kho bí mật rồi chạy (V2 mặc định YARN khi chỉ định --v2):

```sh
node tools/chain/bot-seller.mjs --run --v2 --once
node tools/chain/bot-seller.mjs --run --v2
```

8. Nạp hai khóa **ví test mới/chưa nhận judge pass** vào `SMOKE_SELLER_PRIVATE_KEY`, `SMOKE_BUYER_PRIVATE_KEY`. Cùng IP tối đa 3 tài khoản/ngày; toàn hệ thống tối đa 50/ngày. Không nâng giới hạn để làm đẹp demo. Chạy smoke thật sau deploy:

```sh
export SUPABASE_URL='https://qoalewtxflagoprrxrgh.supabase.co'
export WEB_ORIGIN='THAY_BANG_HTTPS_ORIGIN_DEMO'
node tools/chain/fuji-smoke.mjs --fuji
```

Gửi đường dẫn `reports/chain/FUJI-SMOKE.md`, địa chỉ hợp đồng và URL demo vào INBOX. Không gửi khóa. `FUJI-SMOKE-DRY-RUN.md` chỉ là chứng cứ Anvil, không phải giao dịch Fuji công khai. Nếu triển khai/thử nghiệm dừng giữa chừng, dùng giao diện Recover để tiếp tục seal cùng nonce; smoke tự động yêu cầu ví mới cho một lượt đầy đủ.

9. Tắt demo khi không sử dụng bằng bốn server flags về 0. YARN/NFT không mang giá trị thật; không mainnet, không đổi ra tiền. Giao dịch game tại Việt Nam còn vấn đề pháp lý cụ thể được nêu trong TOKENOMICS-RESEARCH.md; chưa có quyết định triển khai thương mại.

## Cập nhật xử lý yêu cầu CHAIN (12/11, sau checkpoint recovery)

Bản mới giới hạn JSON ở1.024 byte, thời gian tải10 giây và báo rõ giới hạn/nguyên liệu chưa thanh toán. Chưa được Codex deploy. Sau khi lấy tip xanh của nhánh CHAIN, bạn chạy cùng một khối Terminal; giữ nguyên secret/cờ đang dùng, không chạy lại migration hay deploy hợp đồng:

```sh
cd /Users/bao/taskbar-hero-chain
supabase functions deploy guest-drip --project-ref qoalewtxflagoprrxrgh --no-verify-jwt
supabase functions deploy chain-judge --project-ref qoalewtxflagoprrxrgh --no-verify-jwt
supabase functions deploy chain-items --project-ref qoalewtxflagoprrxrgh --no-verify-jwt
```

`--no-verify-jwt` chỉ bỏ kiểm tra JWT của gateway; mỗi hàm vẫn bắt buộc xác minh phiên SIWE riêng như bản trước. Không gửi khóa lên chat.

## Phần tùy chọn đã chuẩn bị sau đợt nghiên cứu — chưa cần bạn thao tác

Các bước dưới không chặn nghiên cứu và kiểm thử local. Đừng chạy lại deploy YARN/Market/Rewards đã hoàn tất.

**Style:** ba lựa chọn vĩnh viễn,4 YARN/mẫu, tổng tối đa12. Khi muốn thử công khai, áp dụng migration `20261112060000_chain_cosmetics.sql`, deploy function `chain-cosmetics`, đặt server `CHAIN_COSMETICS_ENABLED=1` và frontend `VITE_YARN_COSMETICS=1` cùng cờ YARN. Không cần hợp đồng mới. Migration040000/050000 chỉ chuẩn bị source/budget, mặc định tắt; không nhập save trình duyệt làm bằng chứng.

**Forge:** ba ornament vĩnh viễn, mỗi mẫu3 YARN +2 Epic đã seal. Kho giữ vật phẩm không có đường rút; cần nguồn Epic hợp lệ trước khi cho người chơi dùng. Mô phỏng kiểm thử dùng fixture, không phải vật phẩm campaign đã xác thực. Người vận hành tự nạp `CHAIN_FORGE_DEPLOYER_PRIVATE_KEY` từ kho bí mật vào môi trường (không dán vào chat/Git); sau đó xem mô phỏng trước khi tự broadcast:

```sh
cd /Users/bao/taskbar-hero-chain/contracts
set +x
forge script script/DeployRelicForge.s.sol:DeployRelicForge --rpc-url "$FUJI_RPC_URL"
forge script script/DeployRelicForge.s.sol:DeployRelicForge --rpc-url "$FUJI_RPC_URL" --broadcast
```

Script chốt Fuji43113 và hai địa chỉ NFT/YARN hiện hữu. Ghi địa chỉ công khai trả về vào INBOX, kiểm tra receipt/pins rồi mới đặt frontend `VITE_RELIC_FORGE_ADDRESS` và `VITE_RELIC_FORGE=1`. Cờ demo chung không tự bật Forge/Style. Nếu giao dịch đã gửi nhưng bị mất phản hồi, kiểm tra receipt trước khi chạy lại để tránh tạo hai kho. Không có thưởng YARN hay Power cho ornament; quyền ornament gắn với ví gốc, Style gắn với tài khoản gốc.

Thưởng boss/rank định kỳ tiếp tục tắt. Bộ tính ngân sách mới đòi lịch sử phát/đốt đầy đủ tại cùng block với quỹ; dữ liệu thiếu hoặc chưa có authority thì ngân sách đề xuất bằng0. Chạy test hoặc có số dư quỹ không tự bật issuer.

### Tùy chọn thử giá seal — chưa bật công khai

Mã đã hỗ trợ CHAIN_SEAL_PRICE_TRIAL=1 cho giá seal5%; mặc định bỏ trống/0 vẫn10%. Không cần hợp đồng mới cho tùy chọn này. Giao dịch đã reserve giữ giá cũ, kể cả rollback. Chỉ dùng với cohort thử nghiệm được chốt riêng sau khi cập nhật chain-items/frontend; chưa tự bật, chưa phải mức cân bằng được xác nhận. Các bước deploy/ví của bạn vẫn được hoãn theo yêu cầu hiện tại. Bằng chứng local và giới hạn: docs/design/chain/SEAL-PRICE-TRIAL.md.
