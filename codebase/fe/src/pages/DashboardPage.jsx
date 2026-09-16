import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, Flame, NotebookText, Target, Clock } from 'lucide-react'
import clsx from 'clsx'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getMyCourses } from '../services/api'

const upcomingFeatures = [
  { title: 'Trợ giảng AI', desc: 'Bôi đen đoạn tài liệu và hỏi AI ngay trong bài học.' },
  { title: 'Quiz thích ứng', desc: 'Bài quiz tự điều chỉnh theo chỗ bạn đang yếu.' },
  { title: 'Bảng xếp hạng', desc: 'Thi đua chuỗi ngày học cùng bạn bè trong lớp.' },
]

function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="text-xl font-bold tracking-wide text-slate-900 uppercase">{children}</h2>
      {action && (
        <button className="flex cursor-pointer items-center gap-1 text-xs font-bold tracking-wide text-brand-700 uppercase hover:text-brand-800">
          <ChevronRight size={16} className="text-brand-600" />
          {action}
        </button>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState(null)
  const [activeCourseId, setActiveCourseId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyCourses()
      .then((data) => {
        setCourses(data)
        setActiveCourseId(data[0]?.id)
      })
      .catch((err) => {
        setCourses([])
        setError(err.message)
      })
  }, [])

  const activeCourse = courses?.find((c) => c.id === activeCourseId)
  const firstLesson = activeCourse?.lessons[0]
  const openDay = (courseId, dayCode) => navigate(`/course/${courseId}/day/${dayCode}`)

  return (
    <div className="min-h-full bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Học tối dễ vào bài đấy {user?.shortName}! <span className="inline-block">👋</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              {activeCourse
                ? `${activeCourse.lessons.length} buổi đang chờ môn ${activeCourse.title}. Bắt đầu từ đâu cũng được, nhưng một bài quiz sẽ cho biết nên bắt đầu từ đâu.`
                : courses
                  ? 'Bạn chưa có khóa học nào.'
                  : 'Đang tải khóa học...'}
            </p>
          </div>
          {firstLesson && (
            <button
              onClick={() => openDay(activeCourse.id, firstLesson.dayCode)}
              className="cursor-pointer rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/25 hover:bg-brand-800"
            >
              Vào khóa học
            </button>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Khóa học của tôi */}
          <section>
            <SectionTitle action="Xem tất cả">Khóa học của tôi</SectionTitle>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-2 border-b border-slate-200">
                {courses?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCourseId(c.id)}
                    className={clsx(
                      '-mb-px cursor-pointer border-b-2 px-3 py-3 text-sm font-semibold transition',
                      c.id === activeCourseId
                        ? 'border-brand-600 text-brand-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800',
                    )}
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              <ul className="thin-scroll mt-4 max-h-[400px] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
                {!courses &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="h-11 animate-pulse bg-slate-50" />
                  ))}
                {error && <li className="px-4 py-6 text-center text-sm text-red-600">{error}</li>}
                {activeCourse?.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      onClick={() => openDay(activeCourse.id, lesson.dayCode)}
                      className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-brand-50/60"
                    >
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-slate-300 transition group-hover:border-brand-500" />
                      <span className="font-medium text-slate-700 group-hover:text-brand-800">
                        Buổi {lesson.position}: {lesson.title}
                      </span>
                      <span className="hidden truncate text-xs text-slate-400 sm:inline">· {lesson.topic}</span>
                      <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-slate-400">
                        <BookOpen size={13} /> {lesson.partCount} phần
                      </span>
                      <ChevronRight size={16} className="text-slate-300 transition group-hover:text-brand-500" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Cột phải */}
          <aside className="space-y-8">
            <section>
              <SectionTitle>Chuỗi ngày học</SectionTitle>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-800 to-brand-950 p-5 text-white shadow-md">
                <div className="absolute top-0 -right-10 h-full w-40 rounded-l-full bg-white/5" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Flame className="text-orange-300" />
                    <span className="text-sm font-semibold">Học hôm nay để bắt đầu chuỗi</span>
                  </div>
                  {firstLesson && (
                    <button
                      onClick={() => openDay(activeCourse.id, firstLesson.dayCode)}
                      className="cursor-pointer rounded-full bg-white px-4 py-1.5 text-xs font-bold text-brand-800 hover:bg-brand-50"
                    >
                      Vào học
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section>
              <SectionTitle>Chỗ bạn đang yếu</SectionTitle>
              <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                <Target size={20} className="shrink-0 text-brand-500" />
                Chưa đo được phần nào. Làm một bài quiz để VLearn biết bạn đang ở đâu.
              </div>
            </section>

            <section>
              <SectionTitle action="Xem tất cả">Hoạt động học tập</SectionTitle>
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
                <NotebookText className="text-slate-400" />
                Chưa có hoạt động nào được ghi lại.
              </div>
            </section>
          </aside>
        </div>

        {/* Sắp có */}
        <section className="mt-12">
          <SectionTitle>Sắp có trên trang chủ</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">{f.title}</h3>
                  <span className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                    <Clock size={11} /> Sắp ra mắt
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
