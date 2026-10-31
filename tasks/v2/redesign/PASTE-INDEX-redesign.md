# Redesign: thứ tự dán (Codex và Antigravity), BẢN NHÁP

Living draft. Hướng thiết kế đã duyệt: https://claude.ai/artifact/BkBtGZbDayJHUmEht47Dri (tab "Prompts" có link tới file này).
Toàn bộ prompt: `PASTE-ALL-redesign.txt` (mỗi nhiệm vụ nằm giữa BEGIN/END). Bản trong repo: `tasks/v2/redesign/`.

## Dán ngay (song song, không chạm cùng file)
1. **AGR0** (Antigravity): tokens + khung app (thanh trái, HUD trên). Mọi phase UI khác phải đợi merge cái này.
2. **CXR0** (Codex): bộ test (audit 1600x900, e2e smoke, manifest màn hình). Không cần đợi gì.

## Sau khi AGR0 merge (song song, vùng file riêng; Antigravity tối đa 2 cùng lúc)
3. **AGR1** (Antigravity): Landing + Chọn class + Home.
4. **AGR2** (Antigravity): Bag.
5. **AGR3** (Antigravity): Forge + Market.
6. **AGR4** (Antigravity): Hero + Help + modal/toast/trạng thái lỗi.
7. **AGR5** (Antigravity): Map/Boss. Đợi thêm PR "Fix Boss panel nested scroll UI" merge.

## Sau khi AGR1-AGR4 merge
8. **CXR1** (Codex): test cho các màn hình mới, e2e theo luồng, test contrast.

## Cuối vòng
9. **CXR2** (Codex): lượt chỉnh bug từ ảnh chụp, bundle, a11y (vẫn là bản nháp, lặp lại được).

## Quy tắc chung
- Giữ toàn bộ hình ảnh/art hiện có. Chỉ desktop (1280x720 và 1600x900).
- Không đụng Tier 3 (contracts, auth, supabase, game-rules, .github, dependency).
- Claude CLI chưa dùng được nên Claude không có lane code; Claude chỉ viết prompt, verify và merge khi có.

## Bạn quyết
- Có duyệt thứ tự trên và cho chạy AGR0 + CXR0 ngay không.
- Thanh Hero/Help trên rail: giữ 7 mục hay gộp Help vào HUD.
