# Triển khai bản xanh và tạo bằng chứng Fuji — chỉ owner thực hiện

Bản đã kiểm tra và xác minh từ xa **v5-m1.15**, release **59f5f3c57ff05df85f5a835da65bf28c136403f3**, source ứng dụng/quay **b9b6f172824a7daa4ba95836081cade7c472ffb6**. Bộ5.556kiểm tra kế thừa(5.543đạt,11bỏqua,2lỗi dự kiến;3.243web) với cùng mã ứng dụng trừ texture landing đã duyệt;7cổng browser mới đạt. Đòn đầu21,163giây gồm17,7giây đọc. Chín mèo native đã nhận;media Mochi/Clover chưa bật. Byte chỉ báo cáo. [Bằng chứng](evidence/v8-native-r3-release-review.json), [tag từ xa](evidence/v8-m115-publication.json).

Cổng6301 hiện đã khôi phục đúng artifact R7 hai media để thử lỗi decoder thật: sourcebf01d462ac32233ab11475605d571aea691f96bf/indexeb93ee0dbdfb500c3f9aed80acdb134f027d8093240c86b545807a87dc79ce67;registry production vẫn{}. Bản chỉMochi được giữ nguyên. Focus mới khớp18/18 mẫu nhưng kiểm tra scene nghiêm ngặt lỗi ở1100ms vì thêm CSSanimation;chưa áp dụng footer. Viền/halo,nối đuôi và art chưa đạt nên media chưa phát hành. [Bản local desktop](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) không phải link chia sẻ giám khảo. Artifact xanh giữ tại /Users/bao/taskbar-hero-chain/work/v5/CXI/releases/v5-m1.15-dist;hosting,DB vàFuji có tiền do chủ dự án thực hiện.

## 1. Lấy đúng tag vào thư mục riêng

Chạy trong Terminal zsh của bạn. Không chuyển nhánh hoặc làm gián đoạn worktree đang tích hợp.

```sh
cd /Users/bao/taskbar-hero-chain
git fetch origin --tags
release_tag='v5-m1.15'
release_sha="$(git rev-parse "${release_tag}^{commit}")"
release_dir="/Users/bao/taskbar-hero-release-${release_tag}"
test -n "$release_sha" || return 1
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

## Batch M: bản nháp xin file tiếp theo

Chưa gửi cho người thiết kế. Hai MP4 gốc Mochi/Clover đều 10 giây, 300 frame, 30 fps, H.264 không alpha, dung lượng 18,66/18,72 MB; bản gốc được giữ nguyên.

Chủ dự án có thể xin bản xuất nền trong suốt (PNG RGBA theo frame hoặc ProRes 4444), giữ 30 fps/10 giây, chân cùng mốc và đầu–cuối vòng lặp nối mượt; kèm bản xem trên nền sáng để kiểm tra viền và ánh đèn. Phần mèo trong bản giao có thể cao 512–1024 px; nhóm tự tạo bản chạy 256/384/512 px và đo dung lượng/hiệu năng; dung lượng chỉ báo cáo, không có giới hạn8MB. Nếu có bộ runtime Cubism, xin model3/moc3, textures, motion3, physics3 và phiên bản xuất để đánh giá riêng. Nhóm chưa chấp thuận giấy phép SDK hay tải lên dịch vụ nào. Skill mong muốn dài 1 giây, cast ở 250 ms và hit ở 550 ms, giữ chân, có chuẩn bị và thu động tác. Mọi yêu cầu gửi bạn, chấp thuận điều khoản và upload do chủ dự án thực hiện.

Riêng Clover: đuôi cuối vòng hiện lệch so với đầu; các phép nắn một lớp làm gập vùng tiếp giáp váy. Nếu bạn thiết kế có thể xuất bổ sung, chủ dự án có thể xin lớp đuôi/váy và matte riêng, cùng khung hình/mốc chân, hoặc sửa vòng trong file Cubism rồi xuất nền trong suốt. Đây là gợi ý bản nháp; nhóm chưa liên hệ hay tự vẽ phần bị che. Hai MP4 gốc 18,66/18,72 MB vẫn giữ nguyên.

## 4. Giới hạn của bằng chứng hiện tại

Receipt ở I-C đến từ hành trình practice qua UI thường và ghi rõ local/no transaction. Các phim dùng fixture review, không phải bằng chứng chain. Anvil là chain local. [PUBLIC-FUJI.json](PUBLIC-FUJI.json) xác minh **có bytecode** ở năm địa chỉ registry tại block 61.234.900; không xác minh code tương đương source và không thay thế giao dịch guest thật. Guest hiện là EOA ký SIWE và nhận test gas từ sponsor; không có bằng chứng cho ERC-4337/paymaster. RelicNFT là ERC-1155. Chỉ dùng các mô tả này trong submission cho đến khi có bằng chứng mới.

Cập nhật kỹ thuật Clover 2026-11-18T09:53:09.423465+00:00: nếu người thiết kế đã có mô hình và công cụ xuất, có thể xin mask theo Part/ArtMesh cho đuôi,váy xanh,váy lót sáng và tay,giữ cùng300frame/30fps/canvas; mask theo alpha hoặc thang xám chỉ mô tả phần đang nhìn thấy,không tự khôi phục đuôi bị che. Tốt nhất là sửa nối vòng trong mô hình rồi xuất RGBA. Tài liệu chính thức: https://docs.live2d.com/en/cubism-editor-manual/cubism-ae-plugin-mask/ và https://docs.live2d.com/zh-CHS/cubism-editor-manual/cubism-ae-plugin-mask/ . Đây vẫn là bản nháp; nhóm chưa liên hệ,mua/cài AE hay chấp thuận điều khoản.

2026-11-18T13:01:23.560889+00:00 — Bản thử Clover mới giữ matte318×390, video1.502.465byte/cảgói1.627.378byte; dung lượng không chặn. Phim so sánh tại227px cho thấy mốc/khung đúng, nhưng nối đuôi vẫn sai khoảng4,96lần trung vị các cặp kề gần điểm nối. Việc xin bản sửa vòng hoặc lớp đuôi/váy/alpha riêng vẫn là gợi ý dành cho chủ dự án, chưa gửi.

## Batch M: lời nhắn ngắn cho bản xuất sửa vòng (chưa gửi)

Mình cần bản idle Mochi và Clover có alpha thật, ưu tiên chuỗi PNG RGBA hoặc bản master ProRes 4444 bạn đã xuất được. Giữ chuyển động 10 giây/30 fps, cùng canvas và mốc chân; ghi rõ kích thước canvas, phần thân, alpha straight hay premultiplied, và phiên bản xuất. Riêng Clover, nhờ kiểm tra đuôi/váy chạy qua điểm nối vòng cả vị trí lẫn hướng/tốc độ, không bật hoặc chồng hai nét. Bản 300 frame là các mẫu 0–299; không thêm bản sao frame đầu vào cuối. Gửi kèm một bản xem nối hai vòng trên nền sáng và nền tối để thấy viền/ánh đèn. Nếu đã bake vật lý, ghi riêng FPS vật lý và FPS cảnh; 30 fps video không có nghĩa vật lý phải 30 Hz. Nhóm sẽ tự giảm kích thước cho game.

Đây là dự thảo cho chủ dự án chọn gửi; chưa liên hệ người thiết kế. Hai bản gốc vẫn là18.660.725 và18.722.251byte. Khuyến nghị yêu cầu nguồn có alpha/sửa vòng dựa trên lỗi seam đã đo, không phải kết luận người thiết kế xuất sai. Bộ PNG có thể lớn hơn MP4; chưa có bản xuất mới để báo dung lượng thực.

Căn cứ đã kiểm tra: Cubism có cách bake tính hai lượt và lựa chọn FPS vật lý hoặc FPS cảnh; hai lựa chọn ảnh hưởng kết quả. [Bake vật lý](https://docs.live2d.com/en/cubism-editor-manual/physics-operation-bake/), [FPS vật lý](https://docs.live2d.com/en/cubism-editor-manual/physics-operation/). Tài liệu Trung văn mô tả lặp key quanh biên cảnh để chỉnh đường cong nối tự nhiên; đây là việc ở mô hình nguồn, không phải phép làm mờ MP4. [Chỉnh vòng lặp](https://docs.live2d.com/zh-CHS/cubism-editor-manual/loop-editing-support/).
