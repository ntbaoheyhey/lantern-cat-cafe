# Sổ bằng chứng để kiểm tra lại

Hậu kiểm ngày 23/11/2026, giờ Việt Nam. Bản chính ở [README.md](README.md). Dữ liệu đọc trực tiếp từ Fuji, tên commit, cỡ mẫu và kết quả test ở [verification.json](verification.json). Hai bảng hình đầu lấy từ media đã công bố. Bảng hình thứ ba trích trực tiếp bốn đường dẫn asset ở hai cây Git trước và sau PR #454. Phụ lục [hậu kiểm GitHub](GITHUB.md) có toàn bộ phạm vi nhánh và mã nguồn.

## Các phiên bản

| Dùng để làm gì | Mốc Git | Giới hạn |
| --- | --- | --- |
| Xác định game dự thi | [`v5-m2.18` → `e8abba972`](https://github.com/ntbaoheyhey/lantern-cat-cafe/tree/e8abba9728e842311b4faecc07117bf6b079dce9) | Tên tag do dự án công bố. |
| Kiểm trang giới thiệu, repo và bằng chứng cuối trước lúc đóng cổng | [`f9ad06462` trên main](https://github.com/ntbaoheyhey/lantern-cat-cafe/tree/f9ad06462c8024bcbf7b359f111916b3bd720e53) | Bản này có cập nhật tên, đường dẫn và tài liệu sau tag. Trang chơi trả HTTP 200 lúc hậu kiểm, với entry asset trong JSON. HTTP không cho biết một phiên chấm đã trải qua những gì. |
| Xem chuyển động | [Media v5-m2.16 trong bản công bố](https://github.com/ntbaoheyhey/lantern-cat-cafe/tree/f9ad06462/docs/demo-v5-m2.16) và [arena ngày 20/11](https://github.com/ntbaoheyhey/lantern-cat-cafe/tree/6642fb52c43c7480314926e4fb9742f84d5685e1/docs/arena-2026-11-20) | Đã đọc video qua khung giải mã và ảnh gốc. Ở file v5-m2.16 chỉ có một video stream H.264, 1280 × 720, 30 fps, 57,933333 giây. Không suy diễn âm thanh hoặc FPS thật trên thiết bị. |
| Kiểm nội dung pitch có căn cứ thời gian | [Timeline 120 giây](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/0b576bdfc618e2d898639c41b08f77a56c112da9/trailer/timeline.json) và [bản dựng](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/0b576bdfc618e2d898639c41b08f77a56c112da9/trailer/cut.json) | Nhánh dựng ghi footage từ `f8cd3aa` và một số cảnh quay lại ở `4699a30`. Bản dựng 120 giây và clip 58 giây trong README là hai sản phẩm khác nhau. Video và slide thật sự được mở theo thứ tự nào nằm ngoài dữ liệu. |
| Chạy hậu kiểm kỹ thuật cục bộ | [`e9c57cb04` trên repo Lantern](https://github.com/ntbaoheyhey/lantern-cat-cafe/commit/e9c57cb0402dc260dcf8c53fc46bb240fb29e114) | Checkout này có bốn tệp khác nội dung so với bản giới thiệu, thuộc portrait, scene và smoke. Bảng test ghi kết quả theo checkout này. CI của PR công bố được kiểm độc lập. |

Tại `f9ad06462`, Git có 13.529 đường dẫn được theo dõi và 3.215 commit reachable, trong đó 266 trên tuyến first-parent của main. Đã rà lịch sử nhánh và tag, cây tệp, các đường vào sản phẩm, tài liệu thiết kế, code phụ trách render/trạng thái game, xác thực, phát hành, hợp đồng, bộ test và media. Các con số đếm theo Git, bao gồm asset, công cụ, lịch sử tích hợp. Chúng không đo số giờ, năng suất hay token.

## Nhận định và phép kiểm ngược

| Nhận định | Nguồn gốc | Loại bằng chứng, điều cần kiểm lại |
| --- | --- | --- |
| Đội dừng ở vòng online và đã nộp đúng | [Công bố Team1](https://x.com/Team1VN/status/2124850456241348847), [sự kiện Team1](https://luma.com/dar03gfl), xác nhận của đội | Danh sách đối chiếu ở JSON. Thứ tự tên theo bài đăng. Phần riêng của ban giám khảo chưa có. |
| Kỹ thuật và Avalanche chiếm 50/100 | [FAQ](https://team1vn.xyz/) và [dữ liệu BTC](https://team1vn.xyz/topics.json) | Hai trang cùng một nhà xuất bản. Rubric có thể thay đổi theo ghi chú trong dữ liệu. Không có phép chuyển từ số test/hợp đồng thành điểm BGK. |
| Hướng dẫn về phần thưởng có thể ảnh hưởng đến độ phù hợp | [Bộ ý tưởng](https://team1vn.xyz/topics.json), [cách BTC giới thiệu ý tưởng](https://team1vn.xyz/#ideas), [kinh tế của Lantern](../../ECONOMY.md), [mã invitation](../../../packages/game-rules/src/cardrpg/depth/gacha-v4.ts), [voucher finale](../../../apps/web/src/game/cardrpg/chain/journey-client.ts) | Tệp ý tưởng công khai tự ghi tạo ngày 23/11. Chưa tìm thấy bản công khai đóng dấu trước hạn để khẳng định nguyên văn áp dụng hôm chấm. Bỏ hẳn giả thuyết về điểm trừ nếu BTC xác nhận quy tắc chỉ áp dụng cho đề gợi ý hoặc không liên quan tới loot ngoài chuỗi. |
| Cạnh tranh được bằng một công dụng cụ thể | [Commitment Stake](https://github.com/huyle85/Commitment-Stake/blob/ef958354b8558cef5d7b822114cc4cba05bf6e1d/README.md), [FleetShares](https://github.com/kongou2002/rwa-fleet/blob/3cc9666d20dae9cdb49e871c10173caf042fe75c/README.md) và danh sách Team1 | Hai repo tự mô tả cách dùng, được lấy theo commit trước 09:00 giờ Việt Nam ngày 22/11. Chỉ đối chiếu khả năng nói rõ người dùng, quyền lợi và hành động. Không chứng thực doanh thu, số người dùng hoặc chất lượng toàn sản phẩm của các đội khác. |
| Cảm giác cứng có nguyên nhân kiểm được ở đường media | [Bộ phát](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/apps/web/src/game/cardrpg/spine/designer-video.ts#L95), [chuyển động cảnh](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/apps/web/src/game/cardrpg/spine/scene.ts#L418), [phim 6 khung](figures/02-mochi.jpg) | Cơ chế gắn video và biến đổi toàn thân là quan sát trong mã. Đánh giá thiếu trọng lượng là nhận xét thị giác. Nếu một bản có pose riêng cho cùng đòn, cần so A/B tại cùng góc máy, tốc độ và mục tiêu. |
| Đội đã nghiên cứu và đã có thẩm mỹ mục tiêu | [Nghiên cứu 34 game](../../design/cardrpg/RESEARCH.md), [pilot pixel](../../art-direction.md), [look bible](../../design/cardrpg/LOOK-BIBLE.md) | Những tài liệu này mô tả các thế hệ thiết kế khác nhau. Đặc tả tỉ lệ, ánh sáng và màu là mục tiêu của bản đó. Phản hồi thực tế của một người chơi cần chứng cứ riêng. |
| Có QA hành trình tự động | [Hai kích thước, mỗi kích thước 10 lượt](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S4/final-journeys-1.json) | 20 hồ sơ sạch trên Anvil/SQL ở giai đoạn V4. Trung vị tới receipt khoảng 95 giây ở cả hai kích thước. Không chuyển con số này sang người dùng, testnet công khai hay bản dự thi cuối. |
| Có mint thật và người mua nhận được vật phẩm | [Sổ giao dịch của đội](../../avalanche/LIVE-E2E.md), [kết quả đọc RPC độc lập](verification.json), [giao dịch mua](https://testnet.snowtrace.io/tx/0x119b1df911379c7cf3dda5029c4a8158c25cc22d22d8fca647bb404533a6a455) | 8 receipt đọc lại thành công, gồm 1 hosted mint và 7 bước của lần chạy finale. Event của contract, ví gửi/nhận và số dư ở block rút tiền khớp. Giao dịch do đội kiểm thử không đại diện cho hai người dùng tự nguyện ngoài nhóm. |
| Nhu cầu của người chơi quyết định kết quả kinh tế | [Mô hình](../../../tools/economy/sim.mjs) và [bảng kịch bản](../../economy/SIM-REPORT.md) | Mô phỏng lặp lại cùng seed. Ước tính người chơi tương lai là tham số đầu vào. Cần dữ liệu hành vi để biết kịch bản nào sát thực tế. |
| Hướng sửa thẩm mỹ có cơ sở nghề nghiệp | [Riot về tư thế và nhịp](https://www.riotgames.com/en/artedu/character-animation), [Riot về thứ tự thu hút mắt](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/), [Valve về silhouette và mảng sáng tối](https://help.steampowered.com/en/faqs/view/0688-7692-4D5A-1935) | Dùng nguyên tắc nhận biết hành động và vai trò. Phong cách hình ảnh của Lantern có thể giữ cá tính riêng. |

Nguồn của BTC hiện hiển thị hạn **09:00 ngày 22/11 giờ Việt Nam**. Thông báo ngày 19/11 trên X dùng mốc **23:59 ngày 21/11**. Bản giới thiệu cuối xuất hiện trước cả hai mốc. Sự khác nhau này không thay đổi kết luận về quy trình nộp. [FAQ hiện tại](https://team1vn.xyz/#faq-submit) · [Thông báo ngày 19/11](https://x.com/Team1VN/status/2123242119251083717)

## Build và kiểm thử trọn workspace ở đúng tag dự thi

Khôi phục tag **v5-m2.18**, commit **e8abba972**, trong clone tạm tách khỏi nhánh tác nghiệp. Hai submodule được đọc đúng SHA do superproject ghim. Node 24.22.2 và pnpm 10.28.0. Cài dependency bằng `pnpm install --offline --frozen-lockfile`. Typecheck, lint và build thành công trong lần lượt 19,4, 16,4 và 21,6 giây trên máy hậu kiểm. Repo quy định lint web cũng sử dụng TypeScript. Đây là thời gian của một lần chạy.

| Lệnh/bộ | Đạt | Bỏ qua | Dự kiến thất bại |
| --- | ---: | ---: | ---: |
| Script Node ở gốc | 77 | 0 | 0 |
| auth | 26 | 0 | 0 |
| chain | 32 | 0 | 0 |
| game-rules | 1.420 | 11 | 2 |
| supabase-tests | 742 | 0 | 0 |
| api-contract | 16 | 0 | 0 |
| web | 3.302 | 0 | 0 |
| **Tổng của pnpm test** | **5.615** | **11** | **2** |
| Foundry, chạy riêng | 128 | 0 | 0 |

Lệnh `pnpm test` đầy đủ hoàn tất sau 177,6 giây, exit 0. Hai test dự kiến thất bại là biến thể của kỳ vọng loot V2. Có thêm 5/5 test chọn lọc cho màn nhận Relic và Auto sau khi thua trên nhánh làm việc. Phép thử JSDOM mới cho lỗi thông báo sở hữu dùng component đúng tag thi. Các lần chọn lọc dùng để giải thích hành vi, không cộng dồn vào tổng. [Test loot có đánh dấu](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/v5-m2.18/packages/game-rules/src/v2/lootcheck/lootcheck.test.ts#L41) · [Kết quả máy theo package](verification.json)

## Cách lặp lại bằng chứng từ repo Lantern

Môi trường dự án dùng Node 24, pnpm 10.28.0 và Foundry với các submodule đã khởi tạo. Có thể kiểm mốc bằng `git rev-parse 'v5-m2.18^{}'`. Ba nhóm test dưới đây đã chạy trong hậu kiểm. Không cần mở một cửa sổ trình duyệt để chạy chúng.

~~~sh
pnpm --dir apps/web exec vitest run src/game-entry-loader.test.ts src/game/cardrpg/depth/demo-v9.test.ts src/game/cardrpg/depth/RouteComplete.test.tsx src/game/cardrpg/spine/media-clip-contact.test.ts src/game/cardrpg/spine/designer-video.test.ts
pnpm --dir supabase/tests exec vitest run src/chain-judge.test.ts src/guest-drip.test.ts
forge test --root contracts --offline
node --input-type=module -e "import {runAll} from './tools/economy/sim.mjs'; console.table(runAll().results.filter(r => r.policy === 'burn-backed').map(r => [r.id, r.burnPerClaim, r.withdrawFill]))"
~~~

Phép thử tại chỗ dùng thư mục output và cache tạm cho Foundry. Kết quả lần lượt 46/46, 14/14 và 128/128. Trong PR #472, GitHub chạy được Node, E2E web và chain-E2E ở head `7131cc799`. Các test chain của CI dùng môi trường cô lập. Proof về mạng công khai đến từ receipt riêng. [CI](https://github.com/ntbaoheyhey/lantern-cat-cafe/actions/runs/44913116333)

Kiểm khung số 1011, mốc 33,70 giây, với chỉ số bắt đầu từ 0. Video gốc có SHA-256 `2db3198813715ce3db8dc502c411bdf5edc2086a9a2be36c491c79f1a251d4d4`. Hình ghép chỉ thu nhỏ nguyên khung và đặt thời điểm bên dưới.

~~~sh
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,duration -of json docs/demo-v5-m2.16/demo.mp4
ffmpeg -v error -i docs/demo-v5-m2.16/demo.mp4 -vf 'select=eq(n\,1011)' -frames:v 1 /tmp/lantern-mochi-frame-1011.png
~~~

Phép đọc Fuji không ký hoặc gửi giao dịch. Ví của người bán và người mua bên dưới là địa chỉ công khai của lần thử trong repo. Hai lệnh cuối đọc số dư của riêng **token ID 3** tại block sau khi người bán rút tiền.

~~~sh
rpc='https://api.avax-test.network/ext/bc/C/rpc'
nft='0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D'
market='0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4'
cast chain-id --rpc-url "$rpc"
cast receipt 0x566fe1355cad0c4b71dcab6daa8c0f23fe94282e7f601d2f16700800ddf47c56 --rpc-url "$rpc"
cast call "$market" 'relicNFT()(address)' --rpc-url "$rpc"
cast call "$nft" 'balanceOf(address,uint256)(uint256)' 0x46F4bf236Ed633762e8b045dcc7243e5Ea014A6B 3 --block 61406037 --rpc-url "$rpc"
cast call "$nft" 'balanceOf(address,uint256)(uint256)' 0xf7bf4c3edBdC83017534059aCEC12891CEe766FB 3 --block 61406037 --rpc-url "$rpc"
~~~

## Ba câu hỏi cho vòng phản biện

1. Khi chỉ nhìn 32,00–34,60 giây và che tên chiêu, người xem còn đọc được Mochi chống chân, che ai và vì sao nên tung chiêu lúc ấy không? Nêu khung hình có khả năng bác bỏ nhận xét hiện tại.
2. Trong bằng chứng đúng phiên bản, có người ngoài nhóm nào tự chơi lại hoặc tự tặng vật phẩm không? Nếu có, ghi mẫu số, cách tuyển người, mốc ngày và phân biệt với tài khoản test.
3. Có phản hồi trực tiếp từ Team1 thay đổi thứ tự giả thuyết không? Nếu có thì ưu tiên phản hồi đó. Đặc biệt cần làm rõ phạm vi quy tắc phần thưởng ngẫu nhiên, điểm sáng tạo và giá trị thực tế mà giám khảo nhìn thấy.

## Bàn giao cục bộ và lần đọc của Claude

Báo cáo được đặt trong repo `ntbaoheyhey/lantern-cat-cafe`. Tệp `CLAUDE.md` ở gốc dẫn tới bản chính, bản rà GitHub và sổ này. Nhánh Git cục bộ `codex/unihack-2026-retrospective` lưu cả dữ liệu kiểm kê cùng một commit dựa trên main công bố. Claude có thể mở nhánh này từ một worktree khác của cùng clone bằng lệnh chỉ đọc dưới đây.

~~~sh
git show codex/unihack-2026-retrospective:docs/retrospectives/unihack-2026/README.md
git show codex/unihack-2026-retrospective:docs/retrospectives/unihack-2026/GITHUB.md
~~~

Ngày 23/11, Codex đã yêu cầu Claude Code đọc bản chính và ảnh Mochi bằng CLI. Claude Code trả về giới hạn tuần, hẹn mở lại vào **23:00 ngày 26/11 theo giờ Việt Nam**. Vì vậy trạng thái bàn giao là **đã lưu và đã chỉ đường, chưa có xác nhận Claude đọc hoặc phản biện**. Gói ZIP dành cho Claude chứa các báo cáo, toàn bộ chỉ mục, ba bảng hình, clip phân tích và các tệp dự án được dẫn trực tiếp. Bộ dữ liệu và nhận xét hậu kiểm được lưu cục bộ.
