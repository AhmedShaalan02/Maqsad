import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ModuleCard from '../components/ModuleCard'
import SupportStrip from '../components/SupportStrip'
import Highlight from '../components/Highlight'
import { modules } from '../modules/moduleData'
import surahData from '../data/surahs.json'
import { COLLECTIONS, TOPICS } from '../data/hadithData'
import { getCollections, getItemsInCollection } from '../utils/hadithStorage'

const chapters = surahData.chapters

// ── Search icons ──────────────────────────────────────────────────────────────

const SearchIco = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ── Result group header ───────────────────────────────────────────────────────

function GroupHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 px-1 mt-4 mb-2">
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(28,20,16,0.38)' }}>
        {label}
      </span>
      <span
        className="text-xs font-bold px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}
      >
        {count}
      </span>
    </div>
  )
}

// ── Quran result row ──────────────────────────────────────────────────────────

function QuranResult({ surah, query, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: '#FFFCF7',
        boxShadow: '0 1px 8px rgba(28,20,16,0.07)',
        border: '1px solid rgba(107,31,42,0.08)',
      }}
    >
      {/* Number badge */}
      <div
        className="flex-shrink-0 w-9 h-7 rounded-lg flex items-center justify-center font-bold"
        style={{
          fontSize: surah.id >= 100 ? '9px' : '11px',
          backgroundColor: 'rgba(107,31,42,0.1)',
          color: '#6B1F2A',
        }}
      >
        {surah.id}
      </div>

      {/* Names */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug" style={{ color: '#1C1410' }}>
          <Highlight text={surah.name_simple} query={query} />
          {surah.translated_name?.name && (
            <span className="font-normal ml-1.5" style={{ color: 'rgba(28,20,16,0.45)', fontSize: '12px' }}>
              · <Highlight text={surah.translated_name.name} query={query} />
            </span>
          )}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.4)' }}>
          {surah.verses_count} ayaat
        </p>
      </div>

      {/* Arabic */}
      <p className="text-base flex-shrink-0" style={{ fontFamily: 'Georgia, serif', color: '#C4973A' }}>
        <Highlight text={surah.name_arabic} query={query} />
      </p>
    </button>
  )
}

// ── Hadith result row ─────────────────────────────────────────────────────────

function HadithResult({ item, query, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: '#FFFCF7',
        boxShadow: '0 1px 8px rgba(28,20,16,0.07)',
        border: '1px solid rgba(196,151,58,0.12)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug" style={{ color: '#1C1410' }}>
          <Highlight text={item.name} query={query} />
        </p>
        {subtitle && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(28,20,16,0.4)' }}>
            <Highlight text={subtitle} query={query} />
          </p>
        )}
      </div>
      <p className="text-sm flex-shrink-0" style={{ fontFamily: 'Georgia, serif', color: '#C4973A' }}>
        {item.arabicName}
      </p>
    </button>
  )
}

// ── Saved hadith result row ───────────────────────────────────────────────────

function SavedResult({ hadith, query, collectionName, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: '#FFFCF7',
        boxShadow: '0 1px 8px rgba(28,20,16,0.07)',
        border: '1px solid rgba(28,20,16,0.07)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(107,31,42,0.08)', color: '#6B1F2A' }}>
          {collectionName}
        </span>
        <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.32)' }}>{hadith.reference}</span>
      </div>
      <p className="text-sm leading-snug mt-1" style={{ color: '#1C1410' }}>
        <Highlight text={hadith.text?.slice(0, 90) + (hadith.text?.length > 90 ? '…' : '')} query={query} />
      </p>
      {hadith.narrator && (
        <p className="text-xs" style={{ color: 'rgba(28,20,16,0.42)', fontStyle: 'italic' }}>
          — <Highlight text={hadith.narrator} query={query} />
        </p>
      )}
    </button>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(107,31,42,0.08)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <p className="font-semibold text-sm mb-1" style={{ color: '#1C1410' }}>
        No results for "{query}"
      </p>
      <p className="text-xs" style={{ color: 'rgba(28,20,16,0.45)' }}>
        Try searching a surah name, topic, or narrator
      </p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  // Build search results from all local data
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null

    // Quran surahs
    const quranSurahs = chapters
      .filter(s =>
        s.name_simple.toLowerCase().includes(q) ||
        s.name_arabic.includes(query.trim()) ||
        s.translated_name?.name.toLowerCase().includes(q) ||
        s.name_complex?.toLowerCase().includes(q)
      )
      .slice(0, 6)

    // Hadith topics
    const hadithTopics = TOPICS
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.arabicName.includes(query.trim()) ||
        t.description.toLowerCase().includes(q)
      )
      .slice(0, 4)

    // Hadith collections
    const hadithCollections = COLLECTIONS
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.arabicName.includes(query.trim()) ||
        c.author.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      )
      .slice(0, 3)

    // Saved hadiths from My Collections
    const allCollections = getCollections()
    const savedItems = allCollections.flatMap(col => {
      const items = getItemsInCollection(col.id)
      return items
        .filter(i => {
          const h = i.hadith
          return (
            h?.text?.toLowerCase().includes(q) ||
            (h?.narrator || '').toLowerCase().includes(q)
          )
        })
        .map(i => ({ ...i, collectionName: col.name }))
    })
    const savedHadiths = savedItems.slice(0, 4)

    return { quranSurahs, hadithTopics, hadithCollections, savedHadiths }
  }, [query])

  const totalResults = results
    ? results.quranSurahs.length + results.hadithTopics.length + results.hadithCollections.length + results.savedHadiths.length
    : 0

  const isSearching = query.trim().length > 0

  const goToSurah = surah => {
    navigate('/quran', { state: { preselectSurah: surah } })
  }

  const goToTopic = topic => {
    navigate('/hadith/browse', {
      state: {
        type: 'topic',
        id: topic.id,
        name: topic.name,
        arabicName: topic.arabicName,
        collection: topic.collection,
        book: topic.book,
      },
    })
  }

  const goToCollection = collection => {
    navigate('/hadith/browse', {
      state: {
        type: 'collection',
        id: collection.id,
        name: collection.name,
        arabicName: collection.arabicName,
      },
    })
  }

  const goToSavedHadith = item => {
    navigate('/hadith', { state: { openSaved: true } })
  }

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>
      <Header />

      {/* ── Search Bar ── */}
      <div className="px-4 pt-4 pb-1">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
          style={{
            backgroundColor: isSearching ? '#FFFCF7' : 'rgba(28,20,16,0.06)',
            border: isSearching ? '1.5px solid rgba(107,31,42,0.22)' : '1.5px solid transparent',
            boxShadow: isSearching ? '0 2px 12px rgba(28,20,16,0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ color: isSearching ? '#6B1F2A' : 'rgba(28,20,16,0.38)', flexShrink: 0 }}>
            <SearchIco />
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search surahs, hadiths, topics…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#1C1410' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: 'rgba(28,20,16,0.35)', flexShrink: 0 }}
              aria-label="Clear search"
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── Module grid or Search results ── */}
      {isSearching ? (
        /* Results panel */
        <div className="px-4 pb-6">
          {totalResults === 0 ? (
            <EmptyState query={query.trim()} />
          ) : (
            <div className="flex flex-col gap-2">

              {/* Quran surahs */}
              {results.quranSurahs.length > 0 && (
                <>
                  <GroupHeader label="Quran" count={results.quranSurahs.length} />
                  {results.quranSurahs.map(s => (
                    <QuranResult
                      key={s.id}
                      surah={s}
                      query={query.trim()}
                      onClick={() => goToSurah(s)}
                    />
                  ))}
                </>
              )}

              {/* Hadith topics */}
              {results.hadithTopics.length > 0 && (
                <>
                  <GroupHeader label="Hadith Topics" count={results.hadithTopics.length} />
                  {results.hadithTopics.map(t => (
                    <HadithResult
                      key={t.id}
                      item={t}
                      query={query.trim()}
                      subtitle={t.description}
                      onClick={() => goToTopic(t)}
                    />
                  ))}
                </>
              )}

              {/* Hadith collections */}
              {results.hadithCollections.length > 0 && (
                <>
                  <GroupHeader label="Hadith Collections" count={results.hadithCollections.length} />
                  {results.hadithCollections.map(c => (
                    <HadithResult
                      key={c.id}
                      item={c}
                      query={query.trim()}
                      subtitle={c.author}
                      onClick={() => goToCollection(c)}
                    />
                  ))}
                </>
              )}

              {/* Saved hadiths */}
              {results.savedHadiths.length > 0 && (
                <>
                  <GroupHeader label="My Collections" count={results.savedHadiths.length} />
                  {results.savedHadiths.map((item, i) => (
                    <SavedResult
                      key={i}
                      hadith={item.hadith}
                      query={query.trim()}
                      collectionName={item.collectionName}
                      onClick={() => goToSavedHadith(item)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Normal module grid */
        <main className="px-4 pt-3 pb-2">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'rgba(28, 20, 16, 0.35)', letterSpacing: '0.16em' }}
          >
            Modules
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {modules.map(mod => (
              <ModuleCard
                key={mod.id}
                {...mod}
                onClick={mod.path ? () => navigate(mod.path) : undefined}
              />
            ))}
          </div>
        </main>
      )}

      <SupportStrip />
    </div>
  )
}
