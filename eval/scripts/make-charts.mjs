// Sinh biểu đồ SVG cho spec.md. Số đổi thì sửa DATA rồi chạy lại:
//   node eval/scripts/make-charts.mjs
//
// SVG cam kết một giao diện sáng (có nền vẽ sẵn) để hiển thị giống nhau
// trên cả light mode lẫn dark mode của GitHub.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUT_DIR = fileURLToPath(new URL('../../spec-assets/', import.meta.url))
mkdirSync(OUT_DIR, { recursive: true })

// Bảng màu tham chiếu của skill dataviz
const SURFACE = '#fcfcfb'
const INK = '#0b0b0b'
const INK_2 = '#52514e'
const GRID = '#e4e3df'
const BLUE = '#2a78d6'
const BLUE_SOFT = '#9ec5f4'
const GOOD = '#0ca30c'
const CRITICAL = '#d03b3b'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Thanh ngang bo tròn 4px ở đầu dữ liệu, chân neo vào trục 0. */
function bar(x, y, w, h, fill, r = 4) {
  if (w < r * 2) return `<rect x="${x}" y="${y}" width="${Math.max(w, 1.5)}" height="${h}" fill="${fill}"/>`
  return `<path d="M${x},${y} H${x + w - r} a${r},${r} 0 0 1 ${r},${r} V${y + h - r} a${r},${r} 0 0 1 ${-r},${r} H${x} Z" fill="${fill}"/>`
}

function barChart({ file, title, subtitle, rows, labelW = 300, footnote, colorOf, max = 100, ticks = [0, 25, 50, 75, 100] }) {
  const W = 880
  const rowH = 38
  const barH = 15
  const top = subtitle ? 86 : 66
  const plotX = labelW + 24
  const plotW = W - plotX - 92
  const H = top + rows.length * rowH + (footnote ? 54 : 26)

  const s = []
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" role="img" aria-label="${esc(title)}">`)
  s.push(`<rect width="${W}" height="${H}" fill="${SURFACE}"/>`)
  s.push(`<text x="28" y="34" font-size="17" font-weight="700" fill="${INK}">${esc(title)}</text>`)
  if (subtitle) s.push(`<text x="28" y="56" font-size="12.5" fill="${INK_2}">${esc(subtitle)}</text>`)

  // Lưới dọc mờ, nhãn trục dưới cùng
  for (const t of ticks) {
    const x = plotX + (plotW * t) / max
    s.push(`<line x1="${x}" y1="${top - 12}" x2="${x}" y2="${top + rows.length * rowH - 10}" stroke="${GRID}" stroke-width="1"/>`)
    s.push(`<text x="${x}" y="${top + rows.length * rowH + 8}" font-size="10.5" fill="${INK_2}" text-anchor="middle">${t}%</text>`)
  }

  rows.forEach((r, i) => {
    const y = top + i * rowH
    const w = (plotW * r.value) / max
    const fill = colorOf ? colorOf(r) : r.dim ? BLUE_SOFT : BLUE
    s.push(`<text x="28" y="${y + barH - 2}" font-size="13" fill="${INK}">${esc(r.label)}</text>`)
    if (r.note) s.push(`<text x="28" y="${y + barH + 13}" font-size="10.5" fill="${INK_2}">${esc(r.note)}</text>`)
    s.push(bar(plotX, y, w, barH, fill))
    s.push(
      `<text x="${plotX + w + 8}" y="${y + barH - 2}" font-size="12.5" font-weight="700" fill="${INK}">${esc(r.valueLabel)}</text>`,
    )
  })

  if (footnote) {
    s.push(`<text x="28" y="${H - 16}" font-size="11" fill="${INK_2}">${esc(footnote)}</text>`)
  }
  s.push('</svg>')
  writeFileSync(OUT_DIR + file, s.join('\n'), 'utf8')
  console.log('✓', file)
}

// ---------------------------------------------------------------- §1 Bằng chứng

barChart({
  file: 'bang-chung-mining.svg',
  title: 'Tutor hiện tại đoán thay vì hỏi lại',
  subtitle: 'Mining chatlog VLearn, lọc cohort_hint = K4 · n = 3.097 lượt / 448 học viên',
  labelW: 330,
  rows: [
    { label: 'Câu hỏi cụt ≤ 25 ký tự', note: '542 / 3.097 lượt', value: 17.5, valueLabel: '17,5%' },
    { label: 'Trong số đó, tutor hỏi lại', note: '53 / 542 — còn lại trả thẳng ~786 ký tự', value: 9.8, valueLabel: '9,8%' },
    { label: 'Trả lời KHÔNG có trích dẫn', note: 'trên các câu học viên tự gõ', value: 32.8, valueLabel: '32,8%' },
    { label: 'Thừa nhận “không có trong tài liệu”', note: 'khoảng chênh 29 điểm % so với dòng trên', value: 3.5, valueLabel: '3,5%', dim: true },
    { label: 'Tutor hỏi ngược (ask_probing_question)', note: '6 / 3.097 lượt', value: 0.2, valueLabel: '0,2%', dim: true },
    { label: 'Học viên hỏi 1 câu rồi không quay lại', note: '114 / 448 học viên', value: 25.4, valueLabel: '25,4%' },
  ],
  max: 40,
  ticks: [0, 10, 20, 30, 40],
  footnote: 'Trục 0–40%. Mỗi dòng là tỉ lệ trên cơ sở riêng của nó, ghi ngay dưới nhãn. Script đếm: eval/mining/',
})

// ---------------------------------------------------------------- §7 Kết quả

const BAR_THRESHOLD = 70
const groups = [
  { label: 'happy_path', pass: 5, total: 5 },
  { label: 'cross_lesson', pass: 3, total: 3 },
  { label: 'locate', pass: 2, total: 2 },
  { label: 'correction_path', pass: 1, total: 1 },
  { label: 'out_of_bounds', pass: 4, total: 5 },
  { label: 'no_source', pass: 2, total: 3 },
  { label: 'ambiguous_input', pass: 3, total: 5 },
  { label: 'domain_edge', pass: 0, total: 4 },
].map((g) => ({ ...g, value: (100 * g.pass) / g.total }))

barChart({
  file: 'ket-qua-theo-nhom.svg',
  title: 'Lượt 1 · chọn đúng nước đi theo nhóm case',
  subtitle: 'Golden set 28 case chạy qua agent của sản phẩm · tổng 20/28 = 71% · quality bar ≥ 70%',
  labelW: 250,
  rows: groups.map((g) => ({
    label: g.label,
    note: `${g.pass}/${g.total} case`,
    value: g.value,
    valueLabel: `${Math.round(g.value)}%`,
    pass: g.value >= BAR_THRESHOLD,
  })),
  colorOf: (r) => (r.pass ? GOOD : CRITICAL),
  footnote: 'Xanh = đạt bar 70% · Đỏ = dưới bar. domain_edge 0/4 là do nhãn golden set mâu thuẫn với định nghĩa nước đi, không phải agent trả lời sai.',
})

console.log(`\n→ ${OUT_DIR}`)
