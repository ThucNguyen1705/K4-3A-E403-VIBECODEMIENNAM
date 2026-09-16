-- ============================================================
-- VLearn schema
-- - Chạy tự động khi container Postgres khởi tạo lần đầu
-- - Chạy lại an toàn bất cứ lúc nào bằng: npm run migrate (mọi lệnh đều IF NOT EXISTS)
-- ============================================================

-- ---------- Người dùng ----------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

-- ---------- Khoá học ----------
CREATE TABLE IF NOT EXISTS courses (
  id          VARCHAR(50)  PRIMARY KEY,          -- slug dùng trên URL, vd: k4p1
  code        VARCHAR(50)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  position    INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Ngày học (bài học) trong khoá ----------
CREATE TABLE IF NOT EXISTS lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   VARCHAR(50)  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_code    VARCHAR(50)  NOT NULL,             -- dùng trên URL, vd: D01
  position    INTEGER      NOT NULL,             -- số thứ tự buổi
  title       VARCHAR(255) NOT NULL,
  topic       VARCHAR(255),
  summary     TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (course_id, day_code)
);
CREATE INDEX IF NOT EXISTS lessons_course_position_idx ON lessons (course_id, position);

-- ---------- Các phần nội dung của một ngày học (markdown) ----------
CREATE TABLE IF NOT EXISTS lesson_parts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID         NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position    INTEGER      NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,             -- nội dung dạng markdown
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, position)
);

-- ---------- Cuộc hội thoại với Trợ giảng AI ----------
-- Mỗi lần bấm "Chat mới" trong một bài học sẽ tạo một conversation.
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  VARCHAR(50),
  day_id     VARCHAR(50),
  part_key   VARCHAR(100),
  title      TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversations_user_lesson_idx
  ON conversations (user_id, course_id, day_id, updated_at DESC);

-- ---------- Log từng tin nhắn (câu hỏi của user & phản hồi của AI) ----------
CREATE TABLE IF NOT EXISTS messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  context         TEXT,          -- đoạn văn bản user bôi đen (chỉ với role = user)
  part_key        VARCHAR(100),  -- phần bài học đang mở lúc gửi
  model           VARCHAR(100),  -- tên model sinh phản hồi (chỉ với role = assistant)
  latency_ms      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, id);
