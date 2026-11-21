REFERENCE: demo built 2026-11-14T03:14:59.848Z from branch codex/v3-demo-2026-11-14 @ a81b75f456a2c4dbce3cfdfa17644874cf8c117f (A 66f68bfe31a5e3d51952a2a7f55cba98453f46c6 + B 106c8a3540db45fe8f1557cbd3389241029b9bee); live: http://localhost:5994 ; static: docs/cardrpg-v3-demo/index.html
# Chạy demo V3 A+B
- Chơi ngay: [http://localhost:5994](http://localhost:5994) (tự chuyển sang 127.0.0.1 để ví khách hoạt động).
- Bản lưu: mở `index.html` bằng Chrome; giữ nguyên thư mục `assets/` bên cạnh (tổng khoảng 249 MB, có nhạc và cinematic).
- Cách mở qua web: tại `/Users/bao/taskbar-hero-cardrpg-a6`, chạy `npx serve docs/cardrpg-v3-demo`, rồi mở địa chỉ hiện trong terminal.
- Lộ trình khoảng 5 phút: chọn **Play free**; âm thanh bắt đầu sau cú nhấp đầu tiên, nút loa ở góc trên.
- **Fight → Fight → Skip** hướng dẫn; thắng trận tập → **Next → Welcome → Skip reveal**, rồi đóng cửa sổ Recruit bằng nút ×.
- **Fight → Fight** lần nữa; bấm nút tốc độ hai lần lên **×3**, giữ **Auto** để xem ultimate và chờ **Victory**.
- Ở Victory: bấm biểu tượng sách **Read details → Improve team** để giữ thưởng và kết thúc lượt đi, rồi đóng cửa sổ Team.
- **Forge → Enhance → Skip** hướng dẫn → **Enhance** để nâng +1; đóng hộp nâng cấp, chọn **Materials** để xem túi/tài nguyên.
- Đóng Bag → **Team** để xem đội; đóng Team → nút menu góc trên → **Wallet** để mở ví.
- Giới hạn: ví/kinh tế live dùng Anvil/API cục bộ và mất trạng thái chain khi khởi động lại; bản lưu chỉ chơi/forge offline và xem bảng ví, không giao dịch chain.
- Bản lưu làm mới tài khoản khi tải lại; dùng menu **Saves** để xuất/nhập tiến trình. Q9 S4 (nhịp lời thoại) vẫn tạm dừng, chưa nghiệm thu.
- Tắt toàn bộ máy chủ demo: `kill 46445`; PID và cách khởi động lại nằm trong [reports/v3-demo/HANDOFF-DEMO.md](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v3-demo/HANDOFF-DEMO.md).
