const KEY = 'maqsad_hadith_cols_v1'

const DEFAULTS = [
  { id: 'favorites',   name: 'Favorites',   icon: '★' },
  { id: 'share-later', name: 'Share Later',  icon: '↗' },
]

function load() {
  try {
    const s = localStorage.getItem(KEY)
    return s ? JSON.parse(s) : { collections: DEFAULTS, items: [] }
  } catch {
    return { collections: DEFAULTS, items: [] }
  }
}

function persist(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

export function getCollections() {
  return load().collections
}

export function getItemsInCollection(colId) {
  return load().items.filter(i => i.collectionId === colId)
}

export function getCollectionCount(colId) {
  return load().items.filter(i => i.collectionId === colId).length
}

export function isInAnyCollection(hadithId) {
  return load().items.some(i => i.hadithId === hadithId)
}

export function isInCollection(hadithId, colId) {
  return load().items.some(i => i.hadithId === hadithId && i.collectionId === colId)
}

export function toggleInCollection(hadith, colId) {
  const state = load()
  const exists = state.items.some(i => i.hadithId === hadith.id && i.collectionId === colId)
  if (exists) {
    state.items = state.items.filter(i => !(i.hadithId === hadith.id && i.collectionId === colId))
  } else {
    state.items.push({ hadithId: hadith.id, collectionId: colId, savedAt: Date.now(), hadith })
  }
  persist(state)
  return !exists
}

export function createCollection(name) {
  const state = load()
  const id = `col_${Date.now()}`
  state.collections.push({ id, name, icon: '◉' })
  persist(state)
  return id
}

export function deleteCollection(colId) {
  const state = load()
  state.collections = state.collections.filter(c => c.id !== colId)
  state.items = state.items.filter(i => i.collectionId !== colId)
  persist(state)
}
