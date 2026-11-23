# Lantern Cat Café · Báo cáo kết thúc UniHack

Ngày 23/11/2026. Bản game dự thi là [v5-m2.18](https://github.com/ntbaoheyhey/lantern-cat-cafe/tree/v5-m2.18). Team xác nhận đã nộp đúng. [Team1 công bố mười finalist](https://x.com/Team1VN/status/2124850456241348847). Điểm riêng của team, điểm cắt và nhận xét trực tiếp của giám khảo còn thiếu.

**Điều đáng giữ là khả năng chứng minh hệ thống đã chạy thật. Điều đáng đổi trong cách làm là thứ tự kiểm chứng.** Team chứng minh được hai ví trao đổi Moon Collar. Hồ sơ còn ít bằng chứng về việc một người chơi ngoài team chủ động muốn giữ hoặc tặng chiếc vòng. Phần art cho một bài học tương tự: bản chuyển từ ảnh sang 3D đã tạo được khối có thể xoay, còn việc Mochi có thể dùng khiên một cách thuyết phục cần một phép thử riêng.

## Kết quả và giới hạn

| Câu hỏi | Kết quả kiểm được | Giới hạn |
| --- | --- | --- |
| Đúng bản nào? | Tag thi trỏ tới `e8abba972`. Bản hướng dẫn công khai ở `f9ad06462`. Đã đối chiếu trọn 13.529 đường dẫn và mã đối tượng của cây main với GitHub. | Các nhánh thử, bản quay rút gọn và bản public là những mốc riêng. [Kiểm kê GitHub](GITHUB.md) |
| Code có chạy lại được? | Cài từ lockfile offline trên Node 24.22.2 và pnpm 10.28.0. Typecheck, lint, build và lệnh test toàn workspace trả mã 0. Có 5.615 test đạt, 11 bỏ qua, hai dự kiến thất bại. Foundry riêng có 128/128 test đạt. | Lint của web cũng chạy TypeScript. Hai job này kiểm chồng nhau. Test component cần được bổ sung bằng việc kiểm hành trình thực tế. [Sổ bằng chứng](EVIDENCE.md) |
| Blockchain có thật? | Có mint từ bản web ở block 61.409.492. Trong lần chạy riêng của listing #6, người mua nhận một vòng, người bán rút 0,00095 test AVAX. Đọc số dư ở block 61.406.037 cho kết quả người mua 1 và người bán 0. | Hai ví thuộc lượt kiểm thử của team. Số người dùng độc lập cần nguồn khác. [Kết quả đọc Fuji](verification.json) |
| Vì sao hụt Top 10? | Theo đánh giá Codex, hai mục kỹ thuật đạt 40/50. Sáng tạo, tác động và trải nghiệm đạt 21/40. Năm mục có thể chấm cho 61/90. Mốc 67/100 dùng thêm 6/10 cho tài liệu dựng pitch trong Git. | Mức 67 phụ thuộc giả định về pitch. Chưa có căn cứ để suy ra thứ hạng từ con số đó. [Phiếu điểm và giả định](DIEM-HAU-KIEM.md) |
| Công sức nào đáng giá? | Luật dùng chung, khả năng chạy lại, đối soát giao dịch, đồng bộ nhân vật qua các màn và các lỗi được sửa sau khi chơi xuyên chương đều có kết quả quan sát được. | Không có bảng giờ và token theo đầu việc để tính tiền lãng phí hay đánh giá năng suất cá nhân. [Tiến trình](README.md) |

## Mochi đã được tạo và hiển thị như thế nào?

**1. Concept và vai trò chiến đấu.** Nhật ký ngày 09/11 ghi concept Mochi được tạo bằng ImageGen. Prompt mô tả đặc điểm nhận dạng, tạp dề, khiên gỗ và chiếc đèn. Nhận xét thẩm mỹ của người đánh giá là hình trung tính cho người xem nhận ra một chú mèo của quán cà phê, còn thế cầm khiên và cách chịu lực cần được diễn tả thêm. Repo cũng có prompt yêu cầu bảng bốn góc. Một bảng xoay nhân vật trả lời câu hỏi về thể tích. Một bản vẽ tư thế trụ chân và nâng khiên trả lời câu hỏi khác về diễn xuất. [Nhật ký concept](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/assets/provenance/look.md#L143) · [Yêu cầu bốn góc](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/tools/cardrpg-look/art-rebuild/real3d/mochi-turnaround-prompt.txt)

**2. Đợt thử dựng 3D.** Team đưa PNG Mochi vào TRELLIS.2. Bản GLB xuất thành công có 96.900 tam giác theo nhật ký. Khi đọc tệp gốc, hậu kiểm thấy một mesh, chưa có skin hoặc hoạt họa nhúng. Team sau đó thử bản rig 14 khớp. Ở phương án tách khối ngày 10/11, có đường hở khi tách bề mặt. Phương án dự phòng giữ thân, tạp dề và khiên chung một khối, hạn chế tầm vươn độc lập của tay. Việc các thử nghiệm này tồn tại trong Git chưa chứng minh mesh ấy được dùng để vẽ cơ thể ở bản thi cuối. [Mesh và rig thử](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/assets/provenance/look.md#L175) · [Quyết định về khối cứng](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/assets/provenance/look.md#L199)

**3. Đường dựng trong bản dự thi.** Khi media của designer nạp thành công, Three.js vẽ phần thân bằng video có nền trong trên một mặt phẳng. Tệp idle của Mochi giải mã được 300 khung ở 30 fps. Khi tung chiêu, vòng idle có thể chậm còn 0,25 lần tốc độ, còn tư thế chung được tạo bằng di chuyển, xoay và thay tỉ lệ toàn thân. Trong cú lao có ba lớp dư ảnh lấy vị trí trễ 40, 80 và 120 ms. Hiệu ứng va chạm và phần nổ có hoạt họa riêng. Điều này giải thích được cảm giác người xem mô tả là “các hình phẳng đè lên nhau”, dù tệp thực tế có nhiều khung. Đầu ra phần nhìn của designer và mô hình 3D thử nghiệm là hai dấu vết riêng. [Bộ phát phần thân](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/apps/web/src/game/cardrpg/spine/designer-video.ts#L58) · [Chuyển động của cả thân](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/apps/web/src/game/cardrpg/spine/scene.ts#L419) · [Dư ảnh và nhịp chiêu](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/apps/web/src/game/cardrpg/ultimate/director.ts#L116)

**4. Hai mẫu OMG 3Q.** Trong video hướng dẫn tân thủ, đoạn khoảng 00:44–00:46 cho thấy kiếm đổi từ thế thấp sang cao rồi hạ so với thân người. Trong video Lưu Kim Triệu Vân, khoảng 03:03,8–03:04,3, đường bao của sinh vật xanh đổi góc trước khi nước đánh trúng. So với đoạn Mochi 32,00–34,60 giây, khác biệt dễ đọc là tư thế và vũ khí thay đổi tương quan trước tác động. Đây là quan sát trên khung hình của các video tham chiếu. Công nghệ nội bộ của nhà làm OMG 3Q chưa được xác định từ các clip này. [Khung Mochi trong media đã công bố của Lantern](figures/02-mochi.jpg)

**Kết luận về cách làm art.** Ảnh AI có thể dùng như phác thảo. Rủi ro ở trường hợp này là đi tiếp từ hình nhân vật đứng chờ sang sản xuất trước khi dáng dùng khiên ở kích thước chơi đủ sức thuyết phục người duyệt. Một chiếc khiên cần điểm nắm và trục quay. Một chiếc đèn treo cần vị trí móc để có thể đuổi theo chuyển động. Người thiết kế, người dựng và người duyệt cần thấy cùng động tác trước khi nhân rộng. Việc đồng bộ diện mạo Mochi ở PR #454 đã cải thiện tính nhất quán và đáng ghi nhận. [So sánh hình trước/sau](figures/03-mochi-qua-cac-man.jpg)

## Coding, phối hợp và giá trị người dùng

| Dấu vết | Kinh nghiệm chuyển được sang dự án khác |
| --- | --- |
| PR #459 đặt phần thưởng vào `RouteComplete`. Campaign lại hiện `RouteC2`. PR #468 sửa trước bản thi. Hai lần merge cách nhau 3 giờ 05 phút. | Khi nói “tính năng xong”, nêu đường vào, loại save hoặc tài khoản, thao tác và kết quả người dùng nhìn thấy. Một tính năng còn có thể bị lạc đường dù logic riêng của nó đúng. [PR #459](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/459) · [PR #468](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/468) |
| Khi voucher đã dùng, client tránh mint trùng. Một probe JSDOM lại tái hiện màn thưởng ghi người chơi hiện đang giữ vật, dù chưa đọc số dư. | Phân biệt một sự kiện trong quá khứ với trạng thái hiện tại. Đặt ca “nhận, bán, quay lại” bên cạnh ca nhận lần đầu. [Hậu kiểm code](GITHUB.md) |
| Có đợt QA rút năm phát hiện vì mở nhầm giao diện cũ. Ở đợt khác, team nhanh chóng sửa tia sáng che lông Mochi sau khi xem lại cảnh thực. | Mỗi buổi review cần cùng bản build, đường vào, camera và tình huống. Chất lượng nhận xét phụ thuộc mạnh vào việc đang xem đúng đối tượng. [Bằng chứng theo nhánh](GITHUB.md) |
| Team nghiên cứu tài liệu về 34 game. Có 20/20 hành trình QA tự động trong một đợt thử cô lập. Giao dịch Fuji có thể được đọc độc lập. | Nghiên cứu tham chiếu, test tự động và hành vi của người dùng thật trả lời ba câu hỏi khác nhau. Phần còn bỏ ngỏ của Lantern là người ngoài team có tự muốn chơi tiếp, giữ hoặc tặng chiếc vòng và vì sao. [Nghiên cứu của team](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/f9ad06462/docs/design/cardrpg/RESEARCH.md) · [Sổ kiểm chứng](EVIDENCE.md) |

## Hai skill được bàn giao

- [Duyệt concept nhân vật cho hoạt họa](../../../.agents/skills/duyet-concept-cho-hoat-hoa/SKILL.md) giúp phát hiện sớm một thiết kế đẹp ở hình tĩnh nhưng thiếu thông tin về khớp, mặt khuất, đạo cụ hoặc tư thế chính.
- [Hậu kiểm hackathon theo bằng chứng](../../../.agents/skills/hau-kiem-hackathon-theo-bang-chung/SKILL.md) giúp tái dựng đúng bản thi, chấm có trọng số và rút bài học về tổ chức code, luồng người dùng và giá trị sản phẩm.

Claude có thể đọc [phương pháp](PHUONG-PHAP-CHAM.md), tự cho điểm rồi đối chiếu [phiếu của Codex](DIEM-HAU-KIEM.md). Khi có thông tin mới từ BGK hoặc người chơi, ghi rõ nguồn, phiên bản và nhận định nào cần đổi.
