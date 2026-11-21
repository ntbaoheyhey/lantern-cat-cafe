# Chạy bản demo tích hợp C2 + CHAIN

Bản này dùng đội hình bốn mèo, HUD gọn, 78 hiệu ứng gắn với sự kiện chiến đấu và tám bản xem trước nội tại tăng chỉ số. Nhân vật vẫn dùng slot/rig placeholder đang có; chưa thay bằng tranh nhân vật AI.

## Chạy cục bộ với Anvil

Cần Node, pnpm, Foundry (`anvil` và `forge`) đã có trong PATH. Tại thư mục repo:

```sh
pnpm install --frozen-lockfile
pnpm demo:play
```

Mở [game cục bộ](http://127.0.0.1:5940/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1). Lệnh chạy game ở cổng 5940, RPC Anvil ở 5971 và API cục bộ ở 5972. Máy chủ chỉ nghe trên loopback; không tự mở cửa sổ Chrome. Ctrl-C dừng cả ba dịch vụ. Không chạy đồng thời bộ E2E dùng các cổng này.

Mở menu **☰ → Wallet → Play as guest**, đợi số dư gas xuất hiện. Đóng bảng ví bằng **×** hoặc **Escape** để chơi tuyến chiến đấu. Mở lại **Wallet → Market** để thử Judge pass → Fight boss → Mint → Bag → List. Một phiên trình duyệt riêng có thể đóng vai người mua. Các giao dịch ở chế độ này là giao dịch Anvil thật; liên kết Snowtrace trỏ tới explorer Fuji nên không tra được hash Anvil.

Dữ liệu chain cục bộ được tạo lại mỗi lần khởi động. Dùng hồ sơ trình duyệt riêng cho Anvil; giữ hồ sơ Fuji tách biệt. Không cần nhập ví cá nhân hoặc khóa ký của dự án. Lệnh không đọc tệp `.env` và không tự deploy lên mạng công khai.

## Chọn Fuji bằng biến môi trường

```sh
DEMO_CHAIN=fuji VITE_SUPABASE_URL=https://PROJECT.supabase.co pnpm demo:play
```

Thay `PROJECT` bằng URL công khai của backend Fuji đã cấu hình. Có thể truyền `VITE_FUJI_RPC_URL`, `VITE_YARN_ADDRESS`, `VITE_MARKET_V2_ADDRESS` và `VITE_SEASON_REWARDS_ADDRESS` bằng các địa chỉ công khai đã được chủ dự án xác nhận. Không truyền private key hay khóa service-role. Chế độ Fuji không khởi động Anvil hoặc tự triển khai hợp đồng; người dùng chủ động bấm các giao dịch trong game. Kiểm thử công khai và triển khai do chủ dự án thực hiện.

## Xem bản walkthrough tĩnh

Mở `docs/demo-build/index.html` và giữ thư mục `media` bên cạnh. Các ảnh là ảnh chụp game đang chạy. Bộ [VFX](../vfx/index.html), [đội hình](../cardrpg-c2/formation.html) và [đường cong độ hiếm](../cardrpg-c2/economy-rarity.svg) nằm trong repo để xem thêm.

Bản Judge dùng nguồn thưởng phía máy chủ riêng. Vật phẩm kiếm được trong save chiến dịch trên trình duyệt chưa phải chứng từ đáng tin cậy để mint. Treasure on-chain vẫn chỉ là trang trí. Chỉ số chiến đấu, tác động vật phẩm, kinh tế và các mẫu kiểm tra độc lập mới nhất nằm trong [báo cáo C2](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/cardrpg-c2/C2-REPORT.md). Các kết quả cũ vẫn được giữ để đối chiếu; việc demo chạy thành công không thay thế bằng chứng cân bằng hoặc quyền mint vật phẩm.
