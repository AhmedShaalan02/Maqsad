import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const quranApiPlugin = {
  name: 'quran-api-proxy',
  configureServer(server) {
    server.middlewares.use('/api/quran', (req, res) => {
      const p = req.url ?? '/'
      https
        .get({ hostname: 'api.quran.com', path: p, headers: { Accept: 'application/json' } }, upstream => {
          res.writeHead(upstream.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          upstream.pipe(res)
        })
        .on('error', err => { res.writeHead(502); res.end(JSON.stringify({ error: err.message })) })
    })
  },
}

const sunnahApiPlugin = {
  name: 'sunnah-api-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sunnah', (req, res) => {
      const p = req.url ?? '/'
      https
        .get(
          { hostname: 'api.sunnah.com', path: p, headers: { Accept: 'application/json', 'x-api-key': 'SqD712P3E82xnwOAEOkGd5JZH8s9wRR24TqNFzjk' } },
          upstream => {
            res.writeHead(upstream.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
            upstream.pipe(res)
          }
        )
        .on('error', err => { res.writeHead(502); res.end(JSON.stringify({ error: err.message })) })
    })
  },
}

// ── Anthropic API proxy (keeps key server-side) ───────────────────────────────
const anthropicPlugin = {
  name: 'anthropic-proxy',
  configureServer(server) {
    server.middlewares.use('/api/claude', (req, res) => {
      if (req.method === 'OPTIONS') {
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
        return res.end()
      }
      if (req.method !== 'POST') { res.writeHead(405); return res.end() }

      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY environment variable not set' }))
      }

      let body = ''
      req.on('data', c => (body += c))
      req.on('end', () => {
        const pr = https.request(
          {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': apiKey },
          },
          upstream => {
            res.writeHead(upstream.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
            upstream.pipe(res)
          }
        )
        pr.on('error', err => { res.writeHead(502); res.end(JSON.stringify({ error: err.message })) })
        pr.write(body)
        pr.end()
      })
    })
  },
}

// ── Local hadith lookup + full-text search (reads downloaded JSON files) ──────
const hadithLocalPlugin = {
  name: 'hadith-local',
  configureServer(server) {
    const HADITH_DIR = path.join(__dirname, 'src/data/hadith')
    const cache = {}   // collection → hadiths array (in-memory after first load)

    const loadCollection = col => {
      if (cache[col]) return cache[col]
      const fp = path.join(HADITH_DIR, `${col}.json`)
      if (!fs.existsSync(fp)) return null
      const hadiths = JSON.parse(fs.readFileSync(fp, 'utf8')).hadiths
      cache[col] = hadiths
      return hadiths
    }

    // Single hadith lookup: GET /api/hadith-lookup?collection=bukhari&number=8
    server.middlewares.use('/api/hadith-lookup', (req, res) => {
      const u = new URL(req.url, 'http://localhost')
      const col = u.searchParams.get('collection')
      const num = u.searchParams.get('number')
      if (!col || !num) { res.writeHead(400); return res.end(JSON.stringify({ error: 'Missing params' })) }

      const hadiths = loadCollection(col)
      if (!hadiths) { res.writeHead(404); return res.end(JSON.stringify({ error: 'Collection file not found' })) }

      const h = hadiths.find(h => h.hadithNumber === num || h.hadithNumber === String(num))
      res.writeHead(h ? 200 : 404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      res.end(JSON.stringify(h || { error: 'Hadith not found' }))
    })

    // Full-text search: GET /api/hadith-search?q=prayer&limit=8
    server.middlewares.use('/api/hadith-search', (req, res) => {
      const u = new URL(req.url, 'http://localhost')
      const q = (u.searchParams.get('q') || '').toLowerCase().trim()
      const limit = Math.min(parseInt(u.searchParams.get('limit') || '8'), 20)

      if (q.length < 2) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        return res.end('[]')
      }

      const results = []
      for (const col of ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'ibnmajah', 'nasai']) {
        if (results.length >= limit) break
        const hadiths = loadCollection(col)
        if (!hadiths) continue
        for (const h of hadiths) {
          if (results.length >= limit) break
          if (h.text?.toLowerCase().includes(q) || (h.narrator || '').toLowerCase().includes(q)) {
            results.push({ id: h.id, collection: h.collection, bookNumber: h.bookNumber,
              hadithNumber: h.hadithNumber, narrator: h.narrator, text: h.text,
              grade: h.grade, reference: h.reference, sourceUrl: h.sourceUrl })
          }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      res.end(JSON.stringify(results))
    })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), quranApiPlugin, sunnahApiPlugin, anthropicPlugin, hadithLocalPlugin],
})
