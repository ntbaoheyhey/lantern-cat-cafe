# CXI — desktop18/11/2026 UTC
Bản green gần nhất vẫn là v5-m1.13; release4e5fe161a/tagobject2fc64b7c8 đã xác minh remote. Artifact cũ còn nguyên trong work/v5/CXI/releases/v5-m1.13-dist.
Live6301 đang chạy candidate chưa phát hành: ứng dụngf1aa8f49bac2abe757150d591a4b1d1a9b9c56db; indexdfba63586816817be7c9ffdc9586ed7feb2e04454cd341ae36d0bfc9b56c8cd6.
URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3 ; desktop1280×720.
Candidate đã nhận toast/Next, bốn halfAVIF tiết kiệm94.340B với alpha/dimensions giữ nguyên, và T10 thông báo recovery. T9 native decode-failure fallback đạt hai chế độ. T10: không đè HP/controls,10hitpoints,guide/menu thật,luật không đổi và fullRGB phục hồi khớp. Bốn ảnh mới đã đo/xem một lần.
Một probe T10 đầu so sánh UI interaction chưa ổn định được giữ lại. Probe đã thêm control không mất context và cùng pointer/focus/animation state;hai chế độ đều exact trước/sau loss. Không sửa thêm ứng dụng để qua probe.
Full pnpm test m1.14 đạt:5.361passed/11skipped/2expectedfail,5.374total/3.061web;pipeline browser đã chuẩn bị và chỉ khởi chạy sau CXV release. Cold transfer,firsthit,route,recovery,audio paths và ba phim candidate chưa có kết quả.
Số đo m1.13 cũ:7.667.824/8.230.950/7.743.499B;wave3 vượt230.950B. Không dùng làm số đo candidate. AGV T-CXI-11 được giao landing sibling<=65.000B;giữ originals.
Audio source/engine không đổi từm1.13:13gói/544Opus có parity48kHz kế thừa. Sáu fullcallout296.493B/sáu small156.500B của AGS vẫn nguyên hash;264frame48k ngắn hơn nhưng36cueends đều đủ. Không kết luận cắt lời;provenance,timing/gain,mapping/fallback/listening vẫn REDO.
AGS còn sáu TASK hữu ích:T1/T2/T3/T5/T7/T8. AGV12original trên integration khớp approvedhash;12file khác ở lane không được nhập. T-CXV-1/2 vẫn thuộc cặp visual.
Chưa có publicFuji;hosting/fundedFuji/contracts/main/submission là owner-only. Wake cxi-wake ACTIVE mỗi15phút;không xóa hoặc tạo bản trùng.
