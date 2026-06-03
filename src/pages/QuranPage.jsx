import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import surahData from '../data/surahs.json'
import Highlight from '../components/Highlight'

function getSnippet(text, query, maxLen = 120) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
  const start = Math.max(0, idx - 30)
  const end   = Math.min(text.length, idx + query.length + 70)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

const MODES = ['Tafseer', 'Hifz', 'Tilawah']
const AYAAT_OPTIONS = [5, 10, 20, 'All']
const TAFSEER_OPTIONS = [
  { id: 169, name: 'Ibn Kathir',     sublabel: 'In depth', arabic: false },
  { id: 168, name: 'Mufti Shafi',    sublabel: 'Detailed', arabic: false },
  { id: 817, name: 'Tazkirul Quran', sublabel: 'Concise',  arabic: false },
  { id: 91,  name: "Al-Sa'di",  sublabel: null,       arabic: true  },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <path d="M12 5l-7 7 7 7"/>
  </svg>
)

const SearchIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

// ── Surah Row ─────────────────────────────────────────────────────────────────

function SurahRow({ surah, selected, query, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
      style={{
        borderBottom: '1px solid rgba(28, 20, 16, 0.06)',
        backgroundColor: selected ? 'rgba(107, 31, 42, 0.06)' : 'transparent',
      }}
    >
      <div
        className="flex-shrink-0 w-9 h-7 rounded-lg flex items-center justify-center font-bold"
        style={{
          fontSize: surah.id >= 100 ? '9px' : '11px',
          backgroundColor: selected ? '#6B1F2A' : 'rgba(107, 31, 42, 0.1)',
          color: selected ? '#FAF7F2' : '#6B1F2A',
        }}
      >
        {surah.id}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug" style={{ color: '#1C1410' }}>
          <Highlight text={surah.name_simple} query={query} />
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(28, 20, 16, 0.45)' }}>
          <Highlight text={surah.translated_name.name} query={query} />
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: '#1C1410', fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          <Highlight text={surah.name_arabic} query={query} />
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(28, 20, 16, 0.45)' }}>
          {surah.verses_count} ayaat
        </p>
      </div>
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function QuranPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Accept pre-selected surah from global search navigation
  const [mode, setMode] = useState('Tafseer')
  const [selectedSurah, setSelectedSurah] = useState(location.state?.preselectSurah ?? null)
  const [ayaatCount, setAyaatCount] = useState(10)
  const [selectedTafseer, setSelectedTafseer] = useState(TAFSEER_OPTIONS[0])
  const [surahSearch,     setSurahSearch]     = useState('')
  const [verseApiResults, setVerseApiResults] = useState([])

  const surahs = surahData.chapters

  // Instant surah-name filter
  const displayedSurahs = useMemo(() => {
    const q = surahSearch.trim().toLowerCase()
    if (!q) return surahs
    return surahs.filter(s =>
      s.name_simple.toLowerCase().includes(q) ||
      s.name_arabic.includes(surahSearch.trim()) ||
      s.translated_name.name.toLowerCase().includes(q) ||
      (s.name_complex || '').toLowerCase().includes(q)
    )
  }, [surahs, surahSearch])

  // Debounced verse content search
  useEffect(() => {
    const q = surahSearch.trim()
    if (q.length < 3) { setVerseApiResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/verse-search?q=${encodeURIComponent(q)}&limit=5`)
        if (res.ok) setVerseApiResults(await res.json())
      } catch { setVerseApiResults([]) }
    }, 350)
    return () => clearTimeout(timer)
  }, [surahSearch])

  const handleSurahSelect = surah => {
    setSelectedSurah(prev => (prev?.id === surah.id ? null : surah))
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#FAF7F2' }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: '#6B1F2A' }} className="relative flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="absolute left-3 inset-y-0 flex items-center px-2"
          style={{ color: '#FAF7F2' }}
          aria-label="Back"
        >
          <BackArrowIcon />
        </button>
        <div className="py-5 px-14 text-center">
          <h1 className="text-lg font-bold tracking-wide" style={{ color: '#FAF7F2' }}>
            Quran
          </h1>
          <p
            className="text-base mt-0.5"
            style={{ color: '#C4973A', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            القرآن الكريم
          </p>
        </div>
      </header>

      {/* ── Mode pills ── */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(28, 20, 16, 0.07)' }}
      >
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={
              mode === m
                ? { backgroundColor: '#6B1F2A', color: '#FAF7F2' }
                : { backgroundColor: 'rgba(107, 31, 42, 0.08)', color: 'rgba(28, 20, 16, 0.55)' }
            }
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── Surah search ── */}
      <div
        className="flex-shrink-0 px-4 py-2"
        style={{ borderBottom: '1px solid rgba(28,20,16,0.06)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'rgba(28,20,16,0.05)', border: '1px solid rgba(28,20,16,0.07)' }}
        >
          <span style={{ color: 'rgba(28,20,16,0.38)' }}><SearchIco /></span>
          <input
            value={surahSearch}
            onChange={e => setSurahSearch(e.target.value)}
            placeholder="Search surahs or verses…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#1C1410' }}
          />
          {surahSearch && (
            <button
              onClick={() => setSurahSearch('')}
              style={{ color: 'rgba(28,20,16,0.35)' }}
              aria-label="Clear"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {surahSearch && (
            <span className="text-xs font-medium ml-1 flex-shrink-0" style={{ color: 'rgba(28,20,16,0.38)' }}>
              {displayedSurahs.length + verseApiResults.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Surah list + verse matches ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Surah name matches */}
        {displayedSurahs.length > 0
          ? displayedSurahs.map(surah => (
              <SurahRow
                key={surah.id}
                surah={surah}
                selected={selectedSurah?.id === surah.id}
                query={surahSearch.trim()}
                onSelect={() => handleSurahSelect(surah)}
              />
            ))
          : surahSearch.trim().length > 0 && verseApiResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <p className="text-sm font-medium mb-1" style={{ color: 'rgba(28,20,16,0.5)' }}>
                  No surahs match "{surahSearch}"
                </p>
                <button onClick={() => setSurahSearch('')} className="text-xs mt-1 font-semibold" style={{ color: '#6B1F2A' }}>
                  Clear search
                </button>
              </div>
            )
        }

        {/* Verse content matches */}
        {verseApiResults.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mt-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(28,20,16,0.38)' }}>
                Verse Matches
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>
                {verseApiResults.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {verseApiResults.map((v, i) => {
                const surah   = surahs.find(s => s.id === v.surahId)
                const snippet = getSnippet(v.text, surahSearch.trim())
                return (
                  <button key={i}
                    onClick={() => {
                      if (surah) setSelectedSurah(surah)
                      setSurahSearch('')
                    }}
                    className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98]"
                    style={{ backgroundColor: '#FFFCF7', boxShadow: '0 1px 8px rgba(28,20,16,0.07)', border: '1px solid rgba(107,31,42,0.08)' }}
                  >
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
                      <Highlight text={snippet} query={surahSearch.trim()} />
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── Bottom controls ── */}
      <div
        className="flex-shrink-0 px-4 pt-3 pb-8"
        style={{ borderTop: '1px solid rgba(28, 20, 16, 0.08)', backgroundColor: '#FAF7F2' }}
      >
        {mode === 'Tafseer' && (
          <div className="mb-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(28, 20, 16, 0.4)' }}
            >
              Tafseer
            </span>
            <div className="flex flex-col gap-1.5 mt-2">
              {TAFSEER_OPTIONS.map(opt => {
                const active = selectedTafseer.id === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedTafseer(opt)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-left"
                    style={
                      active
                        ? { backgroundColor: '#6B1F2A', color: '#FAF7F2' }
                        : { backgroundColor: 'rgba(107, 31, 42, 0.08)', color: 'rgba(28, 20, 16, 0.7)' }
                    }
                  >
                    <span>{opt.name}</span>
                    {opt.sublabel && (
                      <span style={{ opacity: active ? 0.7 : 0.5, fontWeight: 400 }}>
                        · {opt.sublabel}
                      </span>
                    )}
                    {opt.arabic && (
                      <span
                        className="ml-auto rounded px-1.5 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: active ? 'rgba(250,247,242,0.18)' : 'rgba(107,31,42,0.12)',
                          color: active ? 'rgba(250,247,242,0.85)' : '#6B1F2A',
                          fontSize: '10px',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Arabic
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="text-xs font-semibold uppercase tracking-wider flex-shrink-0"
            style={{ color: 'rgba(28, 20, 16, 0.4)' }}
          >
            Ayaat
          </span>
          <div className="flex gap-1.5">
            {AYAAT_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setAyaatCount(opt)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={
                  ayaatCount === opt
                    ? { backgroundColor: '#6B1F2A', color: '#FAF7F2' }
                    : { backgroundColor: 'rgba(107, 31, 42, 0.08)', color: 'rgba(28, 20, 16, 0.55)' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          className="w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all"
          style={{
            backgroundColor: selectedSurah ? '#6B1F2A' : 'rgba(107, 31, 42, 0.25)',
            color: selectedSurah ? '#FAF7F2' : 'rgba(250, 247, 242, 0.7)',
          }}
          disabled={!selectedSurah}
          onClick={() => selectedSurah && navigate('/quran/session', {
            state: { surah: selectedSurah, ayaatCount, mode, tafseerOption: selectedTafseer },
          })}
        >
          {selectedSurah
            ? `Begin Session · ${selectedSurah.name_simple}`
            : 'Select a Surah to begin'}
        </button>
      </div>

    </div>
  )
}
