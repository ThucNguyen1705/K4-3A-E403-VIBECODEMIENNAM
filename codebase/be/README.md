# VLearn API

Express 5 + PostgreSQL 16 (Docker). Đăng ký / đăng nhập bằng JWT, khoá học / ngày học / nội dung bài học lưu trong database, và log hội thoại với Trợ giảng AI (phản hồi AI hiện là mock).

## Chạy local

Cách nhanh nhất: `./dev.sh` ở thư mục `codebase/` (bật DB, migrate, seed, chạy BE + FE). Hoặc chạy tay:

```bash
cd codebase/be
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run db:up                 # Postgres (cổng 5433) + Adminer (http://localhost:8080)
npm run setup                 # migrate schema + seed dữ liệu
npm run dev                   # API: http://localhost:4000/api
```

Sau đó chạy frontend (`cd codebase/fe && npm run dev`). Vite proxy `/api` sang cổng 4000.

| Script | Tác dụng |
| --- | --- |
| `npm run db:up` / `db:down` | Bật / tắt container database |
| `npm run migrate` | Áp dụng `db/init.sql` (idempotent — chạy lại an toàn, không mất dữ liệu) |
| `npm run seed` | Tạo tài khoản demo và đồng bộ nội dung khoá học từ `src/scripts/seed-data/courses.js` |
| `npm run setup` | `migrate` + `seed` |
| `npm run db:reset` | **Xoá sạch dữ liệu** và tạo lại schema (sau đó chạy `npm run seed`) |
| `docker compose --profile api up -d` | Chạy luôn API trong Docker |

Adminer: System `PostgreSQL`, Server `db`, Username/Password `vlearn`, Database `vlearn`.

## Database

| Bảng | Nội dung |
| --- | --- |
| `users` | id, email (unique, không phân biệt hoa thường), name, password_hash |
| `courses` | id (slug, vd `k4p1`), code, title, description, position |
| `lessons` | Ngày học: course_id, day_code (vd `D01`, unique trong khoá), position, title, topic, summary |
| `lesson_parts` | Phần nội dung của ngày học: lesson_id, position, title, **content (markdown)** |
| `conversations` | Một phiên chat của user trong một bài học (course_id, day_id, part_key = id của lesson_part) |
| `messages` | Log từng tin nhắn. `role` = `user` \| `assistant`, `context` = đoạn bôi đen, `model`, `latency_ms` |

### Sửa nội dung bài học

Sửa [src/scripts/seed-data/courses.js](src/scripts/seed-data/courses.js) rồi chạy `npm run seed`. Seed upsert theo `(course_id, day_code)` và `(lesson_id, position)` nên **id giữ nguyên** giữa các lần seed. Ngày học / phần nội dung bị xoá khỏi file cũng bị xoá khỏi DB.

## API

Các route có 🔒 cần header `Authorization: Bearer <token>`. Lỗi luôn trả dạng `{ "error": { "message", "details?" } }`.

| Method | Path | Body / Query | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/health` | | Kiểm tra API + DB |
| POST | `/api/auth/register` | `{ name, email, password }` | Đăng ký → `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | Đăng nhập → `{ token, user }` |
| GET | `/api/auth/me` 🔒 | | Thông tin user hiện tại |
| GET | `/api/courses` 🔒 | | Danh sách khoá học, mỗi khoá kèm `lessons[]` (không có nội dung) |
| GET | `/api/courses/:courseId` 🔒 | | Một khoá học kèm `lessons[]` |
| GET | `/api/courses/:courseId/lessons` 🔒 | | Danh sách ngày học: `id, dayCode, position, title, topic, summary, partCount` |
| GET | `/api/courses/:courseId/lessons/:dayCode` 🔒 | | Chi tiết ngày học kèm `parts[]`: `id, position, title, content` |
| POST | `/api/chat/ask` 🔒 | `{ question, context?, conversationId?, courseId?, dayId?, partKey? }` | Lưu câu hỏi, sinh phản hồi (mock), lưu phản hồi → `{ conversationId, userMessage, aiMessage }` |
| GET | `/api/chat/conversations` 🔒 | `?courseId&dayId&limit` | Danh sách hội thoại |
| GET | `/api/chat/conversations/:id/messages` 🔒 | | Toàn bộ log tin nhắn |
| DELETE | `/api/chat/conversations/:id` 🔒 | | Xoá hội thoại |

Không gửi `conversationId` thì backend tạo hội thoại mới. Gửi lại `conversationId` nhận được để hỏi tiếp trong cùng hội thoại.

## Tích hợp AI thật

Chỉ cần sửa `generateAnswer()` trong [src/services/ai.service.js](src/services/ai.service.js). Hàm nhận `{ question, context, history }` và trả `{ content, model, latencyMs }`. Phần lưu log ở `chat.service.js` giữ nguyên. Nội dung bài học đang mở có thể lấy từ bảng `lesson_parts` theo `partKey` để làm ngữ cảnh (grounding).

## Cấu trúc

```
src/
  server.js, app.js, config.js, db.js
  middlewares/  auth (JWT), validate (zod), error
  routes/       auth.routes.js, course.routes.js, chat.routes.js
  services/     auth.service.js, course.service.js, chat.service.js, ai.service.js (mock)
  scripts/      migrate.js, seed.js, seed-data/courses.js
db/init.sql     schema
```
