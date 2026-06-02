// Fetches Arabic (quran-uthmani), transliteration (en.transliteration), and
// English (en.sahih) in one request per surah from api.alquran.cloud.
// Output shape: { verses: [{ id, verse_number, verse_key, text_uthmani, transliteration, translations: [{text}] }] }

import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../src/data/verses')

fs.mkdirSync(OUT_DIR, { recursive: true })

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: 'application/json' } }, res => {
        let raw = ''
        res.on('data', chunk => (raw += chunk))
        res.on('end', () => {
          try { resolve(JSON.parse(raw)) }
          catch { reject(new Error(`JSON parse failed (HTTP ${res.statusCode})`)) }
        })
      })
      .on('error', reject)
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  let ok = 0, fail = 0

  for (let n = 1; n <= 114; n++) {
    const url = `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.transliteration,en.sahih`
    process.stdout.write(`[${String(n).padStart(3, ' ')}/114] Surah ${n}...`)

    try {
      const { data } = await fetchJSON(url)
      const arabicAyahs  = data[0].ayahs
      const translitAyahs = data[1].ayahs
      const englishAyahs  = data[2].ayahs

      if (!arabicAyahs?.length) throw new Error('empty ayahs array')

      const verses = arabicAyahs.map((ayah, i) => ({
        id: ayah.number,
        verse_number: ayah.numberInSurah,
        verse_key: `${n}:${ayah.numberInSurah}`,
        text_uthmani: ayah.text,
        transliteration: translitAyahs[i].text,
        translations: [{ text: englishAyahs[i].text }],
      }))

      fs.writeFileSync(path.join(OUT_DIR, `${n}.json`), JSON.stringify({ verses }))
      console.log(` ✓  ${verses.length} verses`)
      ok++
    } catch (err) {
      console.log(` ✗  ${err.message}`)
      fail++
    }

    if (n < 114) await sleep(120)
  }

  console.log(`\nFinished: ${ok} saved, ${fail} failed.`)
  if (fail > 0) process.exit(1)
}

main()
