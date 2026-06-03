import surahData from '../data/surahs.json'

const chapters = surahData.chapters

// ── Daily Themes ─────────────────────────────────────────────────────────────

export function saveDailyTheme(dateKey, themeData) {
  try {
    localStorage.setItem(`maqsad_daily_${dateKey}`, JSON.stringify({ ...themeData, savedAt: dateKey }))
  } catch {}
}

export function getDailyTheme(dateKey) {
  try {
    const s = localStorage.getItem(`maqsad_daily_${dateKey}`)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function getAllDailyThemes() {
  const themes = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('maqsad_daily_')) {
        const d = JSON.parse(localStorage.getItem(key))
        themes.push({ dateKey: key.slice('maqsad_daily_'.length), ...d })
      }
    }
  } catch {}
  return themes.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}

export function deleteDailyTheme(dateKey) {
  try { localStorage.removeItem(`maqsad_daily_${dateKey}`) } catch {}
}

// ── Quran Highlights / Notes ──────────────────────────────────────────────────

export function getSavedQuranVerses() {
  const verses = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('maqsad_v1_')) continue
      const d = JSON.parse(localStorage.getItem(key))
      if (!d?.highlighted && !d?.note) continue
      const parts = key.split('_')               // maqsad_v1_{surah}_{verse}
      const surahNum = parseInt(parts[2])
      const verseNum = parseInt(parts[3])
      if (!surahNum || !verseNum) continue
      const surah = chapters.find(c => c.id === surahNum)
      verses.push({
        key, surahNum, verseNum,
        surahName: surah?.name_simple || `Surah ${surahNum}`,
        highlighted: d.highlighted || false,
        note: d.note || '',
      })
    }
  } catch {}
  return verses.sort((a, b) => a.surahNum - b.surahNum || a.verseNum - b.verseNum)
}

export function deleteQuranVerse(key) {
  try { localStorage.removeItem(key) } catch {}
}

// ── Hadith Collections ────────────────────────────────────────────────────────

function loadHadithCols() {
  try {
    const s = localStorage.getItem('maqsad_hadith_cols_v1')
    return s ? JSON.parse(s) : { collections: [], items: [] }
  } catch { return { collections: [], items: [] } }
}

export function getSavedHadiths() {
  const { collections, items } = loadHadithCols()
  return items.map(item => ({
    ...item,
    collectionName: collections.find(c => c.id === item.collectionId)?.name || item.collectionId,
  }))
}

export function deleteSavedHadith(hadithId, collectionId) {
  try {
    const state = loadHadithCols()
    state.items = state.items.filter(i => !(i.hadithId === hadithId && i.collectionId === collectionId))
    localStorage.setItem('maqsad_hadith_cols_v1', JSON.stringify(state))
  } catch {}
}

// ── Reflections (from daily theme Question cards) ─────────────────────────────

export function saveReflection(dateKey, text) {
  try {
    const theme = getDailyTheme(dateKey)
    if (theme) saveDailyTheme(dateKey, { ...theme, reflection: text })
  } catch {}
}

// ── Counts (for badge display) ────────────────────────────────────────────────

export function getLibraryCounts() {
  return {
    dailyThemes:   getAllDailyThemes().length,
    quranVerses:   getSavedQuranVerses().length,
    hadiths:       getSavedHadiths().length,
    seerah:        0,
    fiqh:          0,
    islamicStudies: 0,
    sual:          0,
  }
}
