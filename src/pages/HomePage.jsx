import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ModuleCard from '../components/ModuleCard'
import SupportStrip from '../components/SupportStrip'
import Highlight from '../components/Highlight'
import DailyThemeSection from '../components/DailyThemeSection'
import { modules } from '../modules/moduleData'
import surahData from '../data/surahs.json'
import { getHijriDate, formatGregorian } from '../utils/hijriUtils'
import { getIslamicSignificance } from '../data/islamicDates'
import { requestLocation, calcPrayerTimes, getNextPrayer, formatCountdown } from '../utils/prayerUtils'
import { getLibraryCounts } from '../utils/myMaqsadStorage'
import { loadCollection } from '../utils/hadithLoader'

const HADITH_COLLECTIONS = ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'ibnmajah', 'nasai']

async function searchHadiths(q, limit = 5) {
  const results = []
  for (const col of HADITH_COLLECTIONS) {
    if (results.length >= limit) break
    const hadiths = await loadCollection(col)
    if (!hadiths) continue
    for (const h of hadiths) {
      if (results.length >= limit) break
      if (h.text?.toLowerCase().includes(q) || (h.narrator || '').toLowerCase().includes(q)) {
        results.push(h)
      }
    }
  }
  return results
}

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

// Returns a context-aware snippet of text centred on the first match.
function getSnippet(text, query, maxLen = 130) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
  const start = Math.max(0, idx - 35)
  const end   = Math.min(text.length, idx + query.length + 75)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

export default function HomePage() {
  const navigate = useNavigate()
  const [query,         setQuery]         = useState('')
  const [verseResults,  setVerseResults]  = useState([])
  const [hadithResults, setHadithResults] = useState([])
  const [libCounts,     setLibCounts]     = useState({ dailyThemes: 0, quranVerses: 0, hadiths: 0 })

  useEffect(() => { setLibCounts(getLibraryCounts()) }, [])

  const totalSaved = libCounts.dailyThemes + libCounts.quranVerses + libCounts.hadiths

  // Debounced content search — loads hadith collections on demand, queries verse text via server
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setVerseResults([]); setHadithResults([]); return }
    const timer = setTimeout(async () => {
      const ql = q.toLowerCase()
      const [vRes, hRes] = await Promise.allSettled([
        fetch(`/api/verse-search?q=${encodeURIComponent(q)}&limit=5`).then(r => r.ok ? r.json() : []),
        searchHadiths(ql, 5),
      ])
      setVerseResults(vRes.status === 'fulfilled' ? vRes.value : [])
      setHadithResults(hRes.status === 'fulfilled' ? hRes.value : [])
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  const totalResults = verseResults.length + hadithResults.length
  const isSearching  = query.trim().length > 0

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
          {totalResults === 0 ? (
            query.trim().length >= 2
              ? <EmptySearchState query={query.trim()} />
              : <p className="text-center text-xs pt-8" style={{ color: 'rgba(28,20,16,0.35)' }}>Type at least 2 characters to search</p>
          ) : (
            <div className="flex flex-col gap-2">

              {/* ── Quran verse results ── */}
              {verseResults.length > 0 && (
                <>
                  <GroupHeader label="Quran" count={verseResults.length} />
                  {verseResults.map((v, i) => {
                    const snippet = getSnippet(v.text, query.trim())
                    const surah   = chapters.find(c => c.id === v.surahId)
                    return (
                      <button key={i}
                        onClick={() => navigate('/quran', { state: { preselectSurah: surah } })}
                        className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98]"
                        style={{ backgroundColor: '#FFFCF7', boxShadow: '0 1px 8px rgba(28,20,16,0.07)', border: '1px solid rgba(107,31,42,0.08)' }}>
                        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>
                            {v.key}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(28,20,16,0.45)' }}>
                            {v.surahName}
                          </span>
                        </div>
                        <p className="px-3 pb-2.5 text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.7)', lineHeight: '1.7' }}>
                          <Highlight text={snippet} query={query.trim()} />
                        </p>
                      </button>
                    )
                  })}
                </>
              )}

              {/* ── Hadith results ── */}
              {hadithResults.length > 0 && (
                <>
                  <GroupHeader label="Hadith" count={hadithResults.length} />
                  {hadithResults.map((h, i) => {
                    const snippet = getSnippet(h.text || '', query.trim())
                    return (
                      <button key={i}
                        onClick={() => navigate('/hadith/browse', { state: { type: 'collection', id: h.collection, name: h.reference, arabicName: '' } })}
                        className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98]"
                        style={{ backgroundColor: '#FFFCF7', boxShadow: '0 1px 8px rgba(28,20,16,0.07)', border: '1px solid rgba(196,151,58,0.12)' }}>
                        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                          <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.38)' }}>{h.reference}</span>
                          {h.narrator && (
                            <span className="text-xs" style={{ color: 'rgba(28,20,16,0.45)', fontStyle: 'italic' }}>
                              {h.narrator}
                            </span>
                          )}
                        </div>
                        <p className="px-3 pb-2.5 text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.7)', lineHeight: '1.7' }}>
                          <Highlight text={snippet} query={query.trim()} />
                        </p>
                      </button>
                    )
                  })}
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
