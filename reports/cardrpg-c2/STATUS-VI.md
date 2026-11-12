# C2 — trạng thái cuối đợt 12/11

Đã hoàn thành triển khai, đo kiểm và tích hợp cục bộ; chưa đạt toàn bộ mục tiêu cân bằng. PR nhánh C2: [#440](https://github.com/ntbaoheyhey/taskbar-hero/pull/440); PR tích hợp: [#442](https://github.com/ntbaoheyhey/taskbar-hero/pull/442). Cả hai vẫn là draft.

Bản tích hợp đạt4.514 kiểm thử package +56 script +118 hợp đồng;435/435 browser và2/2 luồng Anvil; typecheck/lint/build đạt. Hai lượt kiểm tra33màn hình (chưa đăng nhập/guest) đều tối đa25từ. Đã xem ảnh đội hình, HUD, boss và market trên desktop/mobile. Hai expected-fail và11skip nghiên cứu kế thừa được ghi rõ.

600tài khoản×30ngày đã xong. Người chơi30phút/ngày nhận Epic trung vị ngày1, Legendary ngày11;12tỷ lệ chi/thu tiền mềm đều trong0,8–1,1. Toàn bộ số lượng vật phẩm/tuần ở OUTBOX.md và WEEKLY-SUPPLY.json. Daily dùng chung seed lịch; kết quả Legendary ngày1 của nhóm chơi lâu không phải200lượt ngẫu nhiên độc lập giữa ngày.

VFX:86mục đã nhận, gồm78hiệu ứng sự kiện và8bản xem trước nội tại chỉ số;5.783.929byte. Nhân vật vẫn dùng slot/rig hiện có, chờ Spine cuối của họa sĩ.

Chưa đạt: mô phỏng thua đầu tiên sớm12,593giây; trung vị HP sau trận thường còn cao. Bốn ô kiểm tra item gốc còn13điểm phần trăm; mẫu độc lập đạt4,6–11điểm nhưng khoảng Crumbweave vẫn vượt12. B4 đã dùng đủ3lượt; B4b đã sửa và đo lại sau lượt quay lại, không đổi tên kết quả trượt thành đạt.

Chạy `pnpm demo:play` để mở demo guest cục bộ ở5940. Chưa bật mint từ save chiến dịch không đáng tin cậy hoặc thưởng định kỳ; Treasure chỉ trang trí. Hai điểm đồng bộ15/17-11, retime Spine và kiểm thử/deploy Fuji của chủ dự án vẫn ở phía trước. Chi tiết: C2-REPORT.md, ECONOMY.md, B5.md và docs/demo-build/CHAY-DEMO.md.
