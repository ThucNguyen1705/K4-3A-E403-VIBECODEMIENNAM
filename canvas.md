# Canvas CP1 — Nhóm VIBECODEMIENNAM · Lớp 3A · Phòng E403

> Nộp tại CP1 · 19:30 · 16/9. TA tích 3 ô: ☐ lát cắt đúng format 1 câu ☐ có evidence ban đầu ☐ đủ tên phân công

---

## 1 · Hướng

**Track A — VLearn Tutor · A1 (tối ưu tính năng đang chạy)**

## 2 · Job executor

**Học viên K4 đang học một bài trên VLearn**, bôi đen một đoạn slide/tài liệu rồi gõ câu hỏi ngay trong trang học — không phải "học viên nói chung".

*Core JTBD (không có chữ AI):* khi đang đọc một đoạn tài liệu mà không hiểu, tôi muốn gỡ được đúng chỗ tắc ngay tại chỗ, để đi tiếp bài mà không phải bỏ dở đi tìm người hỏi.

## 3 · Pain — một câu

**Học viên K4** đang đọc slide giữa buổi, gõ một câu hỏi cụt ("giải thích", "tiếp", "slide này là sao?") hoặc hỏi thứ không có trong tài liệu đang mở — **tutor không hỏi lại một câu nào mà trả lời thẳng một đoạn ~800 ký tự đoán theo ngữ cảnh**, hậu quả là học viên nhận nội dung lạc đề hoặc không có căn cứ, mất thêm lượt hỏi để nắn lại, và 114/448 học viên hỏi đúng một câu rồi không quay lại.

## 4 · Bằng chứng đầu tiên *(mining — chuẩn B, đếm trên `tutor_turns.csv`, lọc `cohort_hint=K4`, n = 3.097 lượt / 448 học viên)*

| # | Số đếm được | Ý nghĩa |
|---|---|---|
| 1 | **542/3.097 (17,5%)** câu hỏi cụt ≤25 ký tự sau khi bỏ tiền tố ngữ cảnh | Input mơ hồ là chuyện thường ngày, không phải ca hiếm |
| 2 | Trong 542 câu đó, tutor **chỉ hỏi lại 53 lần (9,8%)** — 489 lần còn lại trả lời thẳng, dài trung bình **786 ký tự** | Tutor đoán thay vì hỏi |
| 3 | **32,8%** câu trả lời (câu hỏi tự gõ) **không có trích dẫn** `[trang N]`, nhưng chỉ **3,5%** thừa nhận "không có trong tài liệu" | Khoảng chênh này là chỗ tutor nói chắc mà không có căn cứ |
| 4 | Nhãn `ask_probing_question` = **6/3.097**; `understanding_level` có giá trị **6/3.097**; `give_hint` **23/3.097** | Ba tính năng sư phạm gần như không chạy |

**Ví dụ nguyên văn** (dẫn `turn_id`, không dán đoạn dài): `T10289` "tôi phải làm gì ? ở đây" · `T10318` "đây" · `T10320` "Bốn làn sóng là gì" · `T10296` "which model r u" · `T10305` "mai tôi học cái gì" — 15 lượt chỉ gõ "hi".

**Điểm ăn tiền cho slide 1:** trang chủ vlearn.dev mô tả tutor "hỏi ngược kiểu Socratic thay vì đưa đáp án" và "hướng dẫn đúng cỡ theo mức hiểu". Log 3.097 lượt của chính khoá 4 cho thấy tutor hỏi lại **9,8%** số câu mơ hồ và `understanding_level` trống **99,8%**. Khoảng cách giữa lời hứa sản phẩm và log thật chính là bài toán nhóm nhận.

*Phương pháp đếm và script lưu trong `eval/mining/` để người khác kiểm lại được (yêu cầu của guide §1.3).*

**Đường A — khảo sát** (làm trong giờ nghỉ mai, bổ sung trước CP4): 20 bạn ngoài nhóm, hỏi theo Mom Test — *"Lần gần nhất bạn hỏi tutor VLearn mà câu trả lời không trúng ý, bạn đã làm gì tiếp?"* — log nguyên văn từng câu trả lời.

## 5 · Lát cắt — MỘT CÂU

> **Một học viên K4 đang học một bài trên VLearn** · **bôi đen một đoạn slide rồi gõ câu hỏi** · **tutor quyết định một nước đi trước khi trả lời** — trả lời kèm trích dẫn `[trang N]` khi đoạn được chọn đủ căn cứ, hỏi lại đúng MỘT câu khi input mơ hồ, hoặc nói rõ "không có trong tài liệu này" kèm chỗ nên tìm khi ngoài phạm vi · **học viên không bao giờ nhận một câu trả lời không có căn cứ.**

*Một user · một việc · một quyết định AI (chọn nước đi) · một kết quả.*

**Non-goals — 3 thứ nhóm KHÔNG build:** ① không dựng lại UI VLearn, chỉ mô phỏng khung bôi đen + ô hỏi · ② không cá nhân hoá theo lịch sử học viên (adaptive, `understanding_level`) · ③ không làm dashboard cho giảng viên · ④ không sửa nội dung slide/tài liệu.

## 6 · Automation dự kiến

**Conditional** — AI tự trả lời case có căn cứ rõ, chuyển sang hỏi lại hoặc thừa nhận không biết ở case mơ hồ/ngoài phạm vi.

*Lý do theo cost-of-error:* trả lời sai kiến thức thì học viên mang kiến thức sai vào quiz và vào bài lab — sửa rất đắt và thường không ai biết để sửa; còn hỏi lại thừa một câu chỉ tốn của học viên 5 giây và họ gạt đi được ngay.

## 7 · Willing users dự kiến *(≥3 — khai từ CP1, dùng lại ở CP5)*

| # | Tên / vai | Cam kết |
|---|---|---|
| 1 | Đinh Trường An | Thử prototype trước CP5 |
| 2 | Trần Văn Tuấn | Thử prototype trước CP5 |
| 3 | Lưu Xuân Dũng | Thử prototype trước CP5 |

## 8 · Phân công

| Họ và Tên | Mã Học Viên | Vai trò chính | Phần việc |
|---|---|---|---|
| Nguyễn Đăng Thực | 2A202603014 | **Đội trưởng · Spec & nộp** | Nộp cả 5 form bằng MSSV này · viết `spec.md` §1-§9 · dry run · điều phối mốc |
| Nguyễn Đức Minh | 2A202602891 | **Bằng chứng & mining** | Script mining + phương pháp đếm (`eval/mining/`) · khảo sát 20 người có log · bảng impact → spec §1-§2 |
| Lâm Hoàng Phúc | 2A202602582 | **Build prototype** | `codebase/` · khung bôi đen + ô hỏi · nối API · 4 đường đi trải nghiệm → spec §4, R5 |
| Nguyễn Văn Tài | 2A202603004 | **Prompt & kiểm thử** | Prompt quyết định nước đi · golden set ≥20 case (`eval/`) · chạy 3 lượt, bảng % → spec §7 |

**Quality bar (chốt tại CP4, 21:00 17/9 — sau đó không sửa):** đạt khi **≥70%** golden set qua, **và 100% case lớp ① không được nói chắc khi không có căn cứ trong đoạn được chọn.**
