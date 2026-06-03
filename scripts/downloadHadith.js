// Downloads all hadith from 6 major collections via api.sunnah.com.
//
// The paginated collection endpoint (/hadiths?limit=N) requires a higher
// API tier on this key. We use the book-level endpoint which works on
// the standard tier: /collections/{id}/books/{bookNum}/hadiths
//
// Output: src/data/hadith/{collection}.json per collection

import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const API_KEY = 'SqD712P3E82xnwOAEOkGd5JZH8s9wRR24TqNFzjk'
const BASE    = 'api.sunnah.com'
const LIMIT   = 100    // hadiths per page
const DELAY   = 180    // ms between requests — stays under rate limit

const COLLECTIONS = [
  { id: 'bukhari',  name: 'Sahih Bukhari',        expected: 7291 },
  { id: 'muslim',   name: 'Sahih Muslim',           expected: 7470 },
  { id: 'tirmidhi', name: "Jami' at-Tirmidhi",      expected: 3956 },
  { id: 'abudawud', name: 'Sunan Abu Dawud',         expected: 5274 },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah',         expected: 4341 },
  { id: 'nasai',    name: "Sunan an-Nasa'i",         expected: 5761 },
]

const OUT_DIR = path.join(__dirname, '../src/data/hadith')
fs.mkdirSync(OUT_DIR, { recursive: true })

// ── HTTP ──────────────────────────────────────────────────────────────────────

function fetchJSON(urlPath) {
  return new Promise((resolve, reject) => {
    https
      .get(
        { hostname: BASE, path: urlPath, headers: { Accept: 'application/json', 'x-api-key': API_KEY } },
        res => {
          let body = ''
          res.on('data', c => (body += c))
          res.on('end', () => {
            if (res.statusCode !== 200) {
              return reject(new Error(`HTTP ${res.statusCode} — ${body.slice(0, 120)}`))
            }
            try { resolve(JSON.parse(body)) }
            catch (e) { reject(new Error(`JSON parse failed: ${e.message}`)) }
          })
        }
      )
      .on('error', reject)
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function retry(fn, attempts = 4, baseDelay = 400) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn() }
    catch (e) {
      if (i === attempts - 1) throw e
      const wait = baseDelay * 2 ** i
      process.stdout.write(` [retry ${i + 1} in ${wait}ms]`)
      await sleep(wait)
    }
  }
}

// ── Parsing ───────────────────────────────────────────────────────────────────

function clean(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const COLL_LABELS = {
  bukhari: 'Bukhari', muslim: 'Muslim', tirmidhi: 'Tirmidhi',
  abudawud: 'Abu Dawud', ibnmajah: 'Ibn Majah', nasai: "Nasa'i",
}

function parseHadith(raw) {
  const en = raw.hadith?.find(h => h.lang === 'en')
  const ar = raw.hadith?.find(h => h.lang === 'ar')
  if (!en) return null

  const body = clean(en.body)
  const m1 = body.match(/^Narrated\s+(.+?):\s*(.+)$/s)
  const m2 = !m1 && body.match(/^It was narrated (?:from|that)\s+(.+?):\s*(.+)$/s)
  const m  = m1 || m2

  const narrator = m?.[1]?.trim() ?? null
  const text     = m?.[2]?.trim() ?? body
  if (!text || text.length < 10) return null

  const label = COLL_LABELS[raw.collection] ?? raw.collection
  return {
    id:           `${raw.collection}_${raw.hadithNumber}`,
    collection:   raw.collection,
    bookNumber:   raw.bookNumber,
    hadithNumber: raw.hadithNumber,
    chapterTitle: en.chapterTitle || '',
    narrator,
    text,
    arabicText:   ar ? clean(ar.body) : null,
    grade:        en.grades?.[0]?.grade ?? null,
    reference:    `${label} ${raw.bookNumber}:${raw.hadithNumber}`,
    sourceUrl:    `https://sunnah.com/${raw.collection}:${raw.hadithNumber}`,
  }
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchAllBooks(colId) {
  const books = []
  for (let page = 1; ; page++) {
    const json = await retry(() => fetchJSON(`/v1/collections/${colId}/books?limit=100&page=${page}`))
    books.push(...(json.data ?? []))
    if (!json.next) break
    await sleep(DELAY)
  }
  return books
}

async function fetchBookHadiths(colId, bookNum) {
  const hadiths = []
  for (let page = 1; ; page++) {
    const json = await retry(() =>
      fetchJSON(`/v1/collections/${colId}/books/${bookNum}/hadiths?limit=${LIMIT}&page=${page}`)
    )
    const raw = Array.isArray(json.data) ? json.data : (json.hadiths ?? [])
    hadiths.push(...raw.map(parseHadith).filter(Boolean))
    if (!json.next || raw.length === 0) break
    await sleep(DELAY)
  }
  return hadiths
}

// ── Collection downloader ─────────────────────────────────────────────────────

async function downloadCollection(col) {
  const outFile = path.join(OUT_DIR, `${col.id}.json`)

  // Resume: skip if file already complete
  if (fs.existsSync(outFile)) {
    const saved = JSON.parse(fs.readFileSync(outFile, 'utf8'))
    if (saved.complete && saved.hadiths?.length > 0) {
      console.log(`  ⏭   ${col.name.padEnd(26)} — already saved (${saved.hadiths.length.toLocaleString()} hadiths)`)
      return saved
    }
  }

  console.log(`\n${'─'.repeat(56)}`)
  console.log(`📖  ${col.name}  (expected ~${col.expected.toLocaleString()})`)
  console.log(`${'─'.repeat(56)}`)

  // 1. Get book list
  process.stdout.write('  Fetching book list... ')
  const books = await fetchAllBooks(col.id)
  console.log(`${books.length} books`)

  // 2. Download each book
  const allHadiths = []
  const totalBooks  = books.length

  for (let b = 0; b < totalBooks; b++) {
    const book     = books[b]
    const bookName = book.book?.find(x => x.lang === 'en')?.name ?? `Book ${book.bookNumber}`
    const prefix   = `  [${String(b + 1).padStart(2)}/${totalBooks}]`
    const label    = bookName.slice(0, 36).padEnd(36)

    process.stdout.write(`${prefix} ${label} `)

    let count = 0
    try {
      const hadiths = await fetchBookHadiths(col.id, book.bookNumber)
      allHadiths.push(...hadiths)
      count = hadiths.length
      console.log(`${String(count).padStart(4)} hadiths  (running total: ${allHadiths.length.toLocaleString()})`)
    } catch (e) {
      console.log(`  ✗ FAILED — ${e.message}`)
    }

    if (b < totalBooks - 1) await sleep(DELAY)
  }

  // 3. Save
  const output = {
    collection: col.id,
    name:       col.name,
    total:      allHadiths.length,
    complete:   true,
    hadiths:    allHadiths,
  }
  fs.writeFileSync(outFile, JSON.stringify(output))

  const size = (fs.statSync(outFile).size / 1024 / 1024).toFixed(1)
  console.log(`\n  ✅  ${allHadiths.length.toLocaleString()} hadiths saved → ${path.relative(process.cwd(), outFile)} (${size} MB)`)
  return output
}

// ── Main ──────────────────────────────────────────────────────────────────────

const pad = (n, w) => String(n).padStart(w)

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║     🕌  Maqsad — Hadith Collection Downloader        ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`Output → ${path.relative(process.cwd(), OUT_DIR)}/\n`)

  const t0          = Date.now()
  let grandTotal    = 0
  const summary     = []

  for (const col of COLLECTIONS) {
    const result = await downloadCollection(col)
    grandTotal += result.total ?? 0
    summary.push({ name: col.name, count: result.total ?? 0 })
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║  Summary                                             ║')
  console.log('╠══════════════════════════════════════════════════════╣')
  for (const { name, count } of summary) {
    console.log(`║  ${name.padEnd(28)} ${pad(count.toLocaleString(), 7)} hadiths  ║`)
  }
  console.log('╠══════════════════════════════════════════════════════╣')
  console.log(`║  Total  ${''.padEnd(22)} ${pad(grandTotal.toLocaleString(), 7)} hadiths  ║`)
  console.log(`║  Time   ${''.padEnd(22)} ${pad(elapsed + 's', 9)}          ║`)
  console.log('╚══════════════════════════════════════════════════════╝')
}

main().catch(e => { console.error('\n💥 Fatal:', e.message); process.exit(1) })
