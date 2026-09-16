import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Flame, NotebookText, Target, Clock } from 'lucide-react'
import clsx from 'clsx'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getMyCourses } from '../services/api'
import { getLastDays } from '../hooks/useProgress'
import { upcomingFeatures } from '../data/mockData'

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
  const lastDays = getLastDays()

  useEffect(() => {
    getMyCourses().then((data) => {
      setCourses(data)
      setActiveCourseId(data[0]?.id)
    })
  }, [])

  const activeCourse = courses?.find((c) => c.id === activeCourseId)
  const currentDayId = activeCourse && (lastDays[activeCourse.id] ?? activeCourse.days[0]?.id)
  const openDay = (courseId, dayId) => navigate(`/course/${courseId}/day/${dayId}`)

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
                ? `${activeCourse.days.length} buổi đang chờ môn ${activeCourse.title}. Bắt đầu từ đâu cũng được, nhưng một bài quiz sẽ cho biết nên bắt đầu từ đâu.`
                : 'Đang tải khóa học...'}
            </p>
          </div>
          {activeCourse && (
            <button
              onClick={() => openDay(activeCourse.id, currentDayId)}
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
                {activeCourse?.days.map((day) => {
                  const active = day.id === currentDayId
                  return (
                    <li key={day.id}>
                      <button
                        onClick={() => openDay(activeCourse.id, day.id)}
                        className={clsx(
                          'group flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-3 text-left text-sm transition',
                          active
                            ? 'border-brand-600 bg-brand-50/70'
                            : 'border-transparent hover:bg-slate-50',
                        )}
                      >
                        <span
                          className={clsx(
                            'grid h-4 w-4 shrink-0 place-items-center rounded-full border-2',
                            active ? 'border-brand-600' : 'border-slate-300 group-hover:border-brand-400',
                          )}
                        >
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
                        </span>
                        <span className={clsx('font-medium', active ? 'text-brand-800' : 'text-slate-700')}>
                          Buổi {day.order}: {day.title}
                        </span>
                        <span className="hidden truncate text-xs text-slate-400 sm:inline">· {day.topic}</span>
                        {active ? (
                          <span className="ml-auto text-[11px] font-bold tracking-wider text-brand-700 uppercase">
                            Đang học...
                          </span>
                        ) : (
                          <ChevronRight
                            size={16}
                            className="ml-auto text-slate-300 opacity-0 transition group-hover:opacity-100"
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
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
                  {activeCourse && (
                    <button
                      onClick={() => openDay(activeCourse.id, currentDayId)}
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
