// Logo chính thức của VLearn (bản lockup màu, tải từ vlearn.dev/brand)
// File nằm ở fe/public nên tham chiếu bằng đường dẫn tuyệt đối.
const LOGO_SRC = '/vlearn-lockup-color.svg'

// Bản lockup màu dùng cho nền sáng. Trên nền tối, đặt onLight để logo nằm trong thẻ nền trắng.
export default function Logo({ size = 'md', onLight = true, className = '' }) {
  const height = size === 'lg' ? 'h-11' : 'h-9'

  const img = <img src={LOGO_SRC} alt="VLearn" className={`${height} w-auto select-none`} />

  if (onLight) return <div className={`flex items-center ${className}`}>{img}</div>

  // Nền tối: logo navy/đỏ sẽ chìm, nên lót nền trắng
  return (
    <div className={`inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm ${className}`}>{img}</div>
  )
}
