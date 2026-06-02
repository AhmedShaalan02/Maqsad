import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const MODES = ['Tafseer', 'Hifz', 'Tilawah']
const AYAAT_OPTIONS = [5, 10, 20, 'All']

const BackArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <path d="M12 5l-7 7 7 7"/>
  </svg>
)

function SurahRow({ surah, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
      style={{
        borderBottom: '1px solid rgba(28, 20, 16, 0.06)',
        backgroundColor: selected ? 'rgba(107, 31, 42, 0.06)' : 'transparent',
      }}
    >
      {/* Surah number badge */}
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

      {/* English name + translation */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug" style={{ color: '#1C1410' }}>
          {surah.name_simple}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(28, 20, 16, 0.45)' }}>
          {surah.translated_name.name}
        </p>
      </div>

      {/* Arabic name + verse count */}
      <div className="text-right flex-shrink-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: '#1C1410', fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {surah.name_arabic}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(28, 20, 16, 0.45)' }}>
          {surah.verses_count} ayaat
        </p>
      </div>
    </button>
  )
}

function SurahSkeleton() {
  return (
    <>
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 animate-pulse"
          style={{ borderBottom: '1px solid rgba(28, 20, 16, 0.06)' }}
        >
          <div
            className="flex-shrink-0 w-9 h-7 rounded-lg"
            style={{ backgroundColor: 'rgba(28, 20, 16, 0.08)' }}
          />
          <div className="flex-1">
            <div className="h-3.5 rounded-md w-28 mb-2" style={{ backgroundColor: 'rgba(28, 20, 16, 0.08)' }} />
            <div className="h-2.5 rounded-md w-20" style={{ backgroundColor: 'rgba(28, 20, 16, 0.05)' }} />
          </div>
          <div className="text-right">
            <div className="h-3.5 rounded-md w-16 mb-2 ml-auto" style={{ backgroundColor: 'rgba(28, 20, 16, 0.08)' }} />
            <div className="h-2.5 rounded-md w-10 ml-auto" style={{ backgroundColor: 'rgba(28, 20, 16, 0.05)' }} />
          </div>
        </div>
      ))}
    </>
  )
}

export default function QuranPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('Tafseer')
  const [surahs, setSurahs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedSurah, setSelectedSurah] = useState(null)
  const [ayaatCount, setAyaatCount] = useState(10)

  const fetchSurahs = () => {
    setLoading(true)
    setError(false)
    fetch('https://api.quran.com/api/v4/chapters?language=en')
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(data => {
        setSurahs(data.chapters)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }

  useEffect(() => { fetchSurahs() }, [])

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

      {/* ── Surah list ── */}
      <div className="flex-1 overflow-y-auto">
        {loading && <SurahSkeleton />}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm" style={{ color: 'rgba(28, 20, 16, 0.45)' }}>
              Could not load surahs.
            </p>
            <button
              onClick={fetchSurahs}
              className="px-5 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && surahs.map(surah => (
          <SurahRow
            key={surah.id}
            surah={surah}
            selected={selectedSurah?.id === surah.id}
            onSelect={() => handleSurahSelect(surah)}
          />
        ))}
      </div>

      {/* ── Bottom controls ── */}
      <div
        className="flex-shrink-0 px-4 pt-3 pb-8"
        style={{ borderTop: '1px solid rgba(28, 20, 16, 0.08)', backgroundColor: '#FAF7F2' }}
      >
        {/* Ayaat selector */}
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

        {/* Begin Session */}
        <button
          className="w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all"
          style={{
            backgroundColor: selectedSurah ? '#6B1F2A' : 'rgba(107, 31, 42, 0.25)',
            color: selectedSurah ? '#FAF7F2' : 'rgba(250, 247, 242, 0.7)',
          }}
          disabled={!selectedSurah}
        >
          {selectedSurah
            ? `Begin Session · ${selectedSurah.name_simple}`
            : 'Select a Surah to begin'}
        </button>
      </div>

    </div>
  )
}
