# Taskbar Hero · bản demo tích hợp
REFERENCE: tools/cardrpg-big/build.mjs, reports/cardrpg-big/memory/PROMPT.md, reports/cardrpg-big/integration/delivery/source-acceptance.json

Mở [index.html](index.html) trực tiếp trong trình duyệt. File chứa game và tài nguyên offline, 23.937.000 byte; SHA-256 `9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3`. Bản cũ vẫn ở [cardrpg2](../cardrpg2/index.html), và mốc ba mèo đầu ở [slice.html](slice.html).

## Xem nhanh hoặc chơi một vòng
REFERENCE: apps/web/src/game/cardrpg/depth/App.tsx, reports/cardrpg-big/integration/F7-GATES.md

- Bấm **Watch a battle now** trên trang đầu để xem trận tự động.
- Đi theo **Team & cards → Companions → Equipment → Cafe → Tangled Cafe → Prepare → Fight → Result** để thử phần sưu tập và xây đội.
- Trong trận, dùng tốc độ **1×/2×/4×**, **Pause**, **Skip to result**, camera và âm thanh. Bộ điều khiển tự chọn kỹ năng và mục tiêu.
- **Invitations** có lời mời miễn phí, lượt đơn/mười, odds, pity, lịch sử và kết quả gắn tài khoản.
- **Equipment → Collectibles** giải thích công sức và giới hạn thiết kế Relic. Đây là thiết kế chưa mint; demo không tạo giao dịch on-chain.
- **Save & settings → Export save code** để giữ tiến độ; mã xuất có thể nhập lại trong demo.

## Đối chiếu hình ảnh và kỹ năng
REFERENCE: tools/cardrpg-big/offline.tsx, apps/web/src/game/cardrpg/depth/LabEvidence.tsx, tools/cardrpg-big2/studio-check.mjs

**Review studio** có 25 nhân vật với 86 hành động, tua thời gian, tốc độ0,25×/1×, hiệu ứng riêng và ba camera. **Focus stage** ẩn bảng điều khiển để xem sân lớn hơn. **Before / after** chứa 93 mục,160ảnh; các ảnh cũ ghi rõ Earlier. **Feel lab** có thêm overlay bố cục, crop độ nét, ma trận chuyển động, frame graph/MAX/hitch và checklist liên kết tới các màn của brief. Các phòng thử dùng fixture riêng và khôi phục bộ sưu tập khi đóng.

**Mechanics lab** là phần thử nghiệm mặc định OFF theo addendum; mở phòng thử không bật các tùy chọn đó cho tài khoản chơi thường.

## Mốc đã xác minh
REFERENCE: reports/cardrpg-big/integration/delivery/{source-acceptance,postcapture-source}.json, reports/cardrpg-big/integration/F7-GATES.md

Nguồn tích hợp `a106dfca`, [draft #358](https://github.com/ntbaoheyhey/taskbar-hero/pull/358), đã qua typecheck/lint/build,1.730test web,1.020test luật và421E2E. Gallery được kiểm tra ở1280×720,1440×900,1024×600; mọi160ảnh so sánh giải mã offline. Đây là bằng chứng chức năng; đánh giá hình ảnh, video và ma trận hiệu năng trên file này còn được cập nhật trong [báo cáo](../../reports/cardrpg-big/CARDRPG-BIG-REPORT.md).

Độ nét, dải kích thước nhân vật, một số cổng khựng và phân tầng trang bị còn thiếu ở các mốc đã đo. Xem [F7 gates](../../reports/cardrpg-big/integration/F7-GATES.md) để phân biệt đạt, chưa đo và chưa đạt.

## LOOK integration preview
REFERENCE: ../../reports/cardrpg-big/look-ui/PLAN.md; ../../tools/cardrpg-big/build.mjs

The current main demo adopts the published L0 palette/helper and A's original meta materials. It opens with LOOK enabled; use **Look A/B** in the header to compare the opt-in UI. The normal application still starts with the flag off. New 3D models, stage art and full portrait/icon set remain pending from the LOOK lane.

Build this explicit LOOK preview with `BIG_LOOK_V2=1 BIG_PYTHON=/path/to/python-with-Pillow node tools/cardrpg-big/build.mjs`. Set `BIG_OUTPUT_DIR=docs/cardrpg-look` to build a separate preview without replacing this one. Without `BIG_LOOK_V2=1`, the offline build starts with LOOK off. Keep `baseline-v1.html` unchanged.

Sparse checkouts must restore the tracked comparison evidence (93rows/160images); the builder refuses an incomplete set. Current acceptance and exact artifact hashes are in `reports/cardrpg-big/look-ui/`; old receipts still describe their original artifacts.
