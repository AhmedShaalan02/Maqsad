// Downloads tafseer for all 114 surahs × 4 IDs from api.quran.com
// Output: src/data/verses/{n}_{id}.json  →  { "1": "text", "2": "text", ... }
// Safe to re-run: skips files that already exist.

import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../src/data/verses')

const TAFSEER_IDS = [169, 16, 168, 91]
const NAMES = { 169: 'Ibn Kathir', 16: 'Al-Muyassar', 168: "Ma'arif al-Qur'an", 91: "Al-Sa'di" }

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

async function fetchAllTafseer(surahNum, id) {
  let all = []
  let page = 1
  while (true) {
    const url = `https://api.quran.com/api/v4/tafsirs/${id}/by_chapter/${surahNum}?per_page=300&page=${page}`
    const { status, body } = await fetchJSON(url)
    if (status !== 200) throw new Error(`HTTP ${status}`)
    const items = body.tafsirs || []
    all = all.concat(items)
    if (!body.pagination?.next_page) break
    page++
    await sleep(200)
  }
  return all
}

async function main() {
  let ok = 0, fail = 0, skip = 0
  const failed = []

  for (const id of TAFSEER_IDS) {
    console.log(`\n── ${NAMES[id]} (ID ${id}) ──`)
    for (let n = 1; n <= 114; n++) {
      const outFile = path.join(OUT_DIR, `${n}_${id}.json`)
      if (fs.existsSync(outFile)) { skip++; continue }

      process.stdout.write(`  [${String(n).padStart(3)}/114]...`)
      try {
        const items = await fetchAllTafseer(n, id)
        if (!items.length) throw new Error('empty response')

        const map = {}
        for (const item of items) {
          const vNum = String(item.verse_key.split(':')[1])
          map[vNum] = item.text || ''
        }

        fs.writeFileSync(outFile, JSON.stringify(map))
        console.log(` ✓  ${items.length} verses`)
        ok++
      } catch (err) {
        console.log(` ✗  ${err.message}`)
        failed.push(`${n}_${id}`)
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
