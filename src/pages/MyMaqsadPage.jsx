import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllDailyThemes, deleteDailyTheme,
  getSavedQuranVerses, deleteQuranVerse,
  getSavedHadiths, deleteSavedHadith,
} from '../utils/myMaqsadStorage'
import surahData from '../data/surahs.json'

const chapters = surahData.chapters

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
  </svg>
)
const ChevronDown = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)
const TrashIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon, title, count, children, placeholder, initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen || count > 0)
  const isEmpty = count === 0

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', boxShadow: '0 2px 12px rgba(28,20,16,0.07)', border: '1px solid rgba(28,20,16,0.06)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: open ? '1px solid rgba(28,20,16,0.06)' : 'none' }}
      >
        <span className="text-xl w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ backgroundColor: 'rgba(107,31,42,0.07)' }}>
          {icon}
        </span>
        <div className="flex-1 text-left">
          <p className="font-bold text-sm" style={{ color: '#1C1410' }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.42)' }}>
            {isEmpty ? 'Nothing saved yet' : `${count} item${count !== 1 ? 's' : ''}`}
          </p>
        </div>
        {count > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full mr-2"
            style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>
            {count}
          </span>
        )}
        <ChevronDown open={open} />
      </button>

      {open && (
        <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
          {isEmpty ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: 'rgba(28,20,16,0.4)' }}>{placeholder}</p>
            </div>
          ) : children}
        </div>
      )}
    </div>
  )
}

// ── Daily theme item ──────────────────────────────────────────────────────────

function DailyThemeItem({ theme, onDelete }) {
  const date = new Date(theme.dateKey + 'T00:00:00')
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm" style={{ color: '#1C1410' }}>{theme.theme || 'Daily Theme'}</p>
            {theme.themeArabic && <span className="text-xs" style={{ fontFamily: 'Georgia, serif', color: '#C4973A' }}>{theme.themeArabic}</span>}
          </div>
          <p className="text-xs" style={{ color: 'rgba(28,20,16,0.4)' }}>{label}</p>
          {theme.verse && (
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(28,20,16,0.6)' }}>
              "{theme.verse.translations?.[0]?.text?.slice(0, 80)}…" — {theme.verse.verse_key}
            </p>
          )}
          {theme.reflection && (
            <div className="mt-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(196,151,58,0.07)', border: '1px solid rgba(196,151,58,0.18)' }}>
              <p className="text-xs" style={{ color: 'rgba(28,20,16,0.65)', fontStyle: 'italic' }}>✏ {theme.reflection.slice(0, 120)}{theme.reflection.length > 120 ? '…' : ''}</p>
            </div>
          )}
        </div>
        <button onClick={() => onDelete(theme.dateKey)} className="p-1.5 rounded-lg flex-shrink-0"
          style={{ color: 'rgba(28,20,16,0.3)' }}>
          <TrashIco />
        </button>
      </div>
    </div>
  )
}

// ── Quran verse item ──────────────────────────────────────────────────────────

function QuranVerseItem({ verse, onDelete }) {
  const surah = chapters.find(c => c.id === verse.surahNum)
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>
              {surah?.name_simple || `Surah ${verse.surahNum}`} · {verse.verseNum}
            </span>
            {verse.highlighted && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(196,151,58,0.15)', color: '#9A7020' }}>
                Highlighted
              </span>
            )}
          </div>
          {verse.note && (
            <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(28,20,16,0.65)', fontStyle: 'italic' }}>
              "{verse.note.slice(0, 140)}{verse.note.length > 140 ? '…' : ''}"
            </p>
          )}
        </div>
        <button onClick={() => onDelete(verse.key)} className="p-1.5 rounded-lg flex-shrink-0"
          style={{ color: 'rgba(28,20,16,0.3)' }}>
          <TrashIco />
        </button>
      </div>
    </div>
  )
}

// ── Hadith item ───────────────────────────────────────────────────────────────

function HadithItem({ item, onDelete }) {
  const h = item.hadith
  const grade = h?.grade
  const gradeStyle = grade?.toLowerCase().includes('sahih')
    ? { bg: 'rgba(74,103,65,0.1)', color: '#2D6A4F' }
    : { bg: 'rgba(196,151,58,0.1)', color: '#9A7020' }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(107,31,42,0.08)', color: '#6B1F2A' }}>
              {item.collectionName}
            </span>
            <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.32)' }}>{h?.reference}</span>
            {grade && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: gradeStyle.bg, color: gradeStyle.color }}>
                {grade}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.7)', lineHeight: '1.75' }}>
            {h?.text?.slice(0, 140)}{h?.text?.length > 140 ? '…' : ''}
          </p>
          {h?.narrator && (
            <p className="text-xs mt-1" style={{ color: 'rgba(28,20,16,0.42)', fontStyle: 'italic' }}>
              — {h.narrator}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: 'rgba(28,20,16,0.3)' }}>
            Saved {new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => onDelete(item.hadithId, item.collectionId)} className="p-1.5 rounded-lg flex-shrink-0"
          style={{ color: 'rgba(28,20,16,0.3)' }}>
          <TrashIco />
        </button>
      </div>
    </div>
  )
}

// ── Placeholder section ───────────────────────────────────────────────────────

function PlaceholderSection({ icon, title }) {
  return (
    <Section icon={icon} title={title} count={0} placeholder="Coming soon — this section will sync with the module as you save content.">
      {null}
    </Section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyMaqsadPage() {
  const navigate = useNavigate()
  const [themes, setThemes] = useState([])
  const [verses, setVerses] = useState([])
  const [hadiths, setHadiths] = useState([])

  const load = () => {
    setThemes(getAllDailyThemes())
    setVerses(getSavedQuranVerses())
    setHadiths(getSavedHadiths())
  }

  useEffect(() => { load() }, [])

  const handleDeleteTheme = key => { deleteDailyTheme(key); load() }
  const handleDeleteVerse = key => { deleteQuranVerse(key); load() }
  const handleDeleteHadith = (id, colId) => { deleteSavedHadith(id, colId); load() }

  const totalSaved = themes.length + verses.length + hadiths.length

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#FAF7F2' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#6B1F2A' }} className="relative flex-shrink-0">
        <button onClick={() => navigate('/')} className="absolute left-3 inset-y-0 flex items-center px-2"
          style={{ color: '#FAF7F2' }} aria-label="Back">
          <BackArrow />
        </button>
        <div className="py-5 px-14 text-center">
          <h1 className="text-lg font-bold tracking-wide" style={{ color: '#FAF7F2' }}>My Maqsad</h1>
          <p className="text-base mt-0.5" style={{ color: '#C4973A', fontFamily: 'Georgia, "Times New Roman", serif' }}>مقصدي</p>
        </div>
      </header>

      {/* Stats strip */}
      <div className="flex-shrink-0 flex items-center justify-center gap-6 py-3 px-4"
        style={{ backgroundColor: '#FFFCF7', borderBottom: '1px solid rgba(28,20,16,0.07)' }}>
        {[
          { label: 'Daily Themes', count: themes.length },
          { label: 'Quran', count: verses.length },
          { label: 'Hadith', count: hadiths.length },
        ].map(({ label, count }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-bold" style={{ color: count > 0 ? '#6B1F2A' : 'rgba(28,20,16,0.25)' }}>{count}</p>
            <p className="text-xs" style={{ color: 'rgba(28,20,16,0.42)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {totalSaved === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: 'rgba(107,31,42,0.08)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1C1410' }}>Your library is empty</h3>
            <p className="text-sm" style={{ color: 'rgba(28,20,16,0.45)' }}>
              Daily themes are saved automatically. Highlight verses and save hadiths to build your personal library.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 py-4">

            {/* Daily Lessons */}
            <Section icon="📅" title="Daily Lessons" count={themes.length}
              placeholder="Daily themes are saved automatically each day."
              initialOpen={themes.length > 0}>
              {themes.map(t => <DailyThemeItem key={t.dateKey} theme={t} onDelete={handleDeleteTheme} />)}
            </Section>

            {/* Quran */}
            <Section icon="📖" title="Quran" count={verses.length}
              placeholder="Highlight ayaat or add notes in the Quran module to save them here.">
              {verses.map(v => <QuranVerseItem key={v.key} verse={v} onDelete={handleDeleteVerse} />)}
            </Section>

            {/* Hadith */}
            <Section icon="📜" title="Hadith" count={hadiths.length}
              placeholder="Tap the bookmark icon on any hadith card to save it here.">
              {hadiths.map((item, i) => (
                <HadithItem key={i} item={item} onDelete={handleDeleteHadith} />
              ))}
            </Section>

            {/* Placeholder sections */}
            <PlaceholderSection icon="🕌" title="Seerah" />
            <PlaceholderSection icon="⚖️" title="Fiqh" />
            <PlaceholderSection icon="🌙" title="Islamic Studies" />
            <PlaceholderSection icon="❓" title="Su'al" />
          </div>
        )}
      </div>
    </div>
  )
}
