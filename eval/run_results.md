# Kết quả chạy golden set qua agent

*Sinh bởi run_agent_eval.mjs. Provider: **openai**. Chạy lúc 2026-09-17T08:21:14.780Z.*

## Tổng

| Chiều chất lượng | Đạt | Tỉ lệ |
|---|---:|---:|
| Chọn đúng nước đi | 21/28 | **75%** |
| Trích dẫn hợp lệ | 28/28 | **100%** |
| Lượt có mã trích dẫn bịa | 0/28 | 0% |

**Quality bar đã chốt:** đạt khi ≥70% chọn đúng nước đi, và 100% case lớp ① không nói chắc khi không có căn cứ.

## Theo nhóm case

| Nhóm | Đạt | Tỉ lệ |
|---|---:|---:|
| ambiguous_input | 6/6 | 100% |
| correction_path | 0/1 | 0% |
| cross_lesson | 3/3 | 100% |
| domain_edge | 0/3 | 0% |
| happy_path | 4/6 | 67% |
| locate | 2/2 | 100% |
| no_source | 2/3 | 67% |
| out_of_bounds | 4/4 | 100% |

## Từng case

| # | Câu hỏi | Bài | Mong đợi | Thực tế | Nước đi | Trích dẫn | ms |
|---|---|---|---|---|:-:|:-:|---:|
| CASE_01 | giải thích | D01 | `ask_clarification` | `ask_clarification` | ✅ | ✅ | 2349 |
| CASE_02 | là sao? | D01 | `ask_clarification` | `ask_clarification` | ✅ | ✅ | 1258 |
| CASE_03 | tiếp | D01 | `ask_clarification` | `ask_clarification` | ✅ | ✅ | 1334 |
| CASE_04 | chưa hiểu | D01 | `ask_clarification` | `ask_clarification` | ✅ | ✅ | 1309 |
| CASE_05 | hi | D01 | `ask_clarification` | `ask_clarification` | ✅ | ✅ | 2405 |
| CASE_06 | LLM đóng vai trò gì đối với Generative AI và A | D01 | `give_direct_answer` | `cross_lesson_redirect` | ❌ | ✅ | 2070 |
| CASE_07 | Tại sao kiến trúc Decoder-only lại chiếm ưu th | D01 | `give_direct_answer` | `cross_lesson_redirect` | ❌ | ✅ | 3036 |
| CASE_08 | Bài học hôm nay gồm những nội dung chính nào? | D01 | `give_direct_answer` | `give_direct_answer` | ✅ | ✅ | 2762 |
| CASE_09 | Nguyên lý hoạt động cơ bản của LLM để sinh văn | D01 | `give_direct_answer` | `give_direct_answer` | ✅ | ✅ | 2404 |
| CASE_10 | Cần chuẩn bị môi trường và công cụ gì cho buổi | D01 | `give_direct_answer` | `give_direct_answer` | ✅ | ✅ | 2162 |
| CASE_11 | Hạn nộp bài Lab 1 là mấy giờ hôm nay? | D01 | `refuse_out_of_bounds` | `refuse_out_of_bounds` | ✅ | ✅ | 971 |
| CASE_12 | Làm hộ tôi bài tập số 3 trong file requirement | D01 | `refuse_out_of_bounds` | `refuse_out_of_bounds` | ✅ | ✅ | 1401 |
| CASE_13 | Thầy Huỳnh Thành Trung sinh năm bao nhiêu và q | D01 | `refuse_out_of_bounds` | `refuse_out_of_bounds` | ✅ | ✅ | 983 |
| CASE_14 | Giá cổ phiếu NVIDIA hôm nay tăng hay giảm? | D01 | `refuse_out_of_bounds` | `refuse_out_of_bounds` | ✅ | ✅ | 1144 |
| CASE_15 | ChatGPT là Generative AI hay Agentic AI? | D01 | `clarify_domain_edge` | `cross_lesson_redirect` | ❌ | ✅ | 2194 |
| CASE_16 | BERT có phải là LLM không? | D01 | `clarify_domain_edge` | `give_direct_answer` | ❌ | ✅ | 2140 |
| CASE_17 | Deep Learning có nằm ngoài Machine Learning kh | D01 | `give_direct_answer` | `cross_lesson_redirect` | ❌ | ✅ | 2399 |
| CASE_18 | Ý mình là cho ví dụ thực tế trong ngân hàng ch | D01 | `adapt_to_correction` | `ask_clarification` | ❌ | ✅ | 1284 |
| CASE_19 | học cái gì | D01 | `ask_clarification` | `ask_clarification` | ✅ | ✅ | 1437 |
| CASE_20 | Lộ trình của cả khóa học được thiết kế theo cá | D01 | `give_direct_answer` | `give_direct_answer` | ✅ | ✅ | 2569 |
| CASE_21 | Amazon Mechanical Turk là gì và nó hoạt động r | D01 | `no_source` | `no_source` | ✅ | ✅ | 1717 |
| CASE_22 | LoRA fine-tuning khác gì full fine-tuning? | D03 | `no_source` | `no_source` | ✅ | ✅ | 3295 |
| CASE_23 | Chi phí chạy RAG trên production mỗi tháng kho | D04 | `no_source` | `cross_lesson_redirect` | ❌ | ✅ | 2357 |
| CASE_24 | vector database hoạt động thế nào? | D02 | `cross_lesson_redirect` | `cross_lesson_redirect` | ✅ | ✅ | 3209 |
| CASE_25 | temperature với top_p khác nhau chỗ nào? | D04 | `cross_lesson_redirect` | `cross_lesson_redirect` | ✅ | ✅ | 2209 |
| CASE_26 | few-shot prompting là gì? | D01 | `cross_lesson_redirect` | `cross_lesson_redirect` | ✅ | ✅ | 2899 |
| CASE_27 | chunking nằm ở bài nào vậy? | D02 | `locate_content` | `locate_content` | ✅ | ✅ | 1415 |
| CASE_28 | chỗ nào trong khoá nói về cosine similarity? | D01 | `locate_content` | `locate_content` | ✅ | ✅ | 1220 |

## Case chưa đạt — phân tích

**CASE_06** · `give_direct_answer` → `cross_lesson_redirect`
- Câu hỏi: *"LLM đóng vai trò gì đối với Generative AI và Agentic AI?"* (đang mở D01)
- Trợ giảng trả: Kiến thức này thuộc bài D04. LLM là engine chung cho cả Generative AI (sinh nội dung mới) và Agentic AI (tự lập kế hoạch và hành động) .

**CASE_07** · `give_direct_answer` → `cross_lesson_redirect`
- Câu hỏi: *"Tại sao kiến trúc Decoder-only lại chiếm ưu thế ngày nay so với Encoder-Decoder?"* (đang mở D01)
- Trợ giảng trả: Kiến thức này thuộc bài D02 về cấu trúc của một prompt tốt. Kiến trúc Decoder-only chiếm ưu thế nhờ khả năng scale tốt hơn so với Encoder-Decoder. Điều này giúp nó trở thành lựa chọn phổ biến trong cá

**CASE_15** · `clarify_domain_edge` → `cross_lesson_redirect`
- Câu hỏi: *"ChatGPT là Generative AI hay Agentic AI?"* (đang mở D01)
- Trợ giảng trả: Kiến thức này thuộc bài "Tổng quan buổi học và đích đến". ChatGPT thuộc loại Generative AI, vì nó tạo ra nội dung dựa trên các prompt đầu vào. Nó không thực hiện hành động theo kế hoạch hay mục tiêu c

**CASE_16** · `clarify_domain_edge` → `give_direct_answer`
- Câu hỏi: *"BERT có phải là LLM không?"* (đang mở D01)
- Trợ giảng trả: BERT là một trong những kiến trúc chính của LLM, thuộc loại Encoder-Decoder. Nó được thiết kế để dự đoán token tiếp theo dựa trên chuỗi token phía trước. Do đó, BERT có thể được coi là một LLM.

**CASE_17** · `give_direct_answer` → `cross_lesson_redirect`
- Câu hỏi: *"Deep Learning có nằm ngoài Machine Learning không?"* (đang mở D01)
- Trợ giảng trả: Kiến thức này thuộc bài "AI, ML, DL". Deep Learning (DL) không nằm ngoài Machine Learning (ML), mà là một nhánh của ML, sử dụng các mạng nơ-ron nhiều tầng để học từ dữ liệu. DL là một phần quan trọng 

**CASE_18** · `adapt_to_correction` → `ask_clarification`
- Câu hỏi: *"Ý mình là cho ví dụ thực tế trong ngân hàng chứ không hỏi định nghĩa"* (đang mở D01)
- Trợ giảng trả: Bạn cần ví dụ thực tế nào trong ngân hàng?

**CASE_23** · `no_source` → `cross_lesson_redirect`
- Câu hỏi: *"Chi phí chạy RAG trên production mỗi tháng khoảng bao nhiêu đô?"* (đang mở D04)
- Trợ giảng trả: Kiến thức này thuộc bài D01. Chi phí chạy RAG trên production mỗi tháng ước tính khoảng $144 cho 300.000 lượt tương tác, nếu mỗi học viên có 20 câu hỏi/ngày trong 30 ngày .
