import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ModuleCard from '../components/ModuleCard'
import SupportStrip from '../components/SupportStrip'
import Highlight from '../components/Highlight'
import DailyThemeSection from '../components/DailyThemeSection'
import { modules } from '../modules/moduleData'
import surahData from '../data/surahs.json'
import { COLLECTIONS, TOPICS } from '../data/hadithData'
import { getCollections, getItemsInCollection } from '../utils/hadithStorage'
import { getHijriDate, formatGregorian } from '../utils/hijriUtils'
import { getIslamicSignificance } from '../data/islamicDates'
import { requestLocation, calcPrayerTimes, getNextPrayer, formatCountdown } from '../utils/prayerUtils'
import { getLibraryCounts } from '../utils/myMaqsadStorage'

const chapters = surahData.chapters

const BADGE_COLORS = {
  special: { bg: 'rgba(196,151,58,0.18)', color: '#9A7020' },
  eid:     { bg: 'rgba(74,103,65,0.15)',  color: '#2D6A4F' },
  ramadan: { bg: 'rgba(107,31,42,0.12)',  color: '#6B1F2A' },
  fast:    { bg: 'rgba(28,20,16,0.07)',   color: 'rgba(28,20,16,0.6)' },
  month:   { bg: 'rgba(196,151,58,0.10)', color: '#C4973A' },
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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
const ChevRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

// ── Daily Header ──────────────────────────────────────────────────────────────

function DailyHeader() {
  const today      = new Date()
  const hijri      = getHijriDate(today)
  const significance = hijri ? getIslamicSignificance(hijri.month, hijri.day, today.getDay()) : []

  const [prayerInfo, setPrayerInfo] = useState(null)
  const [countdown,  setCountdown]  = useState(null)
  const [locError,   setLocError]   = useState(false)

  useEffect(() => {
    requestLocation()
      .then(({ lat, lng }) => {
        const pt   = calcPrayerTimes(lat, lng)
        const next = getNextPrayer(pt)
        setPrayerInfo(next)
        if (next?.time) setCountdown(formatCountdown(next.time))
      })
      .catch(() => setLocError(true))
  }, [])

  useEffect(() => {
    if (!prayerInfo?.time) return
    const id = setInterval(() => setCountdown(formatCountdown(prayerInfo.time)), 60_000)
    return () => clearInterval(id)
  }, [prayerInfo])

  return (
    <div className="px-5 pt-4 pb-5"
      style={{ background: 'linear-gradient(180deg, #5C1822 0%, #6B1F2A 100%)' }}>
      {hijri && (
        <>
          <h1 className="text-2xl font-bold text-center tracking-wide"
            style={{ color: '#FAF7F2', fontFamily: 'Georgia, serif' }}>
            {hijri.day} {hijri.monthName} {hijri.year}
          </h1>
          <p className="text-center text-sm mt-0.5" style={{ color: 'rgba(250,247,242,0.6)' }}>
            {formatGregorian(today)}
          </p>
        </>
      )}

      {significance.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {significance.slice(0, 2).map((sig, i) => {
            const s = BADGE_COLORS[sig.type] ?? BADGE_COLORS.month
            return (
              <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: s.bg, color: s.color }}>
                {sig.name}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex justify-center mt-3">
        {prayerInfo && countdown ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" stroke="#C4973A" />
              <polyline points="12 6 12 12 16 14" stroke="#C4973A" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: '#FAF7F2' }}>
              Next: {prayerInfo.name} in {countdown}
            </span>
          </div>
        ) : locError ? (
          <span className="text-xs" style={{ color: 'rgba(250,247,242,0.4)' }}>
            Enable location for prayer times
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'rgba(250,247,242,0.3)' }}>
            Calculating prayer times…
          </span>
        )}
      </div>
    </div>
  )
}

// ── Search result components ──────────────────────────────────────────────────

function GroupHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 px-1 mt-4 mb-2">
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(28,20,16,0.38)' }}>{label}</span>
      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>{count}</span>
    </div>
  )
}

function QuranResult({ surah, query, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left active:scale-[0.98]"
      style={{ backgroundColor: '#FFFCF7', boxShadow: '0 1px 8px rgba(28,20,16,0.07)', border: '1px solid rgba(107,31,42,0.08)' }}>
      <div className="flex-shrink-0 w-9 h-7 rounded-lg flex items-center justify-center font-bold"
        style={{ fontSize: surah.id >= 100 ? '9px' : '11px', backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>
        {surah.id}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: '#1C1410' }}>
          <Highlight text={surah.name_simple} query={query} />
          <span className="font-normal ml-1.5" style={{ color: 'rgba(28,20,16,0.45)', fontSize: '12px' }}>
            · <Highlight text={surah.translated_name?.name} query={query} />
          </span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.4)' }}>{surah.verses_count} ayaat</p>
      </div>
      <p className="text-base flex-shrink-0" style={{ fontFamily: 'Georgia, serif', color: '#C4973A' }}>
        <Highlight text={surah.name_arabic} query={query} />
      </p>
    </button>
  )
}

function HadithResult({ item, query, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left active:scale-[0.98]"
      style={{ backgroundColor: '#FFFCF7', boxShadow: '0 1px 8px rgba(28,20,16,0.07)', border: '1px solid rgba(196,151,58,0.12)' }}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: '#1C1410' }}>
          <Highlight text={item.name || item.text} query={query} />
        </p>
        {subtitle && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(28,20,16,0.4)' }}>
            <Highlight text={subtitle} query={query} />
          </p>
        )}
      </div>
      {item.arabicName && (
        <p className="text-sm flex-shrink-0" style={{ fontFamily: 'Georgia, serif', color: '#C4973A' }}>{item.arabicName}</p>
      )}
      {item.reference && (
        <p className="text-xs flex-shrink-0 font-mono" style={{ color: 'rgba(28,20,16,0.32)' }}>{item.reference}</p>
      )}
    </button>
  )
}

function EmptySearchState({ query }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(107,31,42,0.08)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <p className="font-semibold text-sm mb-1" style={{ color: '#1C1410' }}>No results for "{query}"</p>
      <p className="text-xs" style={{ color: 'rgba(28,20,16,0.45)' }}>Try a surah name, narrator, or hadith topic</p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const [query,         setQuery]         = useState('')
  const [hadithResults, setHadithResults] = useState([])
  const [libCounts,     setLibCounts]     = useState({ dailyThemes: 0, quranVerses: 0, hadiths: 0 })

  useEffect(() => { setLibCounts(getLibraryCounts()) }, [])

  const totalSaved = libCounts.dailyThemes + libCounts.quranVerses + libCounts.hadiths

  const staticResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null

    const quranSurahs = chapters
      .filter(s =>
        s.name_simple.toLowerCase().includes(q) ||
        s.name_arabic.includes(query.trim()) ||
        s.translated_name?.name.toLowerCase().includes(q) ||
        (s.name_complex || '').toLowerCase().includes(q)
      )
      .slice(0, 6)

    const hadithTopics = TOPICS
      .filter(t => t.name.toLowerCase().includes(q) || t.arabicName.includes(query.trim()) || t.description.toLowerCase().includes(q))
      .slice(0, 4)

    const hadithCollections = COLLECTIONS
      .filter(c => c.name.toLowerCase().includes(q) || c.arabicName.includes(query.trim()) || c.author.toLowerCase().includes(q))
      .slice(0, 3)

    const savedItems = getCollections()
      .flatMap(col =>
        getItemsInCollection(col.id)
          .filter(i => i.hadith?.text?.toLowerCase().includes(q) || (i.hadith?.narrator || '').toLowerCase().includes(q))
          .map(i => ({ ...i, collectionName: col.name }))
      )
      .slice(0, 3)

    return { quranSurahs, hadithTopics, hadithCollections, savedItems }
  }, [query])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) { setHadithResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hadith-search?q=${encodeURIComponent(q)}&limit=4`)
        if (res.ok) setHadithResults(await res.json())
      } catch { setHadithResults([]) }
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  const totalResults = staticResults
    ? staticResults.quranSurahs.length + staticResults.hadithTopics.length +
      staticResults.hadithCollections.length + staticResults.savedItems.length +
      hadithResults.length
    : 0

  const isSearching = query.trim().length > 0

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>

      {/* ── Top header ── */}
      <div style={{ backgroundColor: '#6B1F2A' }}>
        <div className="flex items-center justify-center py-2 px-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-base font-bold tracking-widest"
            style={{ color: 'rgba(250,247,242,0.6)', fontFamily: 'Georgia, serif' }}>مقصد</span>
          <span className="mx-2 text-xs" style={{ color: 'rgba(250,247,242,0.3)' }}>·</span>
          <span className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(250,247,242,0.5)' }}>Maqsad</span>
        </div>
        <DailyHeader />
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl" style={{
          backgroundColor: isSearching ? '#FFFCF7' : 'rgba(28,20,16,0.06)',
          border: `1.5px solid ${isSearching ? 'rgba(107,31,42,0.22)' : 'transparent'}`,
          boxShadow: isSearching ? '0 2px 12px rgba(28,20,16,0.08)' : 'none',
          transition: 'all 0.2s ease',
        }}>
          <span style={{ color: isSearching ? '#6B1F2A' : 'rgba(28,20,16,0.38)', flexShrink: 0 }}><SearchIco /></span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search surahs, hadiths, topics…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#1C1410' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'rgba(28,20,16,0.35)', flexShrink: 0 }} aria-label="Clear">
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <div className="px-4 pb-6">
          {totalResults === 0 && hadithResults.length === 0 ? (
            <EmptySearchState query={query.trim()} />
          ) : (
            <div className="flex flex-col gap-2">
              {staticResults?.quranSurahs.length > 0 && (
                <>
                  <GroupHeader label="Quran" count={staticResults.quranSurahs.length} />
                  {staticResults.quranSurahs.map(s => (
                    <QuranResult key={s.id} surah={s} query={query.trim()}
                      onClick={() => navigate('/quran', { state: { preselectSurah: s } })} />
                  ))}
                </>
              )}
              {hadithResults.length > 0 && (
                <>
                  <GroupHeader label="Hadith" count={hadithResults.length} />
                  {hadithResults.map((h, i) => (
                    <HadithResult key={i}
                      item={{ ...h, name: h.text?.slice(0, 80) + '…', arabicName: null }}
                      subtitle={`${h.narrator ? `Narrated by ${h.narrator} · ` : ''}${h.reference}`}
                      query={query.trim()}
                      onClick={() => navigate('/hadith/browse', { state: { type: 'collection', id: h.collection, name: h.reference, arabicName: '' } })} />
                  ))}
                </>
              )}
              {staticResults?.hadithTopics.length > 0 && (
                <>
                  <GroupHeader label="Hadith Topics" count={staticResults.hadithTopics.length} />
                  {staticResults.hadithTopics.map(t => (
                    <HadithResult key={t.id} item={t} query={query.trim()} subtitle={t.description}
                      onClick={() => navigate('/hadith/browse', { state: { type: 'topic', id: t.id, name: t.name, arabicName: t.arabicName, collection: t.collection, book: t.book } })} />
                  ))}
                </>
              )}
              {staticResults?.hadithCollections.length > 0 && (
                <>
                  <GroupHeader label="Hadith Collections" count={staticResults.hadithCollections.length} />
                  {staticResults.hadithCollections.map(c => (
                    <HadithResult key={c.id} item={c} query={query.trim()} subtitle={c.author}
                      onClick={() => navigate('/hadith/browse', { state: { type: 'collection', id: c.id, name: c.name, arabicName: c.arabicName } })} />
                  ))}
                </>
              )}
              {staticResults?.savedItems.length > 0 && (
                <>
                  <GroupHeader label="My Collections" count={staticResults.savedItems.length} />
                  {staticResults.savedItems.map((item, i) => (
                    <HadithResult key={i}
                      item={{ name: item.hadith?.text?.slice(0, 80) + '…', arabicName: null, reference: item.hadith?.reference }}
                      subtitle={item.collectionName}
                      query={query.trim()}
                      onClick={() => navigate('/my-maqsad')} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Daily Theme ── */}
          <DailyThemeSection />

          <div className="mx-4 h-px my-2" style={{ backgroundColor: 'rgba(28,20,16,0.07)' }} />

          {/* ── My Maqsad button ── */}
          <div className="px-4 py-3">
            <button onClick={() => navigate('/my-maqsad')}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #6B1F2A 0%, #8B2A38 100%)', boxShadow: '0 4px 16px rgba(107,31,42,0.28)' }}>
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#C4973A' }}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: '#FAF7F2' }}>My Maqsad</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(250,247,242,0.6)' }}>
                    {totalSaved > 0 ? `${totalSaved} saved item${totalSaved !== 1 ? 's' : ''}` : 'Your personal library'}
                  </p>
                </div>
              </div>
              <span style={{ color: 'rgba(250,247,242,0.5)' }}><ChevRight /></span>
            </button>
          </div>

          {/* ── Modules ── */}
          <main className="px-4 pt-1 pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'rgba(28,20,16,0.35)', letterSpacing: '0.16em' }}>
              Modules
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modules.map(mod => (
                <ModuleCard key={mod.id} {...mod} onClick={mod.path ? () => navigate(mod.path) : undefined} />
              ))}
            </div>
          </main>

          <SupportStrip />
        </>
      )}
    </div>
  )
}
