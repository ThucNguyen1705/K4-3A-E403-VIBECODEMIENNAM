const { generateAnswer } = await import('../services/ai.service.js')
const cases=[
 ['D02','vector database hoạt động thế nào','cross_lesson_redirect'],
 ['D02','chunking nằm ở bài nào','locate_content'],
 ['D01','token là gì','give_direct_answer'],
 ['D01','Amazon Mechanical Turk là gì','no_source'],
 ['D01','giải thích','ask_clarification'],
 ['D01','điểm danh của tôi thế nào rồi','refuse_out_of_bounds'],
 ['D03','làm sao chọn kích thước chunk','cross_lesson_redirect'],
 ['D04','temperature là gì','cross_lesson_redirect'],
]
let pass=0, bia=0
const gap = Number(process.env.GAP ?? 0)
for(const [d,q,want] of cases){
 try{
  const r=await generateAnswer({question:q,dayCode:d,courseId:'k4p1'})
  const ok=r.move===want; if(ok)pass++
  if(r.trace?.invalidIds?.length) bia++
  const u=r.trace?.usage?.router??{}
  console.log(`${ok?'PASS':'FAIL'} [${d}] ${q.padEnd(32)} → ${r.move.padEnd(22)} ${String(r.latencyMs).padStart(6)}ms cache=${u.cachedTokens??0}/${u.promptTokens??0}`)
  if(!ok) console.log(`       mong ${want} · lydo: ${r.trace?.reason}`)
  if(r.trace?.citedIds?.length) console.log(`       trich: ${r.trace.citedIds.join(' ')}`)
 }catch(e){ console.log(`ERR  [${d}] ${q} → ${e.message.slice(0,90)}`) }
 if(gap) await new Promise(r=>setTimeout(r,gap))
}
console.log(`\n${pass}/${cases.length} dung nuoc di · ${bia} luot co ma bia`)
