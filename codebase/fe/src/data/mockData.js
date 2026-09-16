// ============================================================
// MOCK DATA — sẽ được thay bằng dữ liệu từ backend / database
// ============================================================

export const mockUsers = [
  {
    id: 'u1',
    email: 'demo@vlearn.dev',
    password: '123456',
    name: 'Nguyễn Văn Tài',
    shortName: 'TÀI',
  },
]

export const courses = [
  {
    id: 'k4p1',
    code: 'L3-L4',
    title: 'L3-L4 - Khóa 4 Phase 1',
    description: 'Nền tảng xây dựng sản phẩm AI: LLM API, RAG, Agent và Mini Hackathon.',
    days: [
      { id: 'D01', order: 1, title: 'Day01', topic: 'Nền tảng LLM API' },
      { id: 'D02', order: 2, title: 'DAY02', topic: 'Prompt Engineering thực chiến' },
      { id: 'D03', order: 3, title: 'DAY03', topic: 'Embedding & Vector Database' },
      { id: 'D04', order: 4, title: 'DAY04', topic: 'Retrieval-Augmented Generation (RAG)' },
      { id: 'D16', order: 16, title: 'MINI HACKATHON', topic: 'Thiết kế & dựng prototype AI' },
      { id: 'D05', order: 5, title: 'Day05', topic: 'Tool calling & Function calling' },
      { id: 'D06', order: 6, title: 'Day06', topic: 'AI Agent cơ bản' },
      { id: 'D07', order: 7, title: 'Day07', topic: 'Đánh giá chất lượng LLM (Eval)' },
      { id: 'D08', order: 8, title: 'Day08', topic: 'Guardrails & An toàn nội dung' },
      { id: 'D09', order: 9, title: 'Day09', topic: 'Triển khai & Observability' },
    ],
  },
  {
    id: 'k3p1',
    code: 'K3',
    title: 'Khoá 3 Phase 1',
    description: 'Python & Data cơ bản cho AI Engineer.',
    days: [
      { id: 'D01', order: 1, title: 'Day01', topic: 'Python cơ bản' },
      { id: 'D02', order: 2, title: 'Day02', topic: 'Pandas & xử lý dữ liệu' },
      { id: 'D03', order: 3, title: 'Day03', topic: 'Trực quan hóa dữ liệu' },
    ],
  },
]

// ---------- Nội dung chi tiết bài học ----------
// Mỗi bài học gồm: slides + labs, mỗi lab có nhiều task, mỗi task có nhiều part (reading / code).
// Mỗi part chứa danh sách "blocks" để render.

const day01 = {
  title: 'Day01',
  slides: [
    { id: 's1', title: 'material_mrxpq9zu', done: true },
    { id: 's2', title: 'day01-slide-v2-blue' },
    { id: 's3', title: 'd301-pham-mah' },
    { id: 's4', title: 'day01-llm-foundation-1' },
    { id: 's5', title: 'Day01-C401-Thầy-Đức' },
  ],
  labs: [
    {
      id: 'lab01',
      title: 'Lab 01 — Nền tảng LLM API',
      groups: [
        {
          id: 'g0',
          title: null,
          parts: [
            {
              id: 'p1',
              type: 'reading',
              title: 'Lấy repo và nhìn thấy đích đến',
              blocks: [
                {
                  type: 'callout',
                  title: 'Về bài lab này',
                  text: 'Đi từ một lời gọi LLM API đơn giản đến một trợ lý hội thoại chạy trong terminal: tham số sinh nội dung, system prompt, token và chi phí, streaming, history có giới hạn, retry, và một mini-project ghép tất cả lại.',
                },
                { type: 'heading', text: 'Bạn làm được gì sau bài này' },
                {
                  type: 'checklist',
                  items: [
                    'Gọi Chat Completions API và đo độ trễ của một request',
                    'Dùng system prompt để đặt tính cách cho model (persona), đếm token thật và ước tính chi phí input/output',
                    'Stream phản hồi theo thời gian thực, giữ history có giới hạn và retry khi API lỗi tạm thời',
                    'Ghép tất cả thành một trợ lý CLI có thống kê phiên chat',
                    'Chạy toàn bộ test bằng dữ liệu giả lập (mock), không cần API key và không tốn tiền',
                  ],
                },
                { type: 'heading', text: 'Cần chuẩn bị' },
                {
                  type: 'list',
                  items: [
                    'Biết hàm Python, list và dict cơ bản',
                    'Python 3.10 trở lên, gọi được bằng lệnh python hoặc python3',
                    'Git và một tài khoản GitHub',
                    'API key OpenAI hoặc NVIDIA NIM — chỉ cần khi chạy thật, không cần để chạy test',
                  ],
                },
                {
                  type: 'paragraph',
                  html: '<strong>Nhịp độ:</strong> phút 0–60 kể từ lúc bắt đầu buổi · Checkpoint 0 ở phút 60.',
                },
              ],
            },
            {
              id: 'p2',
              type: 'reading',
              title: 'Dựng môi trường và chạy test baseline',
              blocks: [
                { type: 'heading', text: 'Clone repo' },
                {
                  type: 'code',
                  lang: 'bash',
                  code: 'git clone https://github.com/vlearn/day01-llm-api.git\ncd day01-llm-api\npython -m venv .venv\nsource .venv/bin/activate  # Windows: .venv\\Scripts\\activate\npip install -r requirements.txt',
                },
                { type: 'heading', text: 'Chạy test baseline' },
                {
                  type: 'paragraph',
                  text: 'Toàn bộ test dùng mock client nên không cần API key. Kết quả mong đợi: tất cả test đều FAIL vì bạn chưa hiện thực các hàm.',
                },
                { type: 'code', lang: 'bash', code: 'pytest -q' },
                {
                  type: 'callout',
                  variant: 'warning',
                  title: 'Lưu ý',
                  text: 'Không commit file .env chứa API key lên GitHub.',
                },
              ],
            },
          ],
        },
        {
          id: 'g1',
          title: 'Task 1.1 — Gọi model và đo độ trễ',
          parts: [
            {
              id: 'p3',
              type: 'reading',
              title: 'Bài đọc',
              blocks: [
                { type: 'heading', text: 'Một request Chat Completions gồm những gì?' },
                {
                  type: 'paragraph',
                  text: 'Mỗi request gửi lên gồm tên model, danh sách messages (system, user, assistant) và các tham số sinh như temperature, max_tokens. Độ trễ (latency) được đo từ lúc gửi request đến khi nhận đủ phản hồi.',
                },
                {
                  type: 'list',
                  items: [
                    'temperature: độ ngẫu nhiên của câu trả lời (0 → ổn định, 1 → sáng tạo)',
                    'max_tokens: giới hạn số token đầu ra',
                    'top_p: lấy mẫu theo xác suất tích lũy',
                  ],
                },
              ],
            },
            {
              id: 'p4',
              type: 'code',
              title: 'Code gợi ý: Task 1.1 — Gọi model và đo độ trễ',
              blocks: [
                {
                  type: 'code',
                  lang: 'python',
                  code: 'import time\nfrom openai import OpenAI\n\nclient = OpenAI()\n\ndef call_model(prompt: str, model: str = "gpt-4o-mini") -> tuple[str, float]:\n    start = time.perf_counter()\n    resp = client.chat.completions.create(\n        model=model,\n        messages=[{"role": "user", "content": prompt}],\n        temperature=0.2,\n    )\n    latency = time.perf_counter() - start\n    return resp.choices[0].message.content, latency',
                },
              ],
            },
          ],
        },
        {
          id: 'g2',
          title: 'Task 1.2 — Tái sử dụng cho model nhỏ hơn',
          parts: [
            { id: 'p5', type: 'reading', title: 'Bài đọc', blocks: null },
            { id: 'p6', type: 'code', title: 'Code gợi ý: Task 1.2 — Tái sử dụng cho model nhỏ hơn', blocks: null },
          ],
        },
        {
          id: 'g3',
          title: 'Task 1.3 — So sánh hai model trên cùng prompt',
          parts: [
            { id: 'p7', type: 'reading', title: 'Bài đọc', blocks: null },
            { id: 'p8', type: 'code', title: 'Code gợi ý: Task 1.3 — So sánh hai model', blocks: null },
          ],
        },
      ],
    },
  ],
}

// Sinh nội dung mẫu cho các ngày chưa có nội dung chi tiết
function placeholderBlocks(title, topic) {
  return [
    {
      type: 'callout',
      title: 'Nội dung mẫu',
      text: `Đây là nội dung giả lập cho "${title}" thuộc chủ đề ${topic}. Dữ liệu thật sẽ được lấy từ backend.`,
    },
    { type: 'heading', text: 'Mục tiêu' },
    {
      type: 'checklist',
      items: [
        `Hiểu các khái niệm cốt lõi của ${topic}`,
        'Thực hành trên ví dụ nhỏ có test đi kèm',
        'Áp dụng vào mini-project của nhóm',
      ],
    },
    { type: 'heading', text: 'Nội dung chính' },
    {
      type: 'paragraph',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    { type: 'code', lang: 'bash', code: '# Ví dụ lệnh\npython main.py --demo' },
  ]
}

function genericLesson(day) {
  return {
    title: day.title,
    slides: [
      { id: 's1', title: `${day.title.toLowerCase()}-slide-main` },
      { id: 's2', title: `${day.title.toLowerCase()}-slide-extra` },
    ],
    labs: [
      {
        id: 'lab',
        title: `Lab ${String(day.order).padStart(2, '0')} — ${day.topic}`,
        groups: [
          {
            id: 'g0',
            title: null,
            parts: [
              { id: 'p1', type: 'reading', title: 'Giới thiệu bài học', blocks: null },
              { id: 'p2', type: 'reading', title: 'Chuẩn bị môi trường', blocks: null },
            ],
          },
          {
            id: 'g1',
            title: 'Task 1 — Thực hành cơ bản',
            parts: [
              { id: 'p3', type: 'reading', title: 'Bài đọc', blocks: null },
              { id: 'p4', type: 'code', title: 'Code gợi ý: Task 1', blocks: null },
            ],
          },
          {
            id: 'g2',
            title: 'Task 2 — Mở rộng',
            parts: [
              { id: 'p5', type: 'reading', title: 'Bài đọc', blocks: null },
              { id: 'p6', type: 'code', title: 'Code gợi ý: Task 2', blocks: null },
            ],
          },
        ],
      },
    ],
  }
}

export function buildLesson(courseId, dayId) {
  const course = courses.find((c) => c.id === courseId)
  const day = course?.days.find((d) => d.id === dayId)
  if (!course || !day) return null

  const base = courseId === 'k4p1' && dayId === 'D01' ? day01 : genericLesson(day)

  // Điền nội dung placeholder cho các part chưa có blocks
  const labs = base.labs.map((lab) => ({
    ...lab,
    groups: lab.groups.map((g) => ({
      ...g,
      parts: g.parts.map((p) => ({
        ...p,
        blocks: p.blocks ?? placeholderBlocks(p.title, day.topic),
      })),
    })),
  }))

  return { course, day, ...base, labs }
}

export const upcomingFeatures = [
  { title: 'Trợ giảng AI', desc: 'Bôi đen đoạn tài liệu và hỏi AI ngay trong bài học.' },
  { title: 'Quiz thích ứng', desc: 'Bài quiz tự điều chỉnh theo chỗ bạn đang yếu.' },
  { title: 'Bảng xếp hạng', desc: 'Thi đua chuỗi ngày học cùng bạn bè trong lớp.' },
]
