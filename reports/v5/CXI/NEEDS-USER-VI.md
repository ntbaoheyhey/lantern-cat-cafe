# Triển khai bản xanh và tạo bằng chứng Fuji — chỉ owner thực hiện

Bản đã push và kiểm tra đầy đủ: **v5-m1.5**, mã ứng dụng đã kiểm chứng tại commit **a2cbb3fb4c4062847f8531524934b3b9330b1283** (tag gồm thêm báo cáo). Typecheck/build xanh, 2.924 web test và 5.224 root test pass. [Bằng chứng desktop](I-C.md) ghi rõ tải lạnh còn vượt 8 MB; 66–70 giây cũ là thời gian đến biên nhận, đòn đánh đầu tiên đã đo được 20,849 giây, gồm 17,7 giây đọc đủ 8 thẻ hướng dẫn. Commit sửa tiếp theo chỉ được thay vào lệnh dưới sau khi CXI công bố tag xanh mới trên BOARD.

Preview đã kiểm tra là [bản local desktop](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3), không phải đường dẫn chia sẻ cho giám khảo. Codex chưa deploy hosting, chưa sửa production DB và chưa gửi giao dịch Fuji có tiền.

## 1. Lấy đúng tag vào thư mục riêng

Chạy trong Terminal zsh của bạn. Không chuyển nhánh hoặc làm gián đoạn worktree đang tích hợp.

```sh
cd /Users/bao/taskbar-hero-chain
git fetch origin --tags
release_tag='v5-m1.5'
release_sha='173d854b1db8bbb23abdfe025ebd897b0c7a76c1'
release_dir="/Users/bao/taskbar-hero-release-${release_tag}"
test "$(git rev-parse "${release_tag}^{}")" = "$release_sha" || return 1
git worktree add --detach "$release_dir" "$release_sha"
cd "$release_dir"
pnpm install --frozen-lockfile
```

Nếu thư mục đã tồn tại, dùng worktree đó chỉ khi `git -C "$release_dir" rev-parse HEAD` đúng SHA ở trên và `git -C "$release_dir" status --porcelain` trống. Không xóa hoặc ghi đè thư mục đang có.

## 2. Build và deploy hosting hiện có

Bạn dùng Vercel CLI đã đăng nhập, liên kết **project hiện có**. Trong project, kiểm tra Root Directory là `apps/web`, có cho phép dùng source ngoài Root Directory để lấy `packages/`; install ở workspace root, build là `pnpm --filter @taskbar-hero/web build`, output của ứng dụng là `dist`. Các lệnh CLI dưới chạy từ **monorepo root**. [Vercel monorepo](https://vercel.com/docs/monorepos), [build](https://vercel.com/docs/cli/build), [deploy prebuilt](https://vercel.com/docs/cli/deploy).

Build chain có thể khác bản demo local. `?demo=1` không bật chain: `chain/flags.ts` chỉ đọc biến lúc build. Để dùng guest và chứng minh tài trợ, owner kiểm tra `VITE_GUEST_WALLET=1`, `VITE_CHAIN_LOOP=1`, `VITE_SUPABASE_URL` trỏ đúng backend và `VITE_CHAIN_MODE` không phải `local`; chỉ bật thêm tính năng có backend tương ứng. Giữ `VITE_SHIP_JOURNEY` tắt nếu muốn đúng đường desktop đã kiểm tra ở đây. Không chép khóa server vào bất kỳ biến `VITE_*` nào.

Backend phải có SIWE nonce/verify và `guest-drip` đang hoạt động, `GUEST_DRIP_ENABLED=1`, sponsor được owner cấp test AVAX. Không cần redeploy hợp đồng để chạy kit này. Nếu backend/schema chưa khớp tag, xử lý riêng trước khi bật chức năng chain; tài liệu này không thực hiện migration.

```sh
cd "$release_dir"
vercel link
vercel pull --yes --environment=production
vercel build --prod
```

Sau khi build thành công, owner thực hiện lệnh xuất bản:

```sh
vercel deploy --prebuilt --prod
```

Lấy URL HTTPS từ kết quả deploy, mở `/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3` trên URL đó. Kiểm tra desktop 1280×720: Play free → Fight → Fight → bài hướng dẫn → kết quả; xem cả `/` và `/?legacy=1`. Ghi URL, tag, SHA và UTC. Chỉ gửi URL public đã thử này cho giám khảo; không gửi `127.0.0.1`. Giữ URL deployment trước để owner có thể rollback trong Vercel nếu bản có cấu hình chain gặp lỗi.

## 3. Bằng chứng Fuji thật: một giao dịch cấp test gas

Kit chính xác là **`tools/v5int/fuji-proof-kit.mjs`**. Không dùng tên cũ `scripts/fuji-proof.mjs`. Nó yêu cầu đủ năm biến `PROOF_*`, chain 43113, endpoint HTTPS; xác minh receipt thành công, đúng hash/recipient, sender khác guest, đúng 0,05 AVAX và fee = gasUsed × effectiveGasPrice. Đây là **guest funding**, không phải mint NFT hay toàn bộ game chạy on-chain.

Dry-run đã pass 5 unit tests và Anvil cô lập tại 6308: 0,05 local AVAX, 516 ms, fee 0,000042 local AVAX, explorer null. Owner có thể chạy lại trên máy riêng:

```sh
node --test tools/v5int/fuji-proof-kit.test.mjs
node tools/v5int/fuji-proof-kit.mjs --dry-run
```

Để chạy Fuji thật, mở build chain đã deploy, chọn **Play free**, hoàn tất guest sign-in. Địa chỉ guest và token nằm trong session của chính tab đó. Owner có thể copy địa chỉ bằng `copy(JSON.parse(sessionStorage.getItem('taskbar-hero.session') ?? 'null')?.wallet ?? '')`, rồi copy token ở lệnh dưới. Không cần mở Wallet (màn đó cũng có thể tự xin gas). Lệnh copy không in token ra console:

```js
copy(JSON.parse(sessionStorage.getItem('taskbar-hero.session') ?? 'null')?.token ?? '')
```

Nếu kết quả rỗng, đăng nhập lại; không lấy private key từ browser storage. Dán token vào prompt ẩn dưới đây, không dán vào chat hoặc commit. Endpoint drip là URL backend của bạn cộng `/functions/v1/guest-drip`.

```sh
cd "$release_dir"
export PROOF_RPC_URL='https://api.avax-test.network/ext/bc/C/rpc'
read -r 'PROOF_DRIP_URL?Guest-drip HTTPS URL: '
read -r 'PROOF_GUEST_ADDRESS?Guest address 0x: '
read -r -s 'PROOF_GUEST_TOKEN?Guest session token (hidden): '
export PROOF_DRIP_URL PROOF_GUEST_ADDRESS PROOF_GUEST_TOKEN
export PROOF_CONFIRM_FUJI=YES
proof_dir="$release_dir/work/v5/CXI/proof"
mkdir -p "$proof_dir"
if node tools/v5int/fuji-proof-kit.mjs --fuji > "$proof_dir/owner-fuji.pending.json"; then
  mv "$proof_dir/owner-fuji.pending.json" "$proof_dir/owner-fuji.json"
  date -u '+%Y-%m-%dT%H:%M:%SZ' > "$proof_dir/owner-fuji.utc.txt"
else
  rm -f "$proof_dir/owner-fuji.pending.json"
fi
unset PROOF_GUEST_TOKEN PROOF_CONFIRM_FUJI
```

`owner-fuji.json` thành công chứa network `Avalanche Fuji`, hash, guest, payer, fundingWei `50000000000000000`, feeWei/feeAvax, block và explorer. `observationMs` là thời gian kit quan sát; `confirmationMs` chỉ có khi service cung cấp phép đo, còn lại null với `timingSource=unavailable`. Guest-drip có thể trả lại hash đã xác nhận từ trước; thời gian đọc lại receipt không phải tốc độ xác nhận giao dịch. Chỉ chia sẻ file này cùng UTC/URL/tag; không chia sẻ token. Mở explorer để đối chiếu sender, recipient, value và status. Nếu sponsor thấp, owner cấp test AVAX cho sponsor rồi thử lại; nếu session hết hạn, đăng nhập lại. Không biến lỗi hoặc timeout thành receipt xác nhận.

## 4. Giới hạn của bằng chứng hiện tại

Receipt chụp ở I-C là fixture có watermark synthetic. Anvil là chain local. [PUBLIC-FUJI.json](PUBLIC-FUJI.json) xác minh **có bytecode** ở năm địa chỉ registry tại block 61.234.900; không xác minh code tương đương source và không thay thế giao dịch guest thật. Guest hiện là EOA ký SIWE và nhận test gas từ sponsor; không có bằng chứng cho ERC-4337/paymaster. RelicNFT là ERC-1155. Chỉ dùng các mô tả này trong submission cho đến khi có bằng chứng mới.
