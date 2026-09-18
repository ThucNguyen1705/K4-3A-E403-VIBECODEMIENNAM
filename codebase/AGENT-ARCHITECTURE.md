# Kiến trúc trợ giảng VLearn — bản thiết kế

Thay `ai.service.js` (đang là mock) bằng một agent có truy xuất, trích dẫn kiểm được, và định tuyến chéo bài.

---

## 1 · Tổng hợp dữ liệu — 167 chunk

`node src/scripts/build-index.js` cắt 4 file markdown thành chunk theo cấu trúc tiêu đề có sẵn:

| Bài | Chủ đề | Phần (`#`) | Chunk (`##`) |
|---|---|---:|---:|
| D01 | Nền tảng LLM API | 8 | 55 |
| D02 | Prompt Engineering thực chiến | 7 | 41 |
| D03 | Embedding & Vector Database | 6 | 32 |
| D04 | Retrieval-Augmented Generation | 7 | 39 |
| | | **28** | **167** |

Độ dài chunk: trung vị **446** ký tự, p95 **998**, max **1.974**. Không có chunk rỗng, không chunk nào dài quá phải cắt tiếp.

**Cấu trúc tiêu đề của tài liệu đã là một chiến lược chunking tốt.** Không cần sliding window, không cần semantic chunking — mỗi `##` là một ý trọn vẹn do người viết bài phân định sẵn.

Kết quả ghi ra `eval/index/lesson_chunks.json` và bảng `lesson_chunks`.

---

## 2 · Lỗi gốc phải sửa trước mọi thứ khác

Prompt hiện tại trong `eval/scripts/run_eval.js` bắt model ghi `[Trang N]`:

> *"LUÔN ghi trích dẫn số trang ở cuối: [Trang N] (ví dụ: [Trang 7])"*

**Nội dung bài học không có số trang.** Nó là markdown chia theo tiêu đề. Bắt model ghi số trang thì nó buộc phải bịa ra một con số — đây đúng là lỗi lớp ① mà cả dự án đang muốn sửa, và prompt đang tự sinh ra nó.

Trường `slide_page` trong `eval/golden_set.json` cũng trỏ vào slide không có trong nội dung đã seed.

**Đơn vị trích dẫn đúng cho dữ liệu này là mã chunk**, và mã đó phải có thật trong database:

```
D01#p2#s3   →   D01 › LLM hoạt động như thế nào? › Token — đơn vị cơ bản của LLM
```

Hiển thị cho học viên là đường dẫn tiêu đề bấm được, không phải mã thô.

---

## 3 · Hợp đồng trích dẫn

Ba luật, thi hành bằng code chứ không bằng lời dặn trong prompt:

1. Trợ giảng **chỉ được trích mã chunk có trong danh sách đã truy xuất** của chính lượt đó.
2. Sau khi sinh câu trả lời, **bộ kiểm** đối chiếu mọi mã được trích với danh sách đó. Mã lạ là mã bịa.
3. Còn mã bịa sau một lần sửa thì **hạ nước đi xuống `no_source`**, không trả câu trả lời ra màn hình.

Đây là chỗ khác biệt thật so với tutor cũ: tutor cũ *được dặn* là phải có căn cứ; bản này *không thể* trả lời không căn cứ mà lọt.

---

## 4 · Router đọc ứng viên do RAG truy xuất, không đọc cả mục lục

> **Đã thay đổi.** Bản đầu nhét cả mục lục 167 tiêu đề (~2,3k token) vào mọi lời gọi router.
> Giờ router chỉ nhận **10 tiêu đề ứng viên** do tầng truy xuất lai lấy ra
> (`retrieval.service.js`), cộng tổng quan khoá ở mức **phần** (28 dòng, tĩnh, được prompt cache).
> Writer không đổi — vẫn chỉ đọc đúng các chunk router chọn.
>
> - **Truy xuất lai:** BM25 (trọng số 0,7) + vector `text-embedding-3-large` 1024 chiều, trộn RRF.
>   Vector nằm trong `eval/index/lesson_embeddings.json`, nạp vào RAM, duyệt hết 167 vector
>   dưới 1 ms — **không cần vector database** ở cỡ này.
> - **Câu hỏi và đoạn bôi đen truy xuất riêng rồi xen kẽ.** Gộp chung thì đoạn bôi đen (luôn thuộc
>   bài đang mở) lấn át câu hỏi ngắn và giết mất câu chéo bài.
> - **Mất tầng vector** (thiếu key, API lỗi) thì tự nới gấp đôi số ứng viên, BM25 vẫn đủ recall.
> - **Đo được:** `npm run rag:recall` — recall@10 trên 37 câu gán nhãn tay phải là 100%,
>   vì chunk đáp án rơi khỏi danh sách ứng viên là router chắc chắn sai.
> - Dựng lại chỉ mục sau khi sửa bài: `npm run rag:index` (chỉ nhúng lại chunk có nội dung đổi).
>
> Phần dưới giữ lại lập luận gốc của bản mục lục.

167 tiêu đề, mỗi tiêu đề chừng 60 ký tự, tổng khoảng **10 KB — chừng 3–4 nghìn token**.

Nghĩa là **router nhìn thấy toàn bộ bản đồ khoá học trong một lời gọi.** Ba hệ quả:

- **Chéo bài trở nên đúng theo thiết kế.** Học viên đang ở D02 hỏi về vector database, router thấy ngay `D03 › Embedding là gì?` trong mục lục. Không cần tìm kiếm ngữ nghĩa mới phát hiện ra.
- **"Kiến thức này nằm ở đâu" chỉ là router chạy một mình**, không cần sinh câu trả lời.
- **Truy xuất trở thành tra theo mã**, không phải bài toán tìm kiếm. Router chọn mã, hệ thống `SELECT ... WHERE id = ANY($1)`.

Full-text search chỉ còn là lưới an toàn cho trường hợp router chọn hụt, và là đường nhanh cho tính năng định vị.

---

## 5 · Pipeline

```
 Câu hỏi + đoạn bôi đen + dayCode đang mở
              |
              v
 S0  CHUẨN HOÁ ................................. luật
     bóc tiền tố ngữ cảnh · cắt đoạn bôi đen quá dài · rào nội dung người dùng
              |
              v
 S1  ROUTER ....................... *** LỜI GỌI LLM #1 ***
     vào: câu hỏi + đoạn bôi đen + bài đang mở + MỤC LỤC 167 TIÊU ĐỀ
     ra : { intent, move, target_chunk_ids[], target_day, confidence }
              |
              v
 S2  TRA CHUNK ................................. SQL
     SELECT ... WHERE id = ANY(target_chunk_ids)   (tối đa 6 chunk)
     lưới an toàn: rỗng hoặc confidence thấp thì chuyển sang full-text search
              |
              +---- move = locate_content --------> trả danh sách đường dẫn, DỪNG
              +---- move = ask_clarification -----> trả câu hỏi ngược, DỪNG
              +---- move = refuse_out_of_bounds --> trả lời từ chối, DỪNG
              |
              v
 S3  SINH CÂU TRẢ LỜI ............. *** LỜI GỌI LLM #2 ***
     chỉ nhận đúng các chunk đã tra · bắt buộc trích mã sau mỗi ý
              |
              v
 S4  KIỂM TRÍCH DẪN ............................ code
     mã được trích có nằm trong mã đã truy xuất không?
     sai thì sửa một lần; vẫn sai thì hạ xuống no_source
              |
              v
 S5  DỰNG PHẢN HỒI + GHI TRACE ................. code
     mã chunk thành đường dẫn bấm được /courses/k4p1/D03?part=2#s4
     ghi agent_traces: nước đi, chunk truy xuất, chunk trích, mã bịa, độ trễ
```

Hai lời gọi LLM. Ngân sách: S1 khoảng 600 ms (output JSON ngắn), S3 khoảng 2.500 ms, còn lại dưới 100 ms. Tổng **chừng 3,2 giây** — nhanh hơn tutor VLearn hiện tại (p50 4,3 s).

---

## 6 · Bộ nước đi

Năm nước đi đầu giữ nguyên tên trong `eval/golden_set.json` để 20 case đã viết không phải sửa. Ba nước đi cuối là mới.

| Nước đi | Khi nào | Trả về gì |
|---|---|---|
| `give_direct_answer` | Có căn cứ trong bài đang mở | Câu trả lời, mỗi ý kèm mã trích dẫn |
| `ask_clarification` | Câu hỏi cụt, thiếu ngữ cảnh, hoặc confidence thấp | Đúng 1 câu hỏi, kèm 2–3 chip bấm được |
| `refuse_out_of_bounds` | Điểm danh, điểm số, "bạn là model gì", lỗi hệ thống | Từ chối, kèm nơi hỏi đúng |
| `clarify_domain_edge` | Đúng chủ đề nhưng ngoài phạm vi khoá | Nói rõ ranh giới, chỉ phần gần nhất có trong khoá |
| `adapt_to_correction` | Học viên nói "không phải ý đó" | Chạy lại router kèm lượt trước, không lặp câu cũ |
| **`cross_lesson_redirect`** | Căn cứ nằm ở bài khác bài đang mở | Trả lời ngắn 2–3 câu, kèm **đường dẫn sang đúng phần của bài kia** |
| **`locate_content`** | "Kiến thức X nằm ở đâu", "bài nào nói về Y" | Danh sách 3–5 đường dẫn xếp hạng, **không sinh giải thích** |
| **`no_source`** | Không chunk nào đủ căn cứ, hoặc bị bộ kiểm hạ cấp | Nói thẳng không có trong tài liệu, gợi ý chỗ tra |

### `cross_lesson_redirect` — hình dạng phản hồi

> Chỗ này ở **Day 03 › Embedding là gì? › Vector là gì**, không nằm trong Day 02.
> Ngắn gọn: embedding là cách biến một đoạn văn thành dãy số sao cho hai đoạn gần nghĩa thì hai dãy số gần nhau.
> **→ Mở Day 03 · phần 2** *(đường dẫn)*

Trả lời **ngắn** rồi chỉ đường — không giảng lại cả bài của buổi khác. Học viên đang ở D02 vì họ đang học D02.

---

## 7 · Chọn model

### Sinh câu trả lời và định tuyến

Sử dụng Gemini. Free tier của Google AI Studio là đường ban tổ chức khuyến nghị (`02-guide.md` §3.4), và đổi nhà cung cấp vào lúc này là rủi ro không cần thiết.

| Chặng | Model | Vì sao |
|---|---|---|
| S1 Router | bản **flash / nhỏ nhất** đang dùng | Output là JSON ngắn, cần nhanh và rẻ. Đây là chặng chạy nhiều nhất |
| S3 Sinh câu trả lời | **cùng họ, bản mạnh hơn** nếu còn hạn mức | Câu chữ tiếng Việt và độ bám trích dẫn |



### Embedding — nếu bật tầng vector

Nội dung là **tiếng Việt lẫn thuật ngữ tiếng Anh lẫn code Python**. Model thuần tiếng Việt sẽ hụt ở phần thuật ngữ; model thuần tiếng Anh hụt ở phần diễn giải. Ưu tiên model đa ngữ.

| Model HuggingFace | Kích thước | Nhận xét |
|---|---|---|
| **`BAAI/bge-m3`** | 568M | **Lựa chọn số một.** Đa ngữ, context 8.192 token (thừa sức cho chunk 2.000 ký tự), một model cho cả dense lẫn sparse |
| `AITeamVN/Vietnamese_Embedding` | 568M | Bản bge-m3 tinh chỉnh cho tiếng Việt. Tốt hơn ở phần diễn giải, có thể kém hơn ở thuật ngữ tiếng Anh |
| `bkai-foundation-models/vietnamese-bi-encoder` | 135M | Nhẹ, chạy CPU tốt. Chọn nếu không có GPU |
| `intfloat/multilingual-e5-base` | 278M | Nền tảng đa ngữ vững. Nhớ tiền tố `query:` và `passage:` |

### Rerank — chỗ đổi lấy độ chính xác trích dẫn

| Cách | Nhận xét |
|---|---|
| **`BAAI/bge-reranker-v2-m3`** | Cross-encoder đa ngữ. Lấy top-20 rồi rerank xuống top-4 là bước tăng độ chính xác lớn nhất trong một hệ RAG |
| `BAAI/bge-reranker-base` | Nhẹ hơn, kém hơn một chút |
| **Dùng chính LLM để rerank** | Router đã nhìn thấy toàn bộ mục lục nên đã làm việc rerank rồi. Với 167 chunk, đây là lựa chọn hợp lý nhất |

### Khuyến nghị dứt khoát

**Giai đoạn 1 — làm ngay, không thêm phụ thuộc nào.** Router nhìn mục lục, tra chunk theo mã, full-text `simple` của Postgres làm lưới an toàn. Với 167 chunk và thuật ngữ kỹ thuật rất đặc trưng, recall của tìm kiếm từ khoá đã cao.

**Giai đoạn 2 — nếu còn thời gian.** Bật embedding. Vì stack là Node và nhóm đã có khoá Gemini, dùng luôn embedding API của Gemini: nhúng 167 chunk một lần, lưu vào cột `embedding JSONB`, tính cosine bằng JavaScript. **167 vector thì không cần vector database** — duyệt hết mất chưa tới một mili giây. Cài pgvector hay Qdrant lúc này là tự chuốc việc.

**Giai đoạn 3 — nếu muốn dùng đúng model HuggingFace.** `bge-m3` qua HF Inference API, hoặc sidecar Python với `sentence-transformers`.

> **Cảnh báo lịch.** Sidecar cần tải torch khoảng 2 GB; HF Inference API có cold start và giới hạn tần suất. Cả hai đều là rủi ro cho buổi demo trực tiếp. Nếu làm thì làm **sau** khi bộ kiểm trích dẫn đã chạy, và **giữ đường lui** về giai đoạn 1.

Với bài toán này, **bộ kiểm trích dẫn mua được nhiều điểm hơn embedding.** Rubric chấm chuỗi quyết định, không chấm hạ tầng.

---

## 8 · Bộ kiểm trích dẫn

```js
const allowed = new Set(retrievedChunks.map((c) => c.id))
const cited   = [...answer.matchAll(/\[\[(D\d+#p\d+#s\d+)\]\]/g)].map((m) => m[1])
const invalid = cited.filter((id) => !allowed.has(id))

if (invalid.length) {
  // Sửa một lần: nói thẳng mã nào không hợp lệ, bắt viết lại
  // Vẫn còn sai  ->  move = 'no_source', không trả câu trả lời ra màn hình
}
```

Ghi cả `cited_ids` lẫn `invalid_ids` vào `agent_traces`. **Tỉ lệ lượt có `invalid_ids` rỗng chính là số đo cho chiều "có căn cứ"** trong quality bar — đo bằng máy, không chấm bằng mắt.

Một luật nữa: câu `give_direct_answer` mà **không trích mã nào** cũng tính là không đạt. Không trích dẫn và trích dẫn bịa là cùng một lỗi.

---

## 9 · Định vị kiến thức — `locate_content`

Nhận diện ở router theo dạng câu hỏi: *"X nằm ở bài nào"*, *"chỗ nào nói về Y"*, *"tìm phần về Z"*.

Chạy router một mình, không gọi S3. Trả về:

```
"Chunking" xuất hiện ở 2 chỗ:
  1. Day 04 › Chia nhỏ tài liệu (chunking) › Vì sao phải chunk   [mở]
  2. Day 03 › Xây tìm kiếm ngữ nghĩa từ đầu › Chuẩn bị dữ liệu   [mở]
```

Đây là tính năng **rẻ nhất và dễ demo nhất** trong cả kiến trúc: một lời gọi LLM, không sinh văn, nên không có chỗ để bịa. Nên làm sớm.

---

## 10 · Đổi gì trong code hiện có

| File | Việc |
|---|---|
| `db/init.sql` | ✅ đã thêm `lesson_chunks` và `agent_traces` |
| `src/scripts/build-index.js` | ✅ mới — chạy với `--db` để nạp 167 chunk |
| `src/services/retrieval.service.js` | **mới** — mục lục, tra theo mã, full-text dự phòng |
| `src/services/ai.service.js` | **viết lại** — giữ nguyên chữ ký `generateAnswer`, bên trong thành S1 đến S4 |
| `src/services/chat.service.js` | Nhận thêm `move`, `citations`, `traceId`; ghi `agent_traces` |
| `db/init.sql` bảng `messages` | Thêm cột `move VARCHAR(40)` và `citations JSONB` |
| `fe/.../TutorPanel.jsx` | Hiển thị chip trích dẫn bấm được; render chip gợi ý của `ask_clarification` |
| `eval/scripts/run_eval.js` | **Gọi qua API backend**, không gọi thẳng Gemini |

Dòng cuối quan trọng: `run_eval.js` hiện gọi thẳng Gemini bằng prompt riêng của nó. Số đo ra được **không phải số đo của sản phẩm**. Giám khảo hỏi "cái các bạn đo có phải cái các bạn demo không" là đuối ngay.

---

## 11 · Golden set còn thiếu ba loại case

20 case hiện có: `ambiguous_input` 6 · `happy_path` 6 · `out_of_bounds` 4 · `domain_edge` 3 · `correction_path` 1.

Thiếu đúng ba loại mà kiến trúc này sinh ra:

| Loại cần thêm | Số case | Ví dụ |
|---|---|---|
| `no_source` — **lớp ① chưa được phủ** | ≥3 | Đang ở D01, hỏi "Amazon Mechanical Turk là gì" — không bài nào nói |
| `cross_lesson` | ≥3 | Đang ở D02, hỏi "vector database hoạt động sao" thì phải chỉ sang D03 |
| `locate_content` | ≥2 | "Chunking nằm ở bài nào?" |

Rubric R4 đòi ≥2 case cho mỗi lớp chỗ khó. **Lớp ① hiện chưa có case nào** — đây là lỗ hổng lớn nhất của bộ hiện tại. Case thật để bốc có trong `eval/golden/lop1-khong-trich-dan.md`.

---

## 12 · Thứ tự làm

| # | Việc | Được gì |
|---|---|---|
| 1 | `npm run migrate` rồi `node src/scripts/build-index.js --db` | 167 chunk vào DB |
| 2 | `retrieval.service.js`: mục lục và tra theo mã | Nền của mọi thứ phía sau |
| 3 | `ai.service.js`: S1 router và S3 sinh, hai lời gọi thật | **R5: lời gọi AI thật ở quyết định trung tâm** |
| 4 | Bộ kiểm trích dẫn và ghi `agent_traces` | **Trích dẫn đúng — bài toán chính** |
| 5 | `locate_content` | Tính năng mới, rẻ, dễ demo |
| 6 | `cross_lesson_redirect` | Tính năng mới, ăn điểm lúc pitch |
| 7 | Thêm 8 case golden set, sửa `run_eval.js` gọi qua API | **R4: đo đúng thứ đem demo** |

Hạng mục 3 và 4 bắt buộc xong trước CP4. Hạng mục 5 và 6 là thứ khiến bài khác biệt.
