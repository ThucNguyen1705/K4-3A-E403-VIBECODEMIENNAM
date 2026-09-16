import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

// Nút nổi xuất hiện phía trên đoạn văn bản được bôi đen trong vùng nội dung bài học
export default function SelectionAskButton({ containerRef, onAsk }) {
  const [popup, setPopup] = useState(null) // { x, y, below, text }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = () => {
      // đợi trình duyệt cập nhật selection
      setTimeout(() => {
        const sel = window.getSelection()
        const text = sel?.toString().trim()
        if (!sel || sel.rangeCount === 0 || !text || text.length < 3 || !container.contains(sel.anchorNode)) {
          setPopup(null)
          return
        }
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        const below = rect.top < 60
        const x = Math.min(Math.max(rect.left + rect.width / 2, 110), window.innerWidth - 110)
        setPopup({ x, y: below ? rect.bottom + 10 : rect.top - 10, below, text })
      }, 10)
    }

    const hide = () => setPopup(null)
    const handleKeyDown = (e) => e.key === 'Escape' && hide()

    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('scroll', hide)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', hide)
    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('scroll', hide)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', hide)
    }
  }, [containerRef])

  // Ẩn khi bắt đầu chọn lại / click ra ngoài
  useEffect(() => {
    if (!popup) return
    const handleMouseDown = (e) => !e.target.closest('[data-ask-ai-popup]') && setPopup(null)
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [popup])

  if (!popup) return null

  return (
    <button
      data-ask-ai-popup
      onMouseDown={(e) => e.preventDefault()} // giữ nguyên vùng bôi đen khi click
      onClick={() => {
        onAsk(popup.text)
        window.getSelection()?.removeAllRanges()
        setPopup(null)
      }}
      style={{
        left: popup.x,
        top: popup.y,
        transform: `translate(-50%, ${popup.below ? '0' : '-100%'})`,
      }}
      className="fixed z-50 flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-lg shadow-brand-600/30 ring-1 ring-brand-700 transition hover:bg-brand-700"
    >
      <Sparkles size={14} />
      Hỏi Trợ giảng AI về đoạn này
      <span
        className={`absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-inherit ${
          popup.below ? '-top-1' : '-bottom-1'
        }`}
      />
    </button>
  )
}
