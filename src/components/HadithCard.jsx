import { useState, useMemo } from 'react'
import { findNarratorBio } from '../data/narratorBios'
import {
  isInAnyCollection,
  isInCollection,
  toggleInCollection,
  getCollections,
  createCollection,
} from '../utils/hadithStorage'
import { gradeStyle } from '../utils/gradeUtils'
import GoldDivider from './GoldDivider'

// ── Local Storage ─────────────────────────────────────────────────────────────

function getNoteData(key) {
  try {
    const s = localStorage.getItem(`maqsad_hadith_v1_${key}`)
    return s ? JSON.parse(s) : { highlighted: false, note: '' }
  } catch { return { highlighted: false, note: '' } }
}

function saveNoteData(key, data) {
  try { localStorage.setItem(`maqsad_hadith_v1_${key}`, JSON.stringify(data)) } catch {}
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const BookmarkFilledIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const BookmarkEmptyIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const PencilIco = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const CopyIco = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const ExtLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const ChevronDown = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ── Collection Sheet ──────────────────────────────────────────────────────────

function CollectionSheet({ hadith, onClose }) {
  const [collections, setCollections] = useState(getCollections())
  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')
  // Force re-render when membership changes
  const [tick, setTick] = useState(0)

  const handleToggle = (colId) => {
    toggleInCollection(hadith, colId)
    setTick(t => t + 1)
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    const id = createCollection(newName.trim())
    toggleInCollection(hadith, id)
    setCollections(getCollections())
    setNewName('')
    setCreatingNew(false)
    setTick(t => t + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(28,20,16,0.45)' }} />

      {/* Sheet */}
      <div
        className="relative rounded-t-3xl px-5 pt-5 pb-8"
        style={{ backgroundColor: '#FAF7F2', animation: 'slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(28,20,16,0.15)' }} />

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: '#1C1410' }}>Save to Collection</h3>
          <button onClick={onClose} style={{ color: 'rgba(28,20,16,0.4)' }}><XIcon /></button>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {collections.map(col => {
            const saved = isInCollection(hadith.id, col.id)
            return (
              <button
                key={col.id}
                onClick={() => handleToggle(col.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                  backgroundColor: saved ? 'rgba(107,31,42,0.08)' : 'rgba(28,20,16,0.04)',
                  border: `1px solid ${saved ? 'rgba(107,31,42,0.2)' : 'transparent'}`,
                }}
              >
                <span className="text-base" style={{ color: saved ? '#6B1F2A' : 'rgba(28,20,16,0.4)' }}>
                  {col.icon}
                </span>
                <span className="flex-1 font-medium text-sm" style={{ color: '#1C1410' }}>{col.name}</span>
                {saved && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
                    Saved
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {creatingNew ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Collection name…"
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1px solid rgba(107,31,42,0.3)', backgroundColor: '#fff', color: '#1C1410' }}
            />
            <button onClick={handleCreate} className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
              Create
            </button>
            <button onClick={() => { setCreatingNew(false); setNewName('') }}
              style={{ color: 'rgba(28,20,16,0.4)', padding: '8px' }}>
              <XIcon />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingNew(true)}
            className="w-full py-2.5 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: 'rgba(107,31,42,0.07)', color: '#6B1F2A', border: '1px dashed rgba(107,31,42,0.25)' }}
          >
            + New collection
          </button>
        )}
      </div>
    </div>
  )
}

// ── Mini Hadith Card (for Related) ────────────────────────────────────────────

function MiniHadithCard({ hadith }) {
  const gs = gradeStyle(hadith.grade)
  const displayGrade = hadith.grade || (['bukhari', 'muslim'].includes(hadith.collection) ? 'Sahih' : null)
  return (
    <div
      className="rounded-xl px-3 py-3"
      style={{ backgroundColor: 'rgba(107,31,42,0.04)', border: '1px solid rgba(107,31,42,0.08)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        {displayGrade && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: gs.bg, color: gs.color, border: `1px solid ${gs.border}` }}>
            {displayGrade}
          </span>
        )}
        <span className="text-xs font-mono ml-auto" style={{ color: 'rgba(28,20,16,0.32)' }}>{hadith.reference}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.72)', lineHeight: '1.7' }}>
        {hadith.text.slice(0, 120)}{hadith.text.length > 120 ? '…' : ''}
      </p>
      {hadith.narrator && (
        <p className="text-xs mt-1.5" style={{ color: 'rgba(28,20,16,0.42)', fontStyle: 'italic' }}>
          — {hadith.narrator}
        </p>
      )}
    </div>
  )
}


// ── Main HadithCard ───────────────────────────────────────────────────────────

export default function HadithCard({ hadith, index, allHadiths, displayMode }) {
  const stored = getNoteData(hadith.id)
  const [highlighted, setHighlighted] = useState(stored.highlighted)
  const [note, setNote] = useState(stored.note)
  const [noteOpen, setNoteOpen] = useState(false)
  const [bioOpen, setBioOpen] = useState(false)
  const [relatedOpen, setRelatedOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [collSheet, setCollSheet] = useState(false)
  const [savedTick, setSavedTick] = useState(0)

  const narratorBio = findNarratorBio(hadith.narrator)

  const related = useMemo(() => {
    if (!allHadiths || allHadiths.length < 2) return []
    const others = allHadiths.filter(h => h.id !== hadith.id)
    const sameChapter = hadith.chapterTitle
      ? others.filter(h => h.chapterTitle === hadith.chapterTitle)
      : []
    return (sameChapter.length >= 2 ? sameChapter : others).slice(0, 3)
  }, [hadith, allHadiths])

  const isSaved = isInAnyCollection(hadith.id) // recomputes when savedTick changes via key prop trick

  const toggleHighlight = () => {
    const next = !highlighted
    setHighlighted(next)
    saveNoteData(hadith.id, { highlighted: next, note })
  }

  const handleNoteChange = val => {
    setNote(val)
    saveNoteData(hadith.id, { highlighted, note: val })
  }

  const handleCopy = () => {
    const lines = []
    if (hadith.arabicText) lines.push(hadith.arabicText, '')
    lines.push(hadith.text, '')
    lines.push(
      `Narrated by ${hadith.narrator || 'unknown'} — ${hadith.reference}` +
      (hadith.grade ? ` (${hadith.grade})` : '')
    )
    const text = lines.join('\n')
    try {
      navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveClose = () => {
    setCollSheet(false)
    setSavedTick(t => t + 1)
  }

  const gs = gradeStyle(hadith.grade)
  const displayGrade = hadith.grade || (['bukhari', 'muslim'].includes(hadith.collection) ? 'Sahih' : null)
  const mode = displayMode || 'both'
  const showArabic = (mode === 'arabic' || mode === 'both') && hadith.arabicText
  const showEnglish = mode === 'english' || mode === 'both'

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: highlighted ? 'rgba(196,151,58,0.055)' : '#FFFCF7',
          boxShadow: highlighted
            ? '0 4px 24px rgba(196,151,58,0.24), 0 2px 8px rgba(28,20,16,0.05)'
            : '0 2px 14px rgba(28,20,16,0.08)',
          border: `1px solid ${highlighted ? 'rgba(196,151,58,0.32)' : 'rgba(28,20,16,0.06)'}`,
          animation: 'fadeInUp 0.3s ease both',
          animationDelay: `${Math.min(index * 0.04, 0.32)}s`,
        }}
      >
        {/* ── Grade + Reference ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          {displayGrade ? (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: gs.bg, color: gs.color, border: `1px solid ${gs.border}` }}
            >
              {displayGrade}
            </span>
          ) : <span />}
          <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.32)' }}>
            {hadith.reference}
          </span>
        </div>

        {/* ── Arabic Text ── */}
        {showArabic && (
          <div className="px-4 pt-1 pb-2">
            <p
              dir="rtl"
              style={{
                fontFamily: '"Amiri", Georgia, serif',
                fontSize: '21px',
                lineHeight: '2.1',
                color: '#1C1410',
                textAlign: 'right',
              }}
            >
              {hadith.arabicText}
            </p>
          </div>
        )}

        {/* ── Divider between Arabic and English ── */}
        {showArabic && showEnglish && <GoldDivider />}

        {/* ── English Text ── */}
        {showEnglish && (
          <p
            className="px-4 pb-3 text-sm leading-relaxed"
            style={{ color: '#1C1410', lineHeight: '1.85' }}
          >
            {hadith.text}
          </p>
        )}

        {/* ── Section Divider ── */}
        <GoldDivider />

        {/* ── Narrator + Bio ── */}
        <div className="px-4 pb-1.5">
          {hadith.narrator && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: 'rgba(28,20,16,0.52)', fontStyle: 'italic' }}>
                Narrated by {hadith.narrator}
              </span>
              {narratorBio && (
                <button
                  onClick={() => setBioOpen(o => !o)}
                  className="flex items-center gap-0.5 text-xs font-semibold transition-colors"
                  style={{ color: '#C4973A' }}
                >
                  About <ChevronDown open={bioOpen} />
                </button>
              )}
            </div>
          )}
          {hadith.chapterTitle && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.3)' }}>
              {hadith.chapterTitle}
            </p>
          )}
        </div>

        {/* ── Narrator Bio ── */}
        {bioOpen && narratorBio && (
          <div
            className="mx-4 mb-3 px-3 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(196,151,58,0.06)', border: '1px solid rgba(196,151,58,0.18)' }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: '#9A7020' }}>{narratorBio.name}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.62)', lineHeight: '1.75' }}>
              {narratorBio.bio}
            </p>
          </div>
        )}

        {/* ── Notes ── */}
        {noteOpen && (
          <div className="px-4 pb-3">
            <textarea
              value={note}
              onChange={e => handleNoteChange(e.target.value)}
              placeholder="Add a personal note…"
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ border: '1px solid rgba(196,151,58,0.35)', backgroundColor: 'rgba(196,151,58,0.04)', color: '#1C1410' }}
            />
          </div>
        )}

        {/* ── Related Hadiths ── */}
        {relatedOpen && related.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(28,20,16,0.38)' }}>
              Related
            </p>
            <div className="flex flex-col gap-2">
              {related.map(r => <MiniHadithCard key={r.id} hadith={r} />)}
            </div>
          </div>
        )}

        {/* ── Action Row ── */}
        <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
          {/* Highlight */}
          <button
            onClick={toggleHighlight}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={highlighted
              ? { backgroundColor: 'rgba(196,151,58,0.18)', color: '#C4973A' }
              : { backgroundColor: 'rgba(28,20,16,0.05)', color: 'rgba(28,20,16,0.5)' }
            }
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={highlighted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {highlighted ? 'Saved' : 'Star'}
          </button>

          {/* Notes */}
          <button
            onClick={() => setNoteOpen(o => !o)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={noteOpen
              ? { backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }
              : { backgroundColor: 'rgba(28,20,16,0.05)', color: 'rgba(28,20,16,0.5)' }
            }
          >
            <PencilIco />
            Notes
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={copied
              ? { backgroundColor: 'rgba(74,103,65,0.12)', color: '#4A6741' }
              : { backgroundColor: 'rgba(28,20,16,0.05)', color: 'rgba(28,20,16,0.5)' }
            }
          >
            <CopyIco />
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {/* Save to collection */}
          <button
            onClick={() => setCollSheet(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={isSaved || savedTick > 0 && isInAnyCollection(hadith.id)
              ? { backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }
              : { backgroundColor: 'rgba(28,20,16,0.05)', color: 'rgba(28,20,16,0.5)' }
            }
          >
            {isInAnyCollection(hadith.id) ? <BookmarkFilledIco /> : <BookmarkEmptyIco />}
            Save
          </button>

          {/* Source */}
          <a
            href={hadith.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium ml-auto"
            style={{ backgroundColor: 'rgba(28,20,16,0.05)', color: 'rgba(28,20,16,0.5)' }}
          >
            <ExtLink />
            Source
          </a>
        </div>

        {/* Related toggle */}
        {related.length > 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setRelatedOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs font-medium w-full justify-center py-2 rounded-xl transition-all"
              style={relatedOpen
                ? { backgroundColor: 'rgba(107,31,42,0.07)', color: '#6B1F2A' }
                : { backgroundColor: 'rgba(28,20,16,0.03)', color: 'rgba(28,20,16,0.4)' }
              }
            >
              <ChevronDown open={relatedOpen} />
              {relatedOpen ? 'Hide related' : `${related.length} related hadith`}
            </button>
          </div>
        )}
      </div>

      {/* ── Collection Sheet ── */}
      {collSheet && <CollectionSheet hadith={hadith} onClose={handleSaveClose} />}
    </>
  )
}
