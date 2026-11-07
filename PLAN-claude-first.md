# Plan: làm tuần tự, Claude làm phần code quan trọng trước

Nguyên tắc: xong bước nào sang bước kế ngay, không chờ ngày. Codex đang hết token nên không giao việc. Antigravity (Anti) chỉ nhận docs/UI/QA. Claude (Sonnet, medium) làm code lõi. Opus chỉ cho bug khó hoặc phần an ninh.

Lưu ý: mình không đọc được `tasks/v2/wave-m/` và project memory trên máy này, nên các bước dưới đây dựa trên repo (`docs/cutover-v2.md`, `go-live.md`, lịch sử commit, báo cáo M2). Bạn gửi lại danh sách thẻ wave-m thì mình khớp tên thẻ chính xác.

## Bước 0 – Mở đường (cần bạn, ~vài phút)
- [ ] Merge M2 (`ai/antigravity-m2-mechanics`): mình đã verify local, chỉ còn e2e và thao tác GitHub bị chặn. Bạn chạy `scripts/verify-pr.sh <PR> --comment` ở terminal, hoặc bật `sandbox.network.allowLocalBinding`.
- [ ] Merge M2 TRƯỚC P1 (cùng sửa `judge-walkthrough.md`).

## Bước 1 – Code quan trọng (Claude, làm ngay, theo thứ tự)
| # | Việc | Vì sao trước | Test bắt buộc | Mô hình |
|---|------|--------------|---------------|---------|
| C1 | P1 (rebase lên main sau M2, giải xung đột `judge-walkthrough.md`) | Đang chờ M2 | unit + e2e + check-links | Sonnet medium |
| C2 | Kiểm CSP/concealment G3 (báo cáo cũ ghi "blocked CSP verification") | Rủi ro bảo mật hiển thị | e2e CSP + header test | Sonnet high |
| C3 | Điều kiện T-1 của cut-over: đủ 9 hàm `v2-*` trên main, `deploy-functions.yml` có đủ 18 hàm, `check-live.mjs` có health v2 | Chặn cut-over | `pnpm gen:deno` không drift, `check-live.mjs` | Sonnet medium |
| C4 | Rehearsal cut-over lần cuối trên local server (không đụng live) | Chứng minh sẵn sàng | v2-server journeys | Sonnet medium |
| C5 | Bug khó phát sinh từ C1-C4 | Leo thang khi cần | theo bug | Opus |

Mỗi việc: 1 nhánh `ai/claude-<tên>`, `scripts/verify-pr.sh --comment`, không dùng CI (hết phút Actions tới 1/11), không test trên tài khoản live.

## Bước 2 – Việc cho Anti (copy-paste sau khi Claude xong C1)
- A1: QA responsive + a11y lại sau P1, ghi `reports/`.
- A2: Cập nhật `demo-script-v2.md` và screenshot theo UI mới (block-reason của M2).
- A3: Rà `submission.md` / `judge-walkthrough.md` cho khớp tính năng thật.
Vùng file: chỉ docs, reports, UI polish; không config, contract, auth, DB, `.github`, dependency.

## Bước 3 – Codex (tạm dừng)
Không giao gì. Khi có token lại: review chéo C2 (CSP) và contract coverage. Prompt đã có sẵn dạng `docs/prompts/codex-*.md`.

## Quyết định của bạn (mình không tự áp dụng)
1. Hai proposal M2: `forge-great-success.md` và `stepped-bonus-lines.md` (đổi số game → cần bạn duyệt).
2. D6: ngày cut-over (runbook ghi 13/11, muộn nhất 15/11) và D8: nội dung Founder chest.
3. Khi nào bạn sẵn sàng làm các bước production (backup DB, deploy functions, promote Vercel): chỉ bạn có quyền.

## Khi nào dừng và hỏi bạn
Chạm production, bí mật, đổi số game, hoặc test fail mà không xác định được nguyên nhân.
