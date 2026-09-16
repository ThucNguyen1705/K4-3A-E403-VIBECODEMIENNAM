// ============================================================
// Dữ liệu seed cho khoá học — nội dung mỗi phần viết bằng markdown
// Sửa file này rồi chạy lại `npm run seed` để cập nhật database.
// ============================================================

const md = (s) => s.trim()

export const courses = [
  {
    id: 'k4p1',
    code: 'L3-L4',
    title: 'L3-L4 - Khóa 4 Phase 1',
    description: 'Nền tảng xây dựng sản phẩm AI: LLM API, Prompt Engineering, Embedding và RAG.',
    lessons: [
      // ------------------------------------------------------------------
      {
        dayCode: 'D01',
        title: 'Day01',
        topic: 'Nền tảng LLM API',
        summary:
          'Đi từ một lời gọi LLM API đơn giản đến một trợ lý hội thoại chạy trong terminal: tham số sinh, token, chi phí và streaming.',
        parts: [
          {
            title: 'Lấy repo và nhìn thấy đích đến',
            content: md(`
> **Về bài lab này:** Đi từ một lời gọi LLM API đơn giản đến một trợ lý hội thoại chạy trong terminal: tham số sinh nội dung, system prompt, token và chi phí, streaming, history có giới hạn, retry, và một mini-project ghép tất cả lại.

## Bạn làm được gì sau bài này

- Gọi Chat Completions API và đo độ trễ của một request
- Dùng system prompt để đặt tính cách cho model (persona), đếm token thật và ước tính chi phí input/output
- Stream phản hồi theo thời gian thực, giữ history có giới hạn và retry khi API lỗi tạm thời
- Ghép tất cả thành một trợ lý CLI có thống kê phiên chat

## Cần chuẩn bị

- Biết hàm Python, list và dict cơ bản
- Python 3.10 trở lên, gọi được bằng lệnh \`python\` hoặc \`python3\`
- Git và một tài khoản GitHub
- API key OpenAI hoặc NVIDIA NIM — chỉ cần khi chạy thật, không cần để chạy test

**Nhịp độ:** phút 0–60 kể từ lúc bắt đầu buổi · Checkpoint 0 ở phút 60.
`),
          },
          {
            title: 'Dựng môi trường và chạy test baseline',
            content: md(`
## Clone repo và tạo môi trường ảo

~~~bash
git clone https://github.com/vlearn/day01-llm-api.git
cd day01-llm-api
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
~~~

## Cấu hình API key

Tạo file \`.env\` từ file mẫu và điền key của bạn:

~~~bash
cp .env.example .env
~~~

> **Lưu ý:** Không bao giờ commit file \`.env\` chứa API key lên GitHub. File này đã có sẵn trong \`.gitignore\`.

## Chạy test baseline

Toàn bộ test dùng mock client nên **không cần API key**. Ở thời điểm này, kết quả mong đợi là các test đều FAIL vì bạn chưa hiện thực các hàm.

~~~bash
pytest -q
~~~
`),
          },
          {
            title: 'Gọi model và đo độ trễ',
            content: md(`
## Một request Chat Completions gồm những gì?

Mỗi request gửi lên gồm **tên model**, danh sách **messages** và các **tham số sinh**. Mỗi message có một \`role\`:

| Role | Ý nghĩa |
| --- | --- |
| \`system\` | Chỉ dẫn chung, đặt vai trò và giới hạn cho model |
| \`user\` | Câu hỏi / yêu cầu của người dùng |
| \`assistant\` | Các câu trả lời trước đó của model (history) |

**Độ trễ (latency)** được đo từ lúc gửi request đến khi nhận đủ phản hồi. Với ứng dụng chat, người dùng còn quan tâm tới *time-to-first-token* — thời gian đến khi chữ đầu tiên xuất hiện.

## Code gợi ý

~~~python
import time
from openai import OpenAI

client = OpenAI()

def call_model(prompt: str, model: str = "gpt-4o-mini") -> tuple[str, float]:
    start = time.perf_counter()
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    latency = time.perf_counter() - start
    return resp.choices[0].message.content, latency
~~~

## Bài tập

1. Gọi cùng một prompt 5 lần và tính độ trễ trung bình.
2. So sánh độ trễ giữa model lớn và model nhỏ.
`),
          },
          {
            title: 'Tham số sinh: temperature, top_p, max_tokens',
            content: md(`
## Các tham số quan trọng

- **temperature** (0 → 2): độ ngẫu nhiên của câu trả lời. Gần 0 cho kết quả ổn định, lặp lại được; cao hơn cho câu trả lời đa dạng, sáng tạo hơn.
- **top_p** (0 → 1): chỉ lấy mẫu trong nhóm token có tổng xác suất tích luỹ đạt \`top_p\`. Thường chỉ chỉnh *một trong hai* tham số temperature hoặc top_p.
- **max_tokens**: giới hạn số token đầu ra. Đặt quá thấp sẽ khiến câu trả lời bị cắt giữa chừng (\`finish_reason = "length"\`).

## Khi nào dùng giá trị nào?

| Tình huống | temperature gợi ý |
| --- | --- |
| Trích xuất dữ liệu, phân loại, trả về JSON | 0 – 0.2 |
| Trợ lý hỏi đáp, giải thích kiến thức | 0.3 – 0.7 |
| Viết sáng tạo, brainstorm ý tưởng | 0.8 – 1.2 |

> **Mẹo:** Khi viết test cho ứng dụng LLM, hãy đặt \`temperature=0\` để kết quả ít dao động nhất.
`),
          },
          {
            title: 'Token và ước tính chi phí',
            content: md(`
## Token là gì?

Model không đọc chữ mà đọc **token** — các mảnh của từ. Với tiếng Anh, trung bình 1 token ≈ 4 ký tự. Tiếng Việt có dấu thường tốn **nhiều token hơn** cho cùng một nội dung.

Chi phí một request được tính riêng cho phần **input** (prompt + history) và **output** (câu trả lời):

~~~text
chi_phí = input_tokens × giá_input / 1_000_000
        + output_tokens × giá_output / 1_000_000
~~~

## Đếm token thật từ response

~~~python
usage = resp.usage
print(usage.prompt_tokens, usage.completion_tokens, usage.total_tokens)
~~~

## Giảm chi phí

- Giữ history có giới hạn (ví dụ 10 lượt gần nhất) thay vì gửi toàn bộ hội thoại
- Dùng model nhỏ cho các tác vụ đơn giản
- Rút gọn system prompt, bỏ các chỉ dẫn lặp lại
`),
          },
        ],
      },

      // ------------------------------------------------------------------
      {
        dayCode: 'D02',
        title: 'Day02',
        topic: 'Prompt Engineering thực chiến',
        summary: 'Viết prompt rõ ràng, dùng system prompt, few-shot và yêu cầu đầu ra có cấu trúc.',
        parts: [
          {
            title: 'Cấu trúc của một prompt tốt',
            content: md(`
## Bốn thành phần của prompt

1. **Vai trò (role):** model đang đóng vai ai? — *"Bạn là trợ giảng môn Python cho người mới bắt đầu."*
2. **Nhiệm vụ (task):** cần làm gì, cụ thể đến mức nào.
3. **Ngữ cảnh (context):** dữ liệu, tài liệu, ràng buộc liên quan.
4. **Định dạng đầu ra (format):** độ dài, cấu trúc, ngôn ngữ.

## Ví dụ: prompt mơ hồ và prompt rõ ràng

~~~text
❌ Giải thích về list.

✅ Bạn là trợ giảng Python. Giải thích kiểu dữ liệu list cho người mới học
   trong tối đa 5 gạch đầu dòng, mỗi ý kèm một ví dụ code ngắn.
   Trả lời bằng tiếng Việt.
~~~

> **Nguyên tắc:** Nếu một người mới vào nhóm đọc prompt mà không hiểu phải làm gì, thì model cũng sẽ không hiểu.
`),
          },
          {
            title: 'System prompt và persona',
            content: md(`
## System prompt dùng để làm gì?

System prompt đặt **hành vi xuyên suốt** cho cả cuộc hội thoại: giọng văn, phạm vi được trả lời, cách xử lý câu hỏi ngoài lề.

~~~python
messages = [
    {
        "role": "system",
        "content": (
            "Bạn là trợ giảng của khoá LLM cơ bản. "
            "Chỉ trả lời dựa trên nội dung bài học. "
            "Nếu câu hỏi nằm ngoài bài học, hãy nói rõ là không có trong tài liệu."
        ),
    },
    {"role": "user", "content": "temperature là gì?"},
]
~~~

## Những lỗi thường gặp

- Nhồi quá nhiều quy tắc mâu thuẫn nhau vào system prompt
- Không nói rõ model nên làm gì khi **không biết** câu trả lời → model dễ bịa (hallucination)
- Đặt thông tin thay đổi theo từng lượt (ví dụ câu hỏi của user) vào system prompt
`),
          },
          {
            title: 'Few-shot prompting',
            content: md(`
## Ý tưởng

Thay vì chỉ mô tả, hãy **cho model xem vài ví dụ** đầu vào → đầu ra mong muốn. Model sẽ bắt chước định dạng và phong cách của ví dụ.

~~~text
Phân loại cảm xúc của câu bình luận thành: tích_cực, tiêu_cực, trung_lập.

Bình luận: "Bài giảng dễ hiểu, lab rất hay"  → tích_cực
Bình luận: "Video bị lỗi âm thanh cả buổi"   → tiêu_cực
Bình luận: "Buổi sau học lúc mấy giờ?"        → trung_lập

Bình luận: "Code mẫu chạy không được"         →
~~~

## Lưu ý khi chọn ví dụ

- Ví dụ phải **đa dạng**, bao phủ các nhãn/trường hợp khác nhau
- Tránh để tất cả ví dụ cùng một nhãn — model sẽ bị thiên lệch
- 2–5 ví dụ thường là đủ; nhiều hơn làm tăng chi phí token
`),
          },
          {
            title: 'Đầu ra có cấu trúc (JSON)',
            content: md(`
## Vì sao cần JSON?

Khi kết quả của model được **code xử lý tiếp** (lưu database, hiển thị UI), văn bản tự do rất khó parse. Hãy yêu cầu model trả về JSON theo schema cố định.

~~~python
resp = client.chat.completions.create(
    model="gpt-4o-mini",
    temperature=0,
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content": "Trả về JSON với các khoá: topic (string), difficulty (easy|medium|hard)."},
        {"role": "user", "content": "Câu hỏi: Làm sao để stream phản hồi từ API?"},
    ],
)
data = json.loads(resp.choices[0].message.content)
~~~

## Luôn validate kết quả

Model vẫn có thể trả về thiếu khoá hoặc sai kiểu. Dùng thư viện như **pydantic** để kiểm tra và retry khi không hợp lệ.

## Bài tập

Viết hàm \`classify_question(text)\` trả về \`{"topic": ..., "difficulty": ...}\` và viết 3 test cho nó.
`),
          },
        ],
      },

      // ------------------------------------------------------------------
      {
        dayCode: 'D03',
        title: 'Day03',
        topic: 'Embedding & Vector Database',
        summary: 'Biểu diễn văn bản thành vector, đo độ tương đồng và xây dựng tìm kiếm ngữ nghĩa.',
        parts: [
          {
            title: 'Embedding là gì?',
            content: md(`
## Từ văn bản thành vector

**Embedding** là một vector số thực (thường vài trăm đến vài nghìn chiều) biểu diễn *ý nghĩa* của một đoạn văn bản. Hai đoạn có nghĩa gần nhau sẽ có vector nằm gần nhau trong không gian.

~~~python
resp = client.embeddings.create(
    model="text-embedding-3-small",
    input=["Cách cài đặt Python", "Hướng dẫn setup môi trường Python"],
)
vectors = [d.embedding for d in resp.data]
print(len(vectors[0]))  # 1536
~~~

## Ứng dụng

- Tìm kiếm ngữ nghĩa (semantic search) — tìm theo ý nghĩa thay vì từ khoá
- Gom nhóm (clustering) câu hỏi của học viên
- Gợi ý nội dung liên quan
- Là nền tảng của **RAG** (Day04)
`),
          },
          {
            title: 'Đo độ tương đồng cosine',
            content: md(`
## Công thức

Độ tương đồng cosine đo **góc** giữa hai vector, cho giá trị từ -1 đến 1. Càng gần 1 thì hai đoạn văn càng giống nhau về nghĩa.

~~~text
cosine(a, b) = (a · b) / (‖a‖ × ‖b‖)
~~~

## Hiện thực bằng NumPy

~~~python
import numpy as np

def cosine(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))
~~~

> **Mẹo:** Nhiều model embedding đã chuẩn hoá vector về độ dài 1. Khi đó cosine chính là tích vô hướng \`a @ b\`, tính nhanh hơn.
`),
          },
          {
            title: 'Vector database',
            content: md(`
## Vì sao cần vector database?

So sánh câu hỏi với **từng** vector một (brute-force) chỉ ổn với vài nghìn đoạn văn. Vector database dùng chỉ mục **ANN** (Approximate Nearest Neighbor) để tìm các vector gần nhất trong hàng triệu bản ghi chỉ trong vài mili-giây.

## Một số lựa chọn phổ biến

| Công cụ | Đặc điểm |
| --- | --- |
| **pgvector** | Extension của PostgreSQL, tiện nếu đã dùng Postgres |
| **Chroma** | Nhẹ, chạy local, hợp để prototype |
| **Qdrant / Weaviate / Milvus** | Server riêng, mạnh cho dữ liệu lớn |

## Ví dụ với pgvector

~~~sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE chunks (id serial PRIMARY KEY, content text, embedding vector(1536));

SELECT content
FROM chunks
ORDER BY embedding <=> '[0.01, -0.02, ...]'::vector   -- <=> là khoảng cách cosine
LIMIT 5;
~~~
`),
          },
          {
            title: 'Bài tập: tìm kiếm ngữ nghĩa trong tài liệu khoá học',
            content: md(`
## Yêu cầu

Xây dựng hàm \`search(query, k=3)\` trả về 3 đoạn tài liệu liên quan nhất tới câu hỏi.

1. Chia tài liệu Day01–Day02 thành các đoạn khoảng 3–5 câu
2. Tạo embedding cho từng đoạn và lưu lại (file JSON hoặc pgvector)
3. Khi có câu hỏi: embedding câu hỏi → tính cosine với mọi đoạn → lấy top-k

## Tiêu chí hoàn thành

- Câu hỏi *"temperature dùng để làm gì"* trả về đoạn nói về tham số sinh
- Câu hỏi *"làm sao để model trả JSON"* trả về đoạn về đầu ra có cấu trúc
- Có test chạy với embedding giả lập, không cần gọi API thật
`),
          },
        ],
      },

      // ------------------------------------------------------------------
      {
        dayCode: 'D04',
        title: 'Day04',
        topic: 'Retrieval-Augmented Generation (RAG)',
        summary: 'Kết hợp truy xuất tài liệu với LLM để trả lời có căn cứ và trích dẫn nguồn.',
        parts: [
          {
            title: 'Vì sao cần RAG?',
            content: md(`
## Giới hạn của LLM thuần

- Kiến thức bị **đóng băng** tại thời điểm huấn luyện
- Không biết dữ liệu **riêng** của bạn (tài liệu khoá học, quy định nội bộ…)
- Khi không biết, model có xu hướng **bịa ra** câu trả lời nghe rất hợp lý

## RAG giải quyết thế nào?

**Retrieval-Augmented Generation**: trước khi hỏi model, ta *truy xuất* các đoạn tài liệu liên quan và *đưa vào prompt*. Model trả lời **dựa trên** tài liệu đó thay vì chỉ dựa vào trí nhớ.

~~~text
Câu hỏi ──► Truy xuất top-k đoạn liên quan ──► Ghép vào prompt ──► LLM ──► Câu trả lời + trích dẫn
~~~

> Trợ giảng AI trên VLearn là một ví dụ điển hình: câu trả lời nên bám sát nội dung bài học đang mở.
`),
          },
          {
            title: 'Chia nhỏ tài liệu (chunking)',
            content: md(`
## Vì sao phải chunk?

Tài liệu dài không thể đưa toàn bộ vào prompt, và embedding của cả một chương sẽ bị "loãng" ý nghĩa. Ta chia tài liệu thành các **chunk** vừa đủ một ý.

## Các chiến lược phổ biến

| Chiến lược | Mô tả | Khi nào dùng |
| --- | --- | --- |
| Theo số ký tự/token | Cắt mỗi 500 token, chồng lấn 50 token | Văn bản thuần, không cấu trúc |
| Theo cấu trúc | Cắt theo heading, đoạn văn | Markdown, tài liệu có mục lục |
| Ngữ nghĩa | Gộp các câu có embedding gần nhau | Khi chất lượng truy xuất quan trọng |

## Mẹo

- Giữ **metadata** cho mỗi chunk: tên bài, tiêu đề mục, vị trí — để trích dẫn nguồn
- Phần **chồng lấn (overlap)** giúp không bị mất ý ở ranh giới giữa hai chunk
`),
          },
          {
            title: 'Pipeline truy xuất – tăng cường – sinh',
            content: md(`
## Ghép prompt với ngữ cảnh

~~~python
def answer(question: str) -> str:
    chunks = search(question, k=4)
    context = "\\n\\n".join(f"[{i+1}] {c.text}" for i, c in enumerate(chunks))

    messages = [
        {"role": "system", "content": (
            "Chỉ trả lời dựa trên NGỮ CẢNH bên dưới. "
            "Trích dẫn nguồn bằng số trong ngoặc vuông, ví dụ [1]. "
            "Nếu ngữ cảnh không có thông tin, hãy nói 'Không có trong tài liệu'."
        )},
        {"role": "user", "content": f"NGỮ CẢNH:\\n{context}\\n\\nCÂU HỎI: {question}"},
    ]
    resp = client.chat.completions.create(model="gpt-4o-mini", messages=messages, temperature=0.2)
    return resp.choices[0].message.content
~~~

## Ba điểm cần chú ý

1. **Số lượng chunk (k):** quá ít dễ thiếu thông tin, quá nhiều gây nhiễu và tốn token
2. **Chỉ dẫn từ chối:** luôn cho model một "lối thoát" khi tài liệu không có câu trả lời
3. **Trích dẫn:** giúp người học kiểm chứng và tăng độ tin cậy
`),
          },
          {
            title: 'Đánh giá chất lượng RAG',
            content: md(`
## Đánh giá hai tầng

**1. Truy xuất (retrieval)** — lấy đúng tài liệu chưa?
- *Recall@k:* đoạn đúng có nằm trong top-k không

**2. Sinh câu trả lời (generation)** — trả lời có đúng và có căn cứ không?
- *Faithfulness:* mọi ý trong câu trả lời đều có trong ngữ cảnh
- *Answer relevance:* câu trả lời có đúng trọng tâm câu hỏi

## Xây bộ test nhỏ

Chuẩn bị 20–30 cặp *câu hỏi → đoạn tài liệu đúng → ý chính của đáp án*, gồm cả các câu hỏi **ngoài phạm vi** để kiểm tra model có biết từ chối.

## Mini-project

Ghép Day01–Day04 thành một trợ giảng CLI:
- Trả lời câu hỏi về tài liệu khoá học kèm trích dẫn \`[n]\`
- Từ chối lịch sự khi câu hỏi không có trong tài liệu
- Ghi log câu hỏi, câu trả lời, độ trễ và số token của mỗi lượt
`),
          },
        ],
      },
    ],
  },
]
