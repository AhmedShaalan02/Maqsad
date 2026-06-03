// Downloads tafseer for all 114 surahs × 4 IDs
//   IDs 169, 168  →  api.quran.com  (tafseer endpoint, English)
//   IDs 74, 131   →  api.alquran.cloud  (edition endpoint, Arabic)
// Output: src/data/verses/{n}_{id}.json  →  { "1": "text", "2": "text", ... }
// Safe to re-run: skips files that already exist.

import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../src/data/verses')

const TAFSEER_CONFIG = [
  { id: 169, name: 'Ibn Kathir',         source: 'qurancom', qurancomId: 169 },
  { id: 74,  name: 'Jalalayn',           source: 'alquran',  edition: 'ar.jalalayn' },
  { id: 168, name: 'Maariful Quran',     source: 'qurancom', qurancomId: 168 },
  { id: 131, name: 'Al-Muyassar',        source: 'alquran',  edition: 'ar.muyassar' },
]

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: 'application/json' } }, res => {
        let raw = ''
        res.on('data', chunk => (raw += chunk))
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
          catch { reject(new Error(`parse fail HTTP ${res.statusCode}: ${raw.slice(0, 120)}`)) }
        })
      })
      .on('error', reject)
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// quran.com tafseer endpoint (with pagination)
async function fetchQuranCom(surahNum, qurancomId) {
  let all = []
  let page = 1
  while (true) {
    const url = `https://api.quran.com/api/v4/tafsirs/${qurancomId}/by_chapter/${surahNum}?per_page=300&page=${page}`
    const { status, body } = await fetchJSON(url)
    if (status !== 200) throw new Error(`HTTP ${status}`)
    const items = body.tafsirs || []
    all = all.concat(items)
    if (!body.pagination?.next_page) break
    page++
    await sleep(200)
  }
  if (!all.length) throw new Error('empty response')
  const map = {}
  for (const item of all) {
    const vNum = String(item.verse_key.split(':')[1])
    map[vNum] = item.text || ''
  }
  return map
}

// alquran.cloud edition endpoint
async function fetchAlQuran(surahNum, edition) {
  const url = `https://api.alquran.cloud/v1/surah/${surahNum}/editions/${edition}`
  const { status, body } = await fetchJSON(url)
  if (status !== 200) throw new Error(`HTTP ${status}`)
  const ayahs = Array.isArray(body.data) ? body.data[0]?.ayahs : body.data?.ayahs
  if (!ayahs?.length) throw new Error('empty ayahs')
  const map = {}
  for (const ayah of ayahs) {
    map[String(ayah.numberInSurah)] = ayah.text || ''
  }
  return map
}

async function main() {
  let ok = 0, fail = 0, skip = 0
  const failed = []

  for (const cfg of TAFSEER_CONFIG) {
    console.log(`\n── ${cfg.name} (ID ${cfg.id}, ${cfg.source}) ──`)
    for (let n = 1; n <= 114; n++) {
      const outFile = path.join(OUT_DIR, `${n}_${cfg.id}.json`)
      if (fs.existsSync(outFile)) { skip++; continue }

      process.stdout.write(`  [${String(n).padStart(3)}/114]...`)
      try {
        const map = cfg.source === 'qurancom'
          ? await fetchQuranCom(n, cfg.qurancomId)
          : await fetchAlQuran(n, cfg.edition)
        fs.writeFileSync(outFile, JSON.stringify(map))
        console.log(` ✓  ${Object.keys(map).length} verses`)
        ok++
      } catch (err) {
        console.log(` ✗  ${err.message}`)
        failed.push(`${n}_${cfg.id}`)
        fail++
      }

      await sleep(250)
    }
  }

  console.log(`\nDone — ${ok} saved, ${skip} skipped, ${fail} failed.`)
  if (failed.length) console.log('Failed:', failed.join(', '))
  if (fail > 0) process.exit(1)
}

main()
