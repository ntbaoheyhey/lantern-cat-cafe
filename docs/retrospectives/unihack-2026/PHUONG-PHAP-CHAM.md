# Cách chấm một dự án phần mềm và một bài thi hackathon

**Bước nghiên cứu phương pháp, 23/11/2026.** Khi hỏi “dự án này có tốt không?”, trước hết cần nói rõ ai đang đưa ra quyết định. Một giám khảo chọn finalist, một người chơi quyết định quay lại và một đội kỹ sư quyết định tiếp tục đầu tư có thể nhìn cùng một sản phẩm và đưa ra ba kết luận hợp lý khác nhau. Tài liệu này xác lập câu hỏi, bằng chứng và cách cho điểm trước khi chấm Lantern Cat Café.

## 1. Các khung quốc tế thực sự đánh giá điều gì?

| Nguồn gốc | Phương pháp gốc | Điều có thể dùng khi chấm một dự án game |
| --- | --- | --- |
| NASA International Space Apps Challenge | Hướng dẫn 2026 chấm **1–5** cho từng tiêu chí tác động, sáng tạo, tính khả thi và cơ sở của giải pháp, độ phù hợp với đề, trình bày. Hướng dẫn mô tả thành tích ở mức 5 cho từng mục. | Viết trước **mức xuất sắc trông như thế nào** cho mỗi tiêu chí. Tính phù hợp được xét theo đề thi cụ thể. Với NASA, dữ liệu NASA là một phần của độ phù hợp. Với UniHack, thay bằng yêu cầu thực tế của Team1. [Hướng dẫn của NASA Space Apps](https://www.spaceappschallenge.org/resources/judging-awards-guide/#judging-criteria) |
| ETHGlobal Cannes 2026 | Hackathon Web3 này xét độ khó và chiều sâu kỹ thuật, tính nguyên bản, khả năng sử dụng trong thực tế, độ dễ dùng và ấn tượng đáng nhớ. | Một người chấm có thể ghi nhận riêng hợp đồng tốt, thao tác còn khó và ý tưởng quen thuộc. Mỗi nhận xét cần ví dụ của chính nó. [Tiêu chí ETHGlobal Cannes](https://ethglobal.com/events/cannes2026/info/details#judging-criteria) |
| ISO/IEC 25010:2023 | Mô hình chất lượng sản phẩm có chín đặc tính. Các đặc tính liên quan trực tiếp tới dự án web gồm đáp ứng chức năng, hiệu năng, độ tin cậy, khả năng tương tác với người dùng và khả năng bảo trì. | Từ mỗi đặc tính chọn một phép thử có điều kiện rõ ràng. Ví dụ với độ tin cậy, xem sau khi tải lại trang, người chơi có nhận đúng tiến trình đã lưu. Nhóm đánh giá tự xác lập mức chấp nhận phù hợp với prototype. [ISO](https://www.iso.org/standard/78176.html) · [Bản giới thiệu tiêu chuẩn của GSO](https://gso-sims-preview-doc-aws.s3-eu-west-1.amazonaws.com/gso-iso-iec-25010-2025-en.html) |
| Carnegie Mellon Software Engineering Institute, ATAM | Lấy mục tiêu của các bên liên quan để lập kịch bản thuộc tính chất lượng. Dùng kịch bản để tìm rủi ro, điểm nhạy cảm và đánh đổi của kiến trúc. | Muốn đánh giá tổ chức code, thử một thay đổi thật như đổi điều kiện nhận một phần thưởng. Theo dõi quy tắc đi qua bao nhiêu nơi, phần nào dùng chung, phần nào phải đồng bộ và điều gì bảo vệ dữ liệu cũ. [ATAM của Carnegie Mellon](https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/) |
| Google Engineering Practices | Khi review một thay đổi, Google hướng người đọc xem thiết kế, hành vi, độ phức tạp, độ hữu ích của test và tác động tới người dùng, cùng các yếu tố như tên, chú thích và tài liệu. | Chọn một thay đổi đã gây lỗi hoặc từng cần sửa lại. Lần theo code và test để trả lời hai câu hỏi: liệu test có phát hiện lỗi cụ thể, và người dùng cuối đi qua đúng phần code đó không. [Hướng dẫn review code của Google](https://google.github.io/eng-practices/review/reviewer/looking-for.html) |
| DORA | Năm chỉ số hiện hành gồm thời gian từ commit đến production, tần suất triển khai, thời gian phục hồi sau triển khai lỗi, tỷ lệ triển khai cần can thiệp ngay và tỷ lệ triển khai ngoài kế hoạch do sự cố production. | Đánh giá tiến trình bằng thời điểm thay đổi thật sự đến tay người dùng và điều gì xảy ra sau phát hành. Muốn tính tỷ lệ cần biết tổng số lần triển khai tương ứng. Lịch PR có thể giúp tìm ca nghiên cứu nhưng chưa cho sẵn mẫu số này. [Hướng dẫn DORA](https://dora.dev/guides/dora-metrics/) |
| Project Management Institute, PMI | PMI nghiên cứu thành công của dự án thông qua giá trị mà các bên liên quan nhận được so với công sức và chi phí. Với **Net Project Success Score**, người được hỏi cho 0–10. Tính tỷ lệ cho 9–10 trừ tỷ lệ cho 0–6. Nhóm 7–8 vẫn thuộc mẫu khảo sát. | Dùng khi hỏi “thời gian và ngân sách đã bỏ ra có đáng không?”. Thu nhận định từ người có góc nhìn phù hợp, ghi rõ số người, vai trò và kỳ vọng. Một con số token hoặc một đánh giá của tác giả chỉ trả lời được một phần. [Định nghĩa và cách tính của PMI](https://www.pmi.org/blog/project-success) |

**Dễ dùng và đáng chơi là hai câu hỏi khác nhau.** ISO 9241-11 xét việc người dùng cụ thể đạt mục tiêu hiệu quả đến đâu, tốn bao nhiêu nguồn lực và cảm thấy thế nào, trong bối cảnh sử dụng xác định. Với game, GameFlow của Sweetser và Wyeth bổ sung các câu hỏi về thử thách, quyền điều khiển, mục tiêu rõ và phản hồi. Có thể bấm đúng mọi nút mà vẫn không muốn chơi thêm. Bài nghiên cứu GameFlow đầu tiên minh họa qua đánh giá chuyên gia trên hai game chiến thuật thời gian thực. Áp vào thể loại khác cần thử với người chơi mục tiêu. [ISO 9241-11](https://www.iso.org/standard/63500.html) · [Bài nghiên cứu GameFlow](https://doi.org/10.1145/1077246.1077253) · [Tóm tắt do nhà xuất bản đăng ký](https://api.crossref.org/works/10.1145/1077246.1077253)

## 2. Cách chuyển các nguyên tắc thành điểm chấm được

**Trọng số thuộc về mục đích đánh giá.** Nếu đánh giá khả năng cạnh tranh tại một cuộc thi đã có rubric, dùng đúng trọng số của BTC. Nếu đội đang quyết định nên đầu tư thêm vào tính năng nào, hãy thống nhất mục tiêu với người ra quyết định và xem thay đổi từ mức tệ đến mức tốt của từng tiêu chí có giá trị thực tiễn bao nhiêu. Hướng dẫn MCDA của Chính phủ Anh gọi cách xác lập trọng số dựa trên mức cải thiện đó là *swing weighting*. Tài liệu cũng khuyên xem kết luận nhạy thế nào khi các đánh giá khác nhau. Bảng quy đổi dưới đây là đề xuất nội bộ cho trường hợp trọng số cuộc thi đã có sẵn. [Hướng dẫn MCDA của Chính phủ Anh](https://www.gov.uk/government/publications/green-book-supplementary-guidance-multi-criteria-decision-analysis/use-of-multi-criteria-decision-analysis-in-options-appraisal-of-economic-cases)

**Quy trình đề xuất cho người chấm**

1. **Chốt đối tượng và bối cảnh.** Ghi tag, giai đoạn, đề bài, đối tượng sử dụng và trải nghiệm mà giám khảo có thể tiếp cận lúc chấm. Một prototype hackathon có thể chứng minh giá trị tiềm năng bằng một trường hợp sử dụng tốt. Dữ liệu giữ chân dài hạn trả lời câu hỏi khác.
2. **Viết mô tả các mức trước khi nhìn kết quả.** Mỗi tiêu chí cần mô tả một kết quả quan sát được, ghi rõ thế nào là đạt và thế nào là xuất sắc. Riêng Lantern, người phản biện đã biết kết quả vòng loại. Nên chấm từng mục độc lập trước khi xem các giả thuyết cũ, để giảm ảnh hưởng của việc biết trước kết quả.
3. **Chấm chất lượng, ghi độ chắc ở cột riêng.** Một lỗi tái hiện được nhiều lần có thể nhận điểm thấp với độ chắc cao. Một ý tưởng có triển vọng từ phỏng vấn ban đầu có thể nhận đánh giá tốt với độ chắc vừa. Tách phát biểu “team tuyên bố”, “đã quan sát” và “người đánh giá suy ra”.
4. **Cho từng người chấm độc lập trước khi đối chiếu.** Mỗi điểm kèm một căn cứ, một phản chứng nếu có và điều gì sẽ làm người đó đổi điểm. Khi lệch nhau, lần về kịch bản, người dùng và mẫu số. Nếu hai cách hiểu đều có cơ sở, báo cả khoảng điểm.
5. **Tính tổng sau cùng.** Báo đóng góp từng mục, phần chưa chấm được và lý do. Mức độ phù hợp với cuộc thi được xét theo cùng rubric, thời điểm và điều kiện với đối thủ. Muốn giải thích quyết định của BGK cần phiếu chấm, phản hồi trực tiếp hoặc dữ liệu đối sánh đủ tương đồng.

| Mức đề xuất | Ý nghĩa trước khi viết mô tả riêng cho từng tiêu chí |
| ---: | --- |
| 0 | Đã kiểm trong điều kiện đã thống nhất và kết quả không đáp ứng tiêu chí. |
| 1 | Chỉ đạt một phần nhỏ của mục tiêu. |
| 2 | Đạt một phần có ích nhưng người dùng vẫn vướng ở một điều kiện thông thường. |
| 3 | Đạt mục tiêu cốt lõi trong bối cảnh mục tiêu. |
| 4 | Đạt mục tiêu cốt lõi và một điều kiện khó quan trọng đã thống nhất. |
| 5 | Đạt mô tả xuất sắc đã viết trước cho tiêu chí đó. Chẳng hạn với tính sáng tạo cần chỉ ra khác biệt có ý nghĩa so với phương án đối chiếu. |
| Chưa đủ bằng chứng | Để trống giá trị số, ghi phép kiểm còn thiếu cùng tác động của nó đến kết luận. |

Thang **0–5** này do người viết đề xuất cho hậu kiểm. NASA dùng **1–5** cho cuộc thi của họ. ISO cung cấp đặc tính chất lượng, DORA cung cấp phép đo, ATAM đưa ra nhận định về kiến trúc. Trọng số điểm của UniHack đến từ Team1.

Với tiêu chí có trọng số **w** và mức đánh giá **r** trên 5, điểm đóng góp là **w × r / 5**. Ví dụ giả định, UI/UX nặng 10 điểm và được đánh giá 4/5 thì đóng góp 8/10. Nếu các mục đã chấm mang về 64 điểm trên phần có trọng số 85, còn 15 điểm thiếu bằng chứng, khoảng tổng khả dĩ là **64–79/100**. Đó là khoảng số học, không phải khoảng tin cậy thống kê. Chấm hai lần cùng một biểu hiện dễ làm tổng bị lệch. Một receipt có thể làm chứng cứ cho việc hệ thống hoạt động. Muốn cho điểm tác động còn phải chỉ ra quyền lợi nào của người dùng đã thay đổi và tại sao điều đó có ý nghĩa.

## 3. Áp rubric của Team1 cho kỳ chấm sau

| Tiêu chí của UniHack | Điểm tối đa | Câu hỏi để hai người chấm có thể cho điểm nhất quán |
| --- | ---: | --- |
| Technical Implementation | 25 | Tuyên bố kỹ thuật trọng tâm có chạy từ đầu đến cuối ở bản phát hành không? Hệ thống xử lý thế nào khi thử lại, mất kết nối hoặc tải lại save? |
| Avalanche Integration | 25 | Chấm theo năm mục con chính thức, mỗi mục tối đa 5: mức sử dụng có ý nghĩa, phần on-chain thực hiện được, sự phù hợp của hạ tầng, chất lượng tích hợp và giá trị cụ thể từ việc xây trên Avalanche. Cộng năm mục một lần. |
| Creativity & Innovation | 15 | Đối chiếu với một giải pháp đã có. Người dùng làm được điều gì khác hoặc tốt hơn nhờ điểm sáng tạo này? |
| Impact & Use Case | 15 | Ai gặp vấn đề gì, và có bằng chứng nào cho thấy giải pháp đáng dùng? Ghi rõ phần quan sát được và phần mới là tiềm năng. |
| Presentation & Pitching | 10 | Xem đúng tài liệu dự thi. Một người ngoài nhóm có thể kể lại người dùng, vấn đề, giải pháp và lý do lựa chọn công nghệ không? |
| UI/UX & Demo | 10 | Cho người mới thử nhiệm vụ cốt lõi trên thiết bị mục tiêu. Họ có tự tìm ra hành động, đọc được phản hồi và hiểu kết quả không? |

Bảng Team1 công khai xác nhận sáu trọng số và năm mục con của phần Avalanche. Các câu hỏi thực nghiệm ở cột cuối là cách vận dụng cho game. Bản dữ liệu chi tiết được đọc ngày hậu kiểm 23/11, sau vòng nộp bài. [FAQ của Team1](https://team1vn.xyz/) · [Dữ liệu tiêu chí công khai](https://team1vn.xyz/topics.json)

## 4. Đánh giá riêng coding, tổ chức và tiến trình

| Điều đội muốn biết | Phép kiểm và bằng chứng phù hợp | Kết quả nên báo |
| --- | --- | --- |
| Kiến trúc có dễ sửa? | Chọn một thay đổi luật thưởng. Lần theo nguồn trạng thái, hợp đồng dữ liệu, các màn sử dụng và việc đọc save cũ. So sánh với một thiết kế khả thi khác, tính cả chi phí giữ tương thích. | Những nơi thực sự phải sửa, lỗi gây ra do ranh giới module và đánh đổi khi sửa. Số dòng giúp chọn chỗ đọc sâu. |
| QA có phát hiện đúng lỗi? | Chọn một hành vi quan trọng. Kiểm unit, integration và luồng từ điểm vào thật xem lớp nào quan sát được nó. Thử một trường hợp dữ liệu bình thường và một trường hợp dễ bị bỏ sót. | Lỗi cụ thể test phát hiện được, loại lỗi còn lọt và chi phí bổ sung phép thử. |
| Tiến trình tích hợp có hợp lý? | Nối thời điểm có yêu cầu, commit, bản tích hợp, bản phát hành và phản hồi đầu tiên. Ưu tiên dữ liệu triển khai cho các chỉ số DORA. Xem cả các thử nghiệm bị dừng đúng lúc. | Bao lâu mới phát hiện một quyết định sai, chờ ở đâu, vòng sửa nào tốn công và có giúp người dùng hay không. |
| Phạm vi và ngân sách có hợp lý? | Đối chiếu mục tiêu ban đầu, thời điểm đổi hướng, số giờ/chi phí có chứng cứ và kết quả mở khóa sau mỗi đợt. Hỏi lại những người chịu chi phí và nhận giá trị. | Công sức nào tạo tài sản dùng lại, công sức nào tạo rework, và quyết định cắt phạm vi nào đáng đưa lên sớm hơn. |
| Game dễ hiểu và thú vị? | Cho đúng đối tượng chơi, ghi từng người tự thực hiện được gì, cần trợ giúp ở đâu, họ giải thích thế nào về quyết định trong trận và họ có muốn chơi tiếp không. | Tỷ lệ với mẫu số rõ, lý do bằng lời người chơi và giới hạn của mẫu. Ảnh hoặc video hỗ trợ nhận xét về hình và chuyển động. |

**Ví dụ phân xử một nhận định.** Nếu một nút nhận thưởng có mặt ở bản demo nhưng vắng trong campaign, câu hỏi về kiến trúc là hai màn có dùng chung điều kiện và trạng thái hay không. Câu hỏi về tiến trình là lỗi được phát hiện trước hay sau khi tích hợp, so với thời điểm người ngoài có thể chơi. Câu hỏi về điểm thi là bản giám khảo thực sự tiếp cận có còn lỗi hay đã sửa. Một lỗi được sửa trước hạn vẫn là bài học về chi phí tích hợp, còn điểm sản phẩm phải dựa trên hành vi ở phiên bản dự thi.

**Mẫu một dòng cho Claude hoặc người chấm thứ hai**

| Tiêu chí và trọng số | Mức đạt / xuất sắc đã định | Phiên bản, kịch bản và nguồn | Quan sát và phản chứng | Điểm hoặc trạng thái thiếu dữ liệu | Độ chắc và lý do |
| --- | --- | --- | --- | --- | --- |
| Điền trước khi chấm | Mô tả hành vi quan sát được | SHA, đường chơi, ngày, mẫu số | Nêu cả kết quả bất lợi cho giả thuyết của mình | Điểm thô và đóng góp có trọng số | Cao / vừa / thấp, có giải thích |

Bản này là phương pháp cho bước đánh giá kế tiếp. Các điểm số trong ví dụ là số minh họa.
