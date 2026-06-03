import { COLLECTION_LABELS } from '../data/hadithData'

const hadithModules = import.meta.glob('../data/hadith/*.json')
const cache = new Map()

export async function loadCollection(id) {
  if (cache.has(id)) return cache.get(id)
  const key = `../data/hadith/${id}.json`
  if (!hadithModules[key]) return null
  const mod = await hadithModules[key]()
  const label = COLLECTION_LABELS[id] || id
  const hadiths = mod.default.hadiths.map(h => ({ ...h, collectionLabel: label }))
  cache.set(id, hadiths)
  return hadiths
}
