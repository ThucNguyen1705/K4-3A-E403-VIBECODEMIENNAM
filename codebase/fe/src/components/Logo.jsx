export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'h-11 w-11 text-2xl' : 'h-9 w-9 text-xl'
  const text = size === 'lg' ? 'text-3xl' : 'text-2xl'
  return (
    <div className="flex items-center gap-2 select-none">
      <div
        className={`${box} grid place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 font-extrabold text-white shadow-md shadow-brand-500/30`}
      >
        V
      </div>
      <span className={`${text} font-extrabold tracking-tight text-brand-700`}>VLearn</span>
    </div>
  )
}
