# Lab 05–06 — AI Product Hackathon: SPEC → Prototype → Demo

> Xây dựng **AI Spec**, **prototype có gọi AI thật** và **bộ kiểm thử định lượng** cho một tính năng sản phẩm AI theo nhóm.
>
> 📦 Repo đề bài: https://github.com/VinUni-AI20k/K4-3A-Day05-06-AI-Product-Hackathon

---

## 🗺️ Tổng quan & Deadline

| # | Giai đoạn | Deadline | Nộp gì (form do **đội trưởng** nộp) | File chính trong repo |
|---|-----------|----------|--------------------------------------|-----------------------|
| 0 | Chuẩn bị đội, chọn track, tạo repo | Trước CP1 | — | `README.md`, `spec.md`, `TEAMMATES.md` |
| **CP1** | Khám phá bài toán, bằng chứng, Canvas | **19:30 — 16/9** | Link repo + Canvas 4 ô + ≥2 willing users | `spec.md` §1, §2 |
| **CP2** | Luồng trải nghiệm + bản mẫu tương tác | **21:00 — 16/9** | Link Figma / code / video luồng | `spec.md` §4, §6 · `codebase/` |
| **CP3** | Prototype AI thật + eval lượt 1 | **16:00 — 17/9** | Video ~30s + số đo eval lượt 1 | `codebase/` · `eval/` |
| **CP4** | Hoàn thiện AI Spec + **khóa Quality Bar** | **21:00 — 17/9** 🔒 | Link trực tiếp tới `spec.md` | `spec.md` (đủ 8 phần) |
| **CP5** | Validation user + slide + video dự phòng | **13:00 — 18/9** 🔒 | `demo-slides.pdf` + link video demo | `demo-slides.pdf` · `validation/` · `spec.md` §9 |
| **CP6** | Nộp tổng kết + thi thuyết trình (LAB 6) | **17:30 — 18/9** | **Mỗi thành viên** nộp link repo trên VLearn | `reflection/` |

### Cấu trúc repo cuối cùng

```
K4-3A-E403-VIBECODEMIENNAM/
├── README.md                 # Copy README đề bài + bảng phân công hoàn chỉnh
├── TEAMMATES.md              # Họ tên, mã học viên, vai trò, liên hệ đội trưởng
├── spec.md                   # AI Spec 8 phần (đã khóa Quality Bar) + §9 Changelog
├── demo-slides.pdf           # Đúng 6 trang
├── codebase/                 # Prototype gọi AI thật (ghi rõ phần mock) + logging
├── eval/
│   ├── golden_set.json       # ≥20 case
│   └── run_results.md        # Kết quả các lượt chạy + phân tích lỗi
├── validation/
│   └── user_testing_log.md   # ≥5 user ngoài nhóm, quote nguyên văn
└── reflection/
    └── <MãHV>_<HoTen>.md     # Thu hoạch cá nhân, mỗi người 1 file
```

### ⚠️ Lỗi thường gặp

| Sai | Đúng |
|-----|------|
| Fork repo đề bài → lộ dữ liệu nội bộ | Tạo repo **mới hoàn toàn**, chỉ copy file template cần thiết |
| Đổi người nộp form giữa các checkpoint | Dùng **duy nhất mã học viên của đội trưởng** cho cả 5 mốc |
| Prototype không có AI thật | **Bắt buộc** gọi model thật ở quyết định trung tâm + lưu trace log |
| Commit thư mục `data/` của repo đề | 🛑 **Tuyệt đối không**: bị xử lý theo quy chế + trừ điểm |
| Thành viên không hiểu phần mình làm | Ai có tên trong bảng phân công phải **giải thích được** phần đó, nếu không thì **0 điểm cá nhân** |

---

## 0️⃣ Chuẩn bị đội ngũ, chọn track và khởi tạo repository

**Mục tiêu:** thống nhất nhân sự, định hướng bài toán, dựng repo an toàn. Cuộc thi chấm **tư duy thiết kế sản phẩm AI** (nỗi đau có bằng chứng → lát cắt khả thi → kiểm chứng bằng số liệu), không chấm khối lượng code.

### Việc cần làm

- [ ] **Chọn track:** đọc `01-challenge-brief.md` và `tracks/README.md`. Chọn **1 track + 1 hướng đi cụ thể**:
  - Track A: VLearn Tutor
  - Track B: Trợ lý Discord
  - Track C: Lesson Studio
  - Track D: Học tập thích ứng & tương tác
  - Track E: Làn mở AI20k
- [ ] **Tạo repo Public mới** (không Fork), tên theo mẫu `K4-3A-<phòng>-<tên nhóm>`
  - `<phòng>`: E402 hoặc E403 · `<tên nhóm>`: viết liền, không dấu, không khoảng trắng
  - Ví dụ: `K4-3A-E403-StudyPulse`
- [ ] **Khởi tạo & push:**
  ```bash
  git init
  echo "# K4-3A-E403-StudyPulse" > README.md
  git add README.md
  git commit -m "chore: initial commit for hackathon project"
  git branch -M main
  git remote add origin https://github.com/<tai-khoan>/K4-3A-E403-StudyPulse.git
  git push -u origin main
  ```
- [ ] Copy `03-ai-spec-template.md` → đổi tên thành **`spec.md`** ở thư mục gốc
- [ ] Copy nguyên văn **`README.md`** của repo đề → điền bảng thành viên: *Họ tên · Mã học viên · Vai trò chính · Phần việc cụ thể*
- [ ] Tạo **`TEAMMATES.md`**: danh sách thành viên, MSSV, thông tin liên hệ đội trưởng

### ✅ Tự kiểm tra

- [ ] Đã chốt **3–4 thành viên** và bầu **đội trưởng**
- [ ] Repo **Public**, mở được từ cửa sổ ẩn danh
- [ ] Tên repo đúng cú pháp `K4-3A-<phòng>-<tên nhóm>`
- [ ] Có đủ `spec.md`, `TEAMMATES.md`, `README.md` (bảng phân công hoàn chỉnh)

> **Xong khi:** repo hiển thị công khai, có đúng các file quy định và ít nhất 1 commit.

---

## 1️⃣ CP1: Khám phá bài toán, thu thập bằng chứng và chốt Canvas

⏰ **Deadline: 19:30 — 16/9**

**Mục tiêu:** xác định rõ **ai** hưởng lợi và **nỗi đau thực tế** trước khi code.

```
Nỗi đau thực tế → Bằng chứng số liệu (A/B) → Lát cắt MỘT CÂU → Canvas 4 ô & phân công → Prototype & Spec
```

### Khái niệm cần nắm

- **Lát cắt một câu:** đúng **1 người dùng** · làm **1 công việc** · qua **1 quyết định AI** · tạo **1 kết quả đo được**.
- **Triệu chứng ≠ nỗi đau:**
  - ❌ "Học viên thấy bất tiện"
  - ✅ "Học viên mất 15 phút tìm tài liệu mỗi buổi lab và bỏ lỡ bài thực hành"
- **Chuẩn bằng chứng:**
  - **Chuẩn A:** khảo sát **≥20 người ngoài nhóm**, **>50%** xác nhận
  - **Chuẩn B:** khai thác dataset có sẵn, **số đếm rõ ràng** + **≥5 trích dẫn nguyên văn**

### Việc cần làm

- [ ] **Thu thập bằng chứng:** khai thác `data/` của repo đề (chỉ đọc, KHÔNG commit) **hoặc** phỏng vấn ≥20 học viên ngoài nhóm. Ghi câu hỏi, câu trả lời nguyên văn và số liệu thống kê vào file nháp.
- [ ] **Soạn Canvas 4 ô** (theo mẫu trong `01-challenge-brief.md`):

  | Ô | Nội dung |
  |---|----------|
  | **Thông tin chung** | Tên hướng đi · Job executor · Quy trình hiện tại |
  | **Nỗi đau cốt lõi** | 1 câu, **không chứa từ khóa giải pháp AI**, kèm số liệu/dẫn chứng |
  | **Lát cắt giải pháp** | Đúng 1 câu: `[Người dùng] cần [Công việc] được [Quyết định AI] giúp [Kết quả]` |
  | **Cam kết triển khai** | Mức tự động hóa dự kiến · Phân công từng người · **≥2 willing users ngoài nhóm** |

- [ ] Đưa Canvas vào **§1 và §2** của `spec.md`, commit & push:
  ```bash
  git add spec.md
  git commit -m "docs: finalize CP1 canvas and evidence log"
  git push origin main
  ```
- [ ] **Đội trưởng nộp form CP1:** họ tên + mã học viên đội trưởng · link repo · nội dung Canvas 4 ô · danh sách 2 willing users

> ⚠️ **Phải khai báo willing users ngay tại CP1** (tên cụ thể, ≥2 người ngoài nhóm). Đây là điều kiện bắt buộc để lấy điểm **R6** ở CP5. Đừng để cuối mới tìm.

> **Xong khi:** form được ghi nhận đúng hạn và repo xem được đầy đủ Canvas đã commit.

---

## 2️⃣ CP2: Thiết kế luồng trải nghiệm và dựng bản mẫu tương tác

⏰ **Deadline: 21:00 — 16/9**

**Mục tiêu:** tìm ra lỗ hổng UX và logic **trước khi** code model. Sửa trên mock chỉ mất vài phút, còn sửa sau khi đã code có thể mất cả sự kiện.

### Khái niệm cần nắm

**Mức tự động hóa theo chi phí sai sót (cost-of-error):**

| Mức | Khi nào dùng |
|-----|--------------|
| **Augment** (hỗ trợ) | Sai sót nghiêm trọng → con người quyết định cuối |
| **Conditional** (tự động có điều kiện) | Chi phí sai thấp hoặc sửa được ngay |
| **Automate** (tự động hoàn toàn) | Chi phí sai rất thấp, có cơ chế sửa tức thì |

**4 nhánh trải nghiệm bắt buộc thiết kế:**

1. **Happy path:** AI tự tin cao
2. **Low-confidence:** AI thiếu tự tin
3. **Failure / no-grounding:** không tìm thấy căn cứ
4. **Correction:** người dùng sửa kết quả trực tiếp

**Nguyên tắc thiết kế:** chọn **≥4 nguyên tắc** từ Google **PAIR** hoặc Microsoft **HAX Toolkit**, chỉ rõ vị trí áp dụng trên giao diện.

### Việc cần làm

- [ ] **Thiết kế hành trình người dùng** bằng 1 trong 3 hình thức:
  - Clickable prototype (Figma / Canva / HTML-CSS-JS tĩnh)
  - Flowchart chi tiết (input, điểm gọi AI, các nhánh ngoại lệ)
  - Video quay màn hình 1 vòng tương tác đầu → cuối
- [ ] Cập nhật **§4 và §6** của `spec.md`:
  - Mức prototype nhắm tới: **Sketch / Mock / Working**
  - Phần nào **mock**, phần nào **chạy thật**
  - Bảng **4 nguyên tắc HAX/PAIR** + vị trí áp dụng
- [ ] Lưu code giao diện hoặc ảnh flowchart vào `codebase/`, commit & push:
  ```bash
  mkdir -p codebase
  # Di chuyển file thiết kế / code giao diện vào codebase/
  git add codebase/ spec.md
  git commit -m "feat: complete CP2 interactive flow and design principles"
  git push origin main
  ```
- [ ] **Đội trưởng nộp form CP2:** link Figma / link code / link video luồng

> 💡 CP2 **chưa cần AI chạy thật**, chỉ cần luồng thông suốt và cách xử lý giao diện. Gặp khó về kiến trúc thì hỏi trợ giảng ngay tại mốc này.

> **Xong khi:** bản mẫu chạy thông suốt đầu → cuối, `spec.md` có đủ các nhánh trải nghiệm, form được ghi nhận đúng hạn.

---

## 3️⃣ CP3: Xây dựng prototype AI thật và đo lường kiểm thử sơ bộ

⏰ **Deadline: 16:00 — 17/9**

**Mục tiêu:** biến thiết kế thành prototype chạy thật, có **ít nhất 1 lời gọi LLM/AI thật** ở quyết định trung tâm (không hardcode), và đo bằng số liệu.

### Golden set: yêu cầu tối thiểu (≥20 case)

| Nhóm case | Số lượng |
|-----------|----------|
| **4 lớp chỗ khó** (mỗi lớp ≥2 case) | ≥8 |
| &nbsp;&nbsp;① Nguồn sự thật | ≥2 |
| &nbsp;&nbsp;② Mơ hồ / thiếu thông tin | ≥2 |
| &nbsp;&nbsp;③ Ngoài phạm vi / thẩm quyền | ≥2 |
| &nbsp;&nbsp;④ Đặc thù nghiệp vụ | ≥2 |
| Case phổ biến hàng ngày | 8–10 |
| Edge case hiếm gặp | 2–4 |
| **Trong đó lấy từ dữ liệu / hội thoại thực tế** | **≥10** |

**Tỷ lệ đạt** = số case đạt tiêu chí nghiệm thu / tổng số case.

### Việc cần làm

- [ ] **Code module quyết định trung tâm** trong `codebase/`, gọi API AI thật (OpenAI / Gemini / Anthropic / model local)
- [ ] **Logging:** ghi lại **prompt đầu vào** và **response thô** của model
- [ ] Tạo **`eval/golden_set.json`** (hoặc `.csv`): 20 case, phân loại theo taxonomy 4 lớp
- [ ] Viết **script hoặc hướng dẫn chạy** toàn bộ 20 case qua prototype
- [ ] Tạo **`eval/run_results.md`**: số case đạt, số case fail, % đạt, **phân tích nguyên nhân từng case sai**
- [ ] **Quay video ~30s:** user nhập → hệ thống gọi → AI trả kết quả thật (không cần cắt ghép hay lồng tiếng)
- [ ] Commit & push:
  ```bash
  git add codebase/ eval/
  git commit -m "feat: integrate live AI call and document run 1 eval results"
  git push origin main
  ```
- [ ] **Đội trưởng nộp form CP3:** video 30s + số đo eval lượt 1

> ⚠️ **Số liệu phải trung thực:** đạt 12/20 nhưng phân tích lỗi kỹ vẫn được **full điểm**. Làm đẹp số liệu hoặc báo tỷ lệ tuyệt đối mà không có log thì **mất toàn bộ điểm khối kiểm thử**.

> **Xong khi:** `codebase/` chứng minh có gọi AI thật, `eval/` đủ 20 case + kết quả, video nộp đúng hạn.

---

## 4️⃣ CP4: Hoàn thiện AI Spec và khóa ngưỡng chất lượng

⏰ **Deadline: 21:00 — 17/9** 🔒 *(Quality Bar bị khóa cứng sau mốc này)*

**Mục tiêu:** `spec.md` là sản phẩm trung tâm, chiếm **45/67 điểm** chấm trên repo.

### Khái niệm: Quality Bar

Là cam kết **bằng con số** về điều kiện để sản phẩm được coi là đạt. Ví dụ:
> *"Đạt khi >80% case trả về đúng dữ liệu gốc **và** 100% case ngoài phạm vi bị từ chối an toàn."*

Chốt trước để không hạ chuẩn sau khi đã biết kết quả. **Tự khai báo phần chưa xong thì không bị trừ điểm**, còn che giấu khuyết điểm sẽ bị chấm nặng.

### Checklist 8 phần của `spec.md`

| Phần | Nội dung bắt buộc |
|------|-------------------|
| **§1 & §2** | Dữ liệu người dùng · bài toán cốt lõi · bằng chứng số liệu · bảng so sánh tác động **≥3 phương án ứng viên** |
| **§3 & §4** | Phân tích **2 sản phẩm tương tự** trên thị trường · lát cắt một câu · **≥3 non-goals** · bảng **4 nguyên tắc HAX/PAIR** |
| **§5 & §6** | **4 lớp chỗ khó** với **≥8 kịch bản** cụ thể · **4 nhánh trải nghiệm** xử lý ngoại lệ |
| **§7** | Định nghĩa kiểm thử cho từng chiều chất lượng · link tới golden set trong `eval/` · **công thức Quality Bar** |
| **§8** | Bảng phân công chi tiết (đầu việc + tên người phụ trách) · kế hoạch kiểm thử thực tế |

### Việc cần làm

- [ ] Rà soát và hoàn thiện đủ **8 phần** ở bảng trên
- [ ] Ghi **công thức Quality Bar** chính thức vào **§7**
- [ ] **Tự khai báo** các chức năng hoặc case chưa xử lý kịp trong lượt chạy hiện tại
- [ ] Commit & push **trước 21:00**:
  ```bash
  git add spec.md
  git commit -m "docs: finalize spec.md and freeze quality bar for CP4"
  git push origin main
  ```
- [ ] **Đội trưởng nộp form CP4:** link **trực tiếp** tới file `spec.md` trên GitHub

> 🛑 Sau **21:00 — 17/9**, **không được sửa** Quality Bar. Nếu sửa tiêu chuẩn sau mốc này, kết quả đo tại buổi pitch sẽ **bị vô hiệu**.

> **Xong khi:** `spec.md` có commit trước 21:00 17/9, đủ 8 phần đúng template, form được ghi nhận.

---

## 5️⃣ CP5: Xác thực người dùng ngoài nhóm, xuất bản slide và đóng gói dự phòng

⏰ **Deadline: 13:00 — 18/9** 🔒 *(đóng hệ thống hoàn toàn, không nhận thêm artifact)*

**Mục tiêu:** hoàn tất hồ sơ, chuẩn bị phương án dự phòng (phòng khi mạng hoặc API sập lúc demo), và làm khối **R6: Validation** (**+8 điểm**, nâng trần điểm từ **92 → 100**).

### Khái niệm: Mom Test

- ✅ Giao **1 nhiệm vụ cụ thể** trên sản phẩm → **im lặng quan sát** → ghi lại **chỗ bị vướng** + **trích nguyên văn** câu họ nói
- ❌ Không hỏi xã giao kiểu "Sản phẩm này có hay không?"

### Việc cần làm

- [ ] **User testing:** mời **≥5 người ngoài nhóm**, trong đó **≥2 người là willing users đã khai báo ở CP1**
- [ ] Ghi vào **`validation/user_testing_log.md`** theo bảng:

  | Người thử | Nhiệm vụ giao | Điểm tắc nghẽn | Trích dẫn nguyên văn | Quyết định xử lý của nhóm |
  |-----------|---------------|----------------|----------------------|---------------------------|

- [ ] Thực hiện **≥1 điều chỉnh sản phẩm** dựa trên feedback (hoặc giải thích lý do giữ nguyên) → ghi vào **§9 Changelog** của `spec.md`
- [ ] **Slide đúng 6 trang** (theo §5.1 của `02-guide.md`), xuất PDF tên **`demo-slides.pdf`** ở thư mục gốc:

  | Trang | Nội dung |
  |-------|----------|
  | 1 | Bối cảnh, bài toán, bằng chứng thực tế (chuẩn A/B) |
  | 2 | Lát cắt giải pháp một câu + kiến trúc tổng quan |
  | 3 | 4 lớp chỗ khó + cách giải quyết trong UX |
  | 4 | Bảng kết quả đo thực tế **đối chiếu Quality Bar đã khóa ở CP4** |
  | 5 | Bài học từ case thất bại + feedback người dùng (R6) |
  | 6 | Kế hoạch mở rộng + đóng góp của từng thành viên |

- [ ] **Quay video demo dự phòng** toàn bộ kịch bản trình bày trên sân khấu, upload và **để quyền công khai**
- [ ] Commit & push:
  ```bash
  git add demo-slides.pdf validation/ spec.md
  git commit -m "build: publish demo slides and R6 validation log for CP5"
  git push origin main
  ```
- [ ] **Đội trưởng nộp form CP5:** file `demo-slides.pdf` + link video demo dự phòng

### ✅ Danh mục nghiệm thu CP5

- [ ] `demo-slides.pdf` **đúng 6 trang** ở thư mục gốc repo
- [ ] Video demo dự phòng đã upload, **quyền truy cập công khai**
- [ ] `validation/` có nhật ký **≥5 user** kèm trích dẫn nguyên văn
- [ ] **§9 Changelog** trong `spec.md` ghi nhận thay đổi từ ý kiến người dùng

> **Xong khi:** form được ghi nhận trước 13:00 18/9, repo có đủ slide PDF + hồ sơ kiểm chứng người dùng.

---

## 6️⃣ CP6: Nộp bài tổng kết và thi thuyết trình (LAB 6)

⏰ **Thi: 17:30 — 18/9**

**Mục tiêu:** buổi thi **không phải thời gian code thêm**, mà là lúc bảo vệ giải pháp, chứng minh năng lực kỹ thuật và cho thấy nhóm hiểu sâu bài toán.

### Việc cần làm

- [ ] **Reflection cá nhân:** mỗi người tạo 1 file trong `reflection/`, đặt tên theo mã học viên (vd: `reflection/S1234_NguyenVanA.md`), gồm:
  - Vai trò cá nhân
  - Phần việc trực tiếp phụ trách
  - Cách đã dùng AI trong quá trình xây dựng
  - 1 bài học thực tế rút ra từ các case thất bại của nhóm
- [ ] **Nộp VLearn (mỗi thành viên):** đăng nhập tài khoản cá nhân → bài Lab 05–06 → dán link repo GitHub **chung của nhóm** (mọi người nộp cùng 1 link)
- [ ] **Đội trưởng kiểm tra lại** đã nộp đủ form **CP1 → CP5** bằng **cùng 1 mã học viên**, để hệ thống gộp **25 điểm nộp bài** của nhóm
- [ ] Repo đúng **cấu trúc chuẩn** (xem phần Tổng quan)
- [ ] **Mỗi thành viên ôn kỹ phần mình phụ trách** trong bảng phân công ở `README.md`

### Thể thức thi

Hai phòng thi riêng biệt, mỗi phòng có hội đồng giám khảo riêng: **E403** (6 cụm) và **E402** (5 cụm).

| Vòng | Thời gian | Luật |
|------|-----------|------|
| **Vòng cụm** (game đầu tư vốn) | **6 phút** (E403) / 7 phút (E402) | Mỗi đội có **100 điểm vốn** để đầu tư cho các đội khác trong cụm (**không đầu tư cho đội nhà**, tổng phải **đúng 100**). Đội nhận nhiều vốn nhất cụm vào thẳng chung kết phòng |
| **Chung kết phòng** | **10 phút** | 7 phút trình bày + demo trực tiếp · 3 phút trả lời câu hỏi giám khảo |

> 🛑 **Quy tắc Vibe-coding:** giám khảo có thể hỏi **bất kỳ thành viên nào** về phần việc có tên người đó trong `README.md`. Không giải thích được bản chất kỹ thuật hoặc quyết định thiết kế của phần mình → **0 điểm cá nhân phần đó**.

> 🎉 **Hoàn thành môn khi:** repo public đúng cấu trúc chuẩn · mọi thành viên đã nộp link trên VLearn · đội trưởng đã nộp đủ 5 form bằng cùng 1 mã học viên · nhóm sẵn sàng thuyết trình tại LAB 6.

---

## 📚 Phụ lục

### Mục tiêu học tập
- Xác định lát cắt sản phẩm AI một câu từ dữ liệu thực tế, phân tích bài toán người dùng
- Hoàn thành AI Spec 8 phần và chốt quality bar định lượng trước CP4
- Prototype chạy end-to-end, có ≥1 lời gọi AI thật ở quyết định trung tâm
- Golden set ≥20 case và đo tỷ lệ đạt thực tế

### Cần chuẩn bị
- Kiến thức prompt engineering, tool calling, kiến trúc RAG
- Tài khoản GitHub + môi trường lập trình (Python 3.10+ / Node.js)
- Git & GitHub (repo công khai)
- Công cụ làm slide xuất PDF (Google Slides / Canva / Marp)
