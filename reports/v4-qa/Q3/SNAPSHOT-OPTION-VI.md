# Phương án repo snapshot — đang đo, 2026-11-17T02:57:22.518797+00:00
Đây là rehearsal trên SHIP `da3323ba9ce10ababc5519511d40dc9592febfe3`, chưa phải freeze19/11. Chưa tạo repo remote hay đẩy snapshot.

| Phương án | Điều kiện | Hiện trạng |
|---|---|---|
| A: chia sẻ repo hiện tại | Chủ repo xác minh toàn bộ lịch sử, refs và tệp cần công khai; không dùng kết quả scan snapshot để thay thế lịch sử. | QA không tự công bố repo hay kết luận full-history đã sạch. |
| B: repo mới một commit từ freeze | Chốt cây phát hành, giữ submodule pins, scan cây và commit mới, thử fresh quick-start, rồi người dùng quyết định tạo/chia sẻ remote. | Export full tree đã xong; commit, scan và quick-start đang chạy/đợi load guard. |

## Dung lượng đã đo
Cây nguồn có95.464blob,31.267.821.987byte. Trong đó reports29.272.128.476byte/84.298file; screenshots171.336.615byte/847file. Các demo docs lịch sử được đề xuất xem xét loại bỏ chiếm871.829.321byte/790file. Phần còn lại theo đề xuất khoảng952.527.575byte/9.529file; đây chưa phải bản đã build sau khi lọc.
File lớn nhất72.484.813byte là telemetryJSON. Dung lượng working tree không tương đương dung lượng `.git` nén hay gói push. GitHub khuyến nghị `.git` không quá10GB và giới hạn mỗi push2GB; cần đo đúng artifact trước khi xuất bản. [GitHub repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits).

## Đề xuất exclude để SHIP/người dùng duyệt
`reports/**` nên thay bằng bằng chứng hiện hành đã chọn; `screenshots/**` chuyển thành artifact riêng. Xem các prefix demo docs trong `export-exclude-proposal.json` và kiểm tra liên kết trước khi bỏ. Nếu có, loại `work/**`, `private/**`, raw captures, `.DS_Store`, và tệp thiết kế không cần cho build. Không bỏ source/assets runtime, licence, lockfile, ABI/registry hay submodule pins.
89đường dẫn tên inbox/handoff/env/private cần xét mục đích công khai; tên tệp không chứng minh có secret. Chưa sửa hoặc xóa bất kỳ tệp nguồn/snapshot nào. Các liên kết README tới reports phải được giữ hoặc thay bằng bằng chứng phù hợp trước khi xuất bản.

## Các bước ngày20–21/11
1. Chọn freezeSHA thực tế và quyết định A/B. Với A, đợi người phụ trách xác minh full history trước khi chia sẻ.
2. Với B, tạo thư mục mới, `git archive` freezeSHA vào đó; kiểm tra exclude/README/credits trên bản xuất và giữ hai gitlink từ `git ls-tree -r` của chính freezeSHA.
3. `git init`; stage cây xuất và thêm gitlink mode160000 với SHA đã ghi nhận, rồi tạo đúng một commit local. Chưa thêm remote. Rehearsal này kiểm tra tree hash bằng nguồn trước commit.
4. Chạy `git submodule update --init --recursive`, frozen install và README typecheck/test/build. Xác minh link licence/metadata và local dev/journey trên cổng phù hợp.
5. Chạy `gitleaks dir <export> --redact=100` và `gitleaks git <export> --redact=100`; chỉ lưu file:line/rule trong báo cáo chia sẻ. Xử lý mọi match chưa giải thích và scan lại đúng bản cuối.
6. Đo `.git` và gói dự kiến push; kiểm tra logged-out các URL dành cho giám khảo. Người dùng tự quyết định tạo remote và công bố sau khi xem kết quả. QA không thực hiện bước đó.

## Chưa kết luận
Scan và fresh quick-start chưa hoàn tất. README full supervisor cố định cổng5994/5997/8546 ngoài quyền QA; rehearsal chỉ đổi port của lệnh frontend-dev được README hỗ trợ sang6203. Full local journey đã có bằng chứng Q1/Q2 riêng. Một parent commit không làm mất yêu cầu licence hay lịch sử riêng của submodule công khai.
