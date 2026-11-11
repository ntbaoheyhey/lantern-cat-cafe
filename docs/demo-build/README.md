# Bản demo chơi được: lane A6 + lane B

Nguồn: commit `5c6c3a64d` của lane A6 ("A6 Q14: integrate published B clean Mochi production checkpoint"),
đã gộp sẵn tip lane B `d5c34d233` (D3 checkpoint). Build bằng `node tools/cardrpg-a6/build.mjs`,
cờ `a6=1`, UI v3, puppet art đều bật sẵn trong tệp. Không cần mạng, không cần ví.

## Mở demo

Cách 1, nhanh nhất: mở thẳng `docs/demo-build/index.html` bằng Chrome hoặc Edge.

Cách 2, qua localhost (cổng 5940):

```bash
pnpm demo:play
```

rồi vào http://localhost:5940/

## Chơi thử 5 phút

1. Night Patrol → Fight: mèo tự đánh, xem HP và nộ.
2. Next → Recruit → Welcome a friend: lật thẻ nhân vật.
3. Cats: lên cấp một mèo, xem Power, Growth, Skills, Bonds, Gear.
4. Team → Suggested teams: chọn đội, đổi hàng trước/sau.
5. Night Patrol tiếp, bật ×3 để thấy boss và tuyệt kỹ nhanh hơn.
6. Thắng chương đầu → Yarn Tower, rương mốc mỗi 5 tầng.
7. Events nhận quà; Bag xem trang bị; Relics → Load demo relics.
8. Open menu → Export / import để lưu tiến trình trước khi tải lại.

## Có gì của lane B trong bản này

- Chuẩn kích thước nhân vật D2: mọi mèo cùng chiều cao, boss chiếm khoảng một nửa khung.
- Tooltip trạng thái D2b lấy đúng mô tả từ bộ luật đang chạy.
- Mochi 3D (D3) mới là bản thử chưa nghiệm thu, nên **chưa** gắn vào game ở bản này.

## Ảnh

`shots/` là ảnh chụp thật từ bản offline A6 Q49/Q50; mã game (apps/, packages/, assets/)
giống hệt commit này (chỉ khác công cụ và báo cáo của lane B).
