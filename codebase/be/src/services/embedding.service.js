// Gọi embedding API — dùng chung cho build-embeddings.js (nhúng chunk) và lúc truy vấn.
//
// Lúc BUILD: model chọn theo env (EMBED_PROVIDER, EMBED_MODEL, EMBED_DIMS).
// Lúc TRUY VẤN: retrieval.service truyền đúng provider/model/dims ghi trong file chỉ mục,
// nên đổi AI_PROVIDER của router/writer không làm vector câu hỏi lệch không gian với chỉ mục.
// Vector luôn được chuẩn hoá về độ dài 1, nên cosine = tích vô hướng.

const env = process.env

const PROVIDERS = {
  openai: {
    key: () => env.OPENAI_API_KEY ?? env.OPENAI_API ?? '',
    baseUrl: () => env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    // 3-large thắng 3-small rõ trên câu hỏi tiếng Việt diễn đạt khác chữ (xem rag-recall.mjs)
    model: 'text-embedding-3-large',
    dims: 1024,
  },
  gemini: {
    key: () => env.GEMINI_API_KEY ?? env.GEMINI_API ?? '',
    baseUrl: () => env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-embedding-001',
    dims: 1024,
  },
}

const buildProvider = (env.EMBED_PROVIDER ?? env.AI_PROVIDER ?? 'openai').toLowerCase()

/** Cấu hình dùng khi dựng chỉ mục. */
export const buildModel = {
  provider: buildProvider,
  model: env.EMBED_MODEL ?? PROVIDERS[buildProvider]?.model,
  dims: Number(env.EMBED_DIMS ?? PROVIDERS[buildProvider]?.dims),
}

export const hasKey = (provider) => Boolean(PROVIDERS[provider]?.key())

function normalize(v) {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n) || 1
  return v.map((x) => x / n)
}

async function post(provider, url, headers, body) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (res.ok) return res.json()
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, (res.status === 429 ? 5000 : 1000) * attempt))
      continue
    }
    throw new Error(`embedding ${provider} ${res.status}: ${(await res.text()).slice(0, 250)}`)
  }
  throw new Error(`embedding ${provider}: hết lượt thử lại`)
}

/**
 * @param {string[]} texts
 * @param {{provider: string, model: string, dims: number}} spec
 * @param {{task?: 'document'|'query'}} opts  Gemini nhúng tài liệu và câu hỏi khác nhau
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts, { provider, model, dims }, { task = 'document' } = {}) {
  const p = PROVIDERS[provider]
  if (!p) throw new Error(`EMBED_PROVIDER không hỗ trợ: ${provider}`)
  const key = p.key()
  if (!key) throw new Error(`Chưa có API key cho embedding (${provider})`)
  if (!texts.length) return []

  if (provider === 'gemini') {
    const data = await post(
      provider,
      `${p.baseUrl()}/models/${model}:batchEmbedContents`,
      { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      {
        requests: texts.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          taskType: task === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
          outputDimensionality: dims,
        })),
      },
    )
    return data.embeddings.map((e) => normalize(e.values))
  }

  const data = await post(
    provider,
    `${p.baseUrl()}/embeddings`,
    { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    { model, input: texts, dimensions: dims },
  )
  return data.data.sort((a, b) => a.index - b.index).map((d) => normalize(d.embedding))
}
