import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const verseModules = import.meta.glob('../data/verses/*.json')

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cleanText(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

// Tafseer deck: verse cards + quiz every 5, questions test tafseer not translation
function buildDeck(verses, tafseerName) {
  const versesWithTafseer = verses.filter(v => v.tafseer)
  if (verses.length < 4) return verses.map(v => ({ type: 'verse', verse: v }))
  const deck = []
  for (let i = 0; i < verses.length; i += 5) {
    const group = verses.slice(i, i + 5)
    group.forEach(v => deck.push({ type: 'verse', verse: v }))
    if (versesWithTafseer.length < 4) continue
    const groupWithTafseer = group.filter(v => v.tafseer)
    if (!groupWithTafseer.length) continue
    const qv = groupWithTafseer[Math.floor(Math.random() * groupWithTafseer.length)]
    const wrongPool = shuffle(versesWithTafseer.filter(v => v.id !== qv.id))
    if (wrongPool.length < 3) continue
    deck.push({
      type: 'quiz',
      arabic: qv.text_uthmani,
      translation: cleanText(qv.translations[0].text),
      verseKey: qv.verse_key,
      question: `According to ${tafseerName}, which explanation best matches this verse?`,
      options: shuffle([
        { text: truncate(cleanText(qv.tafseer), 160), correct: true },
        ...wrongPool.slice(0, 3).map(v => ({
          text: truncate(cleanText(v.tafseer), 160),
          correct: false,
        })),
      ]),
    })
  }
  return deck
}

// Hifz: blank out a significant content word
const SW = new Set(['the','a','an','in','of','to','and','or','but','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','with','by','at','from','for','on','as','it','its','this','that','he','she','they','we','you','his','her','their','our','your','not','then','than','so','if','all','who','whom','when','where','which','what','how','unto','upon','thee','thy','thou'])

function generateBlank(translation) {
  const words = translation.split(/\s+/)
  const candidates = words
    .map((w, i) => ({ raw: w, clean: w.replace(/[^a-zA-Z]/g, ''), i }))
    .filter(({ clean }) => clean.length >= 4 && !SW.has(clean.toLowerCase()))
  if (!candidates.length) return null
  const pick = candidates[Math.floor(candidates.length * 0.4)]
  return {
    blank: words.map((w, i) => (i === pick.i ? '___________' : w)).join(' '),
    answer: pick.clean.toLowerCase(),
    display: pick.clean,
  }
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────

function getNoteData(surahNum, verseNum) {
  try {
    const stored = localStorage.getItem(`maqsad_v1_${surahNum}_${verseNum}`)
    return stored ? JSON.parse(stored) : { highlighted: false, note: '' }
  } catch {
    return { highlighted: false, note: '' }
  }
}

function saveNoteData(surahNum, verseNum, data) {
  try {
    localStorage.setItem(`maqsad_v1_${surahNum}_${verseNum}`, JSON.stringify(data))
  } catch {}
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const ExtLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const BookmarkIco = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const PencilIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function ProgressBar({ pct }) {
  return (
    <div className="flex-shrink-0 h-1 w-full" style={{ backgroundColor: 'rgba(196,151,58,0.18)' }}>
      <div className="h-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: '#C4973A' }} />
    </div>
  )
}

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 mx-6 my-1">
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(196,151,58,0.3)' }} />
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#C4973A' }} />
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(196,151,58,0.3)' }} />
    </div>
  )
}

function DisplayToggle({ displayMode, setDisplayMode }) {
  const options = [
    { id: 'arabic',  label: 'Arabic only' },
    { id: 'both',    label: 'Both' },
    { id: 'english', label: 'English only' },
  ]
  return (
    <div
      className="flex-shrink-0 flex justify-center gap-1.5 px-4 py-2"
      style={{ borderBottom: '1px solid rgba(28,20,16,0.05)' }}
    >
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => setDisplayMode(opt.id)}
          className="px-3 py-1 rounded-full text-xs font-medium transition-all"
          style={
            displayMode === opt.id
              ? { backgroundColor: '#6B1F2A', color: '#FAF7F2' }
              : { backgroundColor: 'rgba(107,31,42,0.07)', color: 'rgba(28,20,16,0.5)' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden animate-pulse" style={{ backgroundColor: '#FFFCF7', boxShadow: '0 8px 32px rgba(28,20,16,0.08)' }}>
      <div className="px-6 pt-8 pb-4 flex flex-col items-center gap-3">
        <div className="h-5 rounded-lg w-4/5" style={{ backgroundColor: 'rgba(28,20,16,0.07)' }} />
        <div className="h-5 rounded-lg w-3/5" style={{ backgroundColor: 'rgba(28,20,16,0.07)' }} />
        <div className="h-3 rounded-lg w-2/3 mt-1" style={{ backgroundColor: 'rgba(196,151,58,0.15)' }} />
      </div>
      <GoldDivider />
      <div className="px-6 pt-3 pb-6 flex flex-col gap-2">
        <div className="h-3.5 rounded w-full" style={{ backgroundColor: 'rgba(28,20,16,0.06)' }} />
        <div className="h-3.5 rounded w-5/6" style={{ backgroundColor: 'rgba(28,20,16,0.06)' }} />
        <div className="h-3.5 rounded w-3/4" style={{ backgroundColor: 'rgba(28,20,16,0.06)' }} />
      </div>
    </div>
  )
}

function ResultsScreen({ score, totalAyaat, mode, onNewSession }) {
  const total = score.correct + score.wrong
  const pct = total > 0 ? Math.round((score.correct / total) * 100) : null
  const col = pct === null ? '#C4973A' : pct >= 70 ? '#4A6741' : pct >= 40 ? '#C4973A' : '#6B1F2A'
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ animation: 'fadeInUp 0.35s ease both' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(107,31,42,0.08)' }}>
        <span style={{ fontSize: '38px' }}>🎓</span>
      </div>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1410' }}>Session Complete</h2>
      <p className="text-sm mb-8" style={{ color: 'rgba(28,20,16,0.45)' }}>{totalAyaat} ayaat · {mode}</p>
      {pct !== null ? (
        <>
          <div className="text-6xl font-bold mb-1" style={{ color: col }}>{pct}%</div>
          <p className="text-xs uppercase tracking-widest mb-8" style={{ color: 'rgba(28,20,16,0.38)' }}>Score</p>
          <div className="flex items-center gap-10 mb-10 px-8 py-4 rounded-2xl" style={{ backgroundColor: 'rgba(28,20,16,0.04)' }}>
            <div>
              <p className="text-3xl font-bold" style={{ color: '#4A6741' }}>{score.correct}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.45)' }}>Correct</p>
            </div>
            <div className="w-px h-10" style={{ backgroundColor: 'rgba(28,20,16,0.1)' }} />
            <div>
              <p className="text-3xl font-bold" style={{ color: '#6B1F2A' }}>{score.wrong}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.45)' }}>Wrong</p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm mb-10" style={{ color: 'rgba(28,20,16,0.45)' }}>No quiz questions in this session.</p>
      )}
      <button onClick={onNewSession} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
        New Session
      </button>
    </div>
  )
}

// ─── TILAWAH MODE ─────────────────────────────────────────────────────────────

function AyahBlock({ verse, displayMode }) {
  return (
    <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(28,20,16,0.05)' }}>
      <div className="flex justify-end mb-3">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0"
          style={{ backgroundColor: 'rgba(107,31,42,0.08)', color: '#6B1F2A', fontSize: '10px' }}
        >
          {verse.verse_number}
        </span>
      </div>
      {(displayMode === 'both' || displayMode === 'arabic') && (
        <>
          <p dir="rtl" style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '28px', lineHeight: '2.3', color: '#1C1410', textAlign: 'right', marginBottom: '10px' }}>
            {verse.text_uthmani}
          </p>
          <p style={{ fontStyle: 'italic', fontSize: '13px', color: '#C4973A', lineHeight: '1.7', marginBottom: '8px' }}>
            {verse.transliteration}
          </p>
        </>
      )}
      {(displayMode === 'both' || displayMode === 'english') && (
        <p style={{ fontSize: '14px', color: 'rgba(28,20,16,0.65)', lineHeight: '1.8' }}>
          {verse.translations[0].text}
        </p>
      )}
    </div>
  )
}

function TilawahView({ verses, surahName, onComplete, displayMode, setDisplayMode }) {
  const scrollRef = useRef(null)
  const [pct, setPct] = useState(0)

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 100)
  }

  return (
    <>
      <ProgressBar pct={pct} />
      <DisplayToggle displayMode={displayMode} setDisplayMode={setDisplayMode} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={onScroll}>
        <p className="text-center text-xs uppercase tracking-widest py-4" style={{ color: 'rgba(28,20,16,0.32)' }}>
          {surahName}
        </p>
        {verses.map(v => <AyahBlock key={v.id} verse={v} displayMode={displayMode} />)}
        <div className="px-4 pt-6 pb-12">
          <button onClick={onComplete} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
            Session Complete ✓
          </button>
        </div>
      </div>
    </>
  )
}

// ─── HIFZ MODE ────────────────────────────────────────────────────────────────

function HifzCard({ verse, onResult, onNext, animDir, isLast, displayMode }) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null)
  const blankData = generateBlank(verse.translations[0].text)

  const check = () => {
    if (!blankData || status) return
    const correct = input.trim().toLowerCase() === blankData.answer
    setStatus(correct ? 'correct' : 'wrong')
    onResult(correct)
  }

  return (
    <div className="mx-4 rounded-3xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', boxShadow: '0 12px 40px rgba(28,20,16,0.13)', animation: `${animDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
      <div className="px-6 pt-5 pb-2">
        <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(74,103,65,0.1)', color: '#4A6741' }}>
          Hifz · Fill in the blank
        </span>
      </div>
      {(displayMode === 'both' || displayMode === 'arabic') && (
        <>
          <div className="px-6 py-3 text-center" dir="rtl">
            <p style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '24px', lineHeight: '2.1', color: '#1C1410' }}>
              {verse.text_uthmani}
            </p>
          </div>
          <p className="px-6 pb-2 text-center" style={{ fontStyle: 'italic', fontSize: '12px', color: '#C4973A' }}>
            {verse.transliteration}
          </p>
        </>
      )}
      <GoldDivider />
      <div className="px-6 pt-4 pb-3">
        <p style={{ fontSize: '15px', color: 'rgba(28,20,16,0.78)', lineHeight: '1.9' }}>
          {blankData ? blankData.blank : verse.translations[0].text}
        </p>
      </div>
      {!status && blankData && (
        <div className="px-6 pb-5">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="Type the missing word…"
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: '1px solid rgba(196,151,58,0.4)', backgroundColor: 'rgba(196,151,58,0.04)', color: '#1C1410' }}
          />
          <button onClick={check} disabled={!input.trim()} className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: input.trim() ? '#4A6741' : 'rgba(74,103,65,0.3)', color: '#FAF7F2' }}>
            Check Answer
          </button>
        </div>
      )}
      {status && (
        <div className="px-6 pb-5">
          <div className="px-4 py-3 rounded-xl text-sm mb-3" style={{ backgroundColor: status === 'correct' ? 'rgba(74,103,65,0.1)' : 'rgba(160,40,40,0.08)', color: status === 'correct' ? '#4A6741' : '#8B2020' }}>
            {status === 'correct' ? '✓ Correct!' : `✗ The answer was "${blankData?.display}"`}
          </div>
          <button onClick={onNext} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
            {isLast ? 'Finish ✓' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── TAFSEER MODE CARDS ───────────────────────────────────────────────────────

function TafseerCard({ item, surahName, animDir, displayMode, tafseerName }) {
  const { verse } = item
  const translation = cleanText(verse.translations[0].text)
  const tafseer = verse.tafseer ? cleanText(verse.tafseer) : null
  const [sNum, vNum] = verse.verse_key.split(':')

  const [noteData, setNoteData] = useState(() => getNoteData(sNum, vNum))
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteInput, setNoteInput] = useState(() => getNoteData(sNum, vNum).note)

  const toggleHighlight = () => {
    const updated = { ...noteData, highlighted: !noteData.highlighted }
    setNoteData(updated)
    saveNoteData(sNum, vNum, updated)
  }

  const handleNoteBlur = () => {
    const updated = { ...noteData, note: noteInput }
    setNoteData(updated)
    saveNoteData(sNum, vNum, updated)
  }

  return (
    <div
      className="mx-4 rounded-3xl overflow-hidden"
      style={{
        backgroundColor: '#FFFCF7',
        boxShadow: noteData.highlighted
          ? '0 12px 40px rgba(196,151,58,0.22), 0 0 0 2px #C4973A'
          : '0 12px 40px rgba(28,20,16,0.13), 0 2px 8px rgba(28,20,16,0.06)',
        animation: `${animDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both`,
      }}
    >
      {/* Arabic + transliteration */}
      {(displayMode === 'both' || displayMode === 'arabic') && (
        <>
          <div className="px-6 pt-8 pb-2" dir="rtl">
            <p style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '26px', lineHeight: '2.3', color: '#1C1410', textAlign: 'center' }}>
              {verse.text_uthmani}
            </p>
          </div>
          <p className="px-6 pb-3 text-center" style={{ fontStyle: 'italic', fontSize: '12px', color: '#C4973A', lineHeight: '1.6' }}>
            {verse.transliteration}
          </p>
        </>
      )}
      {/* Top padding when Arabic hidden */}
      {displayMode === 'english' && <div className="pt-6" />}

      {/* Translation */}
      {(displayMode === 'both' || displayMode === 'english') && (
        <div className="px-6 pb-4">
          <p style={{ fontSize: '14px', color: 'rgba(28,20,16,0.72)', lineHeight: '1.75' }}>{translation}</p>
        </div>
      )}

      {/* Tafseer — full text, card scrolls if long */}
      {tafseer ? (
        <>
          <GoldDivider />
          <div className="px-6 pt-3 pb-5">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C4973A' }}>
              Tafseer · {tafseerName}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(28,20,16,0.65)', lineHeight: '1.8' }}>{tafseer}</p>
          </div>
        </>
      ) : (
        <div className="px-6 pb-4">
          <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(196,151,58,0.07)', color: 'rgba(28,20,16,0.4)' }}>
            Tafseer loading…
          </div>
        </div>
      )}

      {/* Notes textarea */}
      {noteOpen && (
        <div className="px-6 pb-4">
          <textarea
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add a personal note…"
            rows={3}
            className="w-full px-3 py-2 rounded-xl outline-none resize-none"
            style={{
              border: '1px solid rgba(196,151,58,0.4)',
              backgroundColor: 'rgba(196,151,58,0.04)',
              color: '#1C1410',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid rgba(196,151,58,0.15)' }}>
        <span className="text-xs font-medium" style={{ color: '#C4973A' }}>{surahName} · {verse.verse_key}</span>
        <div className="flex items-center gap-3">
          {/* Bookmark / highlight */}
          <button
            onClick={toggleHighlight}
            title="Bookmark"
            style={{ color: noteData.highlighted ? '#C4973A' : 'rgba(28,20,16,0.32)' }}
          >
            <BookmarkIco filled={noteData.highlighted} />
          </button>
          {/* Notes with dot indicator */}
          <button
            onClick={() => setNoteOpen(o => !o)}
            title="Notes"
            style={{ position: 'relative', display: 'inline-flex', color: noteData.note ? '#6B1F2A' : 'rgba(28,20,16,0.32)' }}
          >
            <PencilIco />
            {noteData.note && !noteOpen && (
              <span
                style={{
                  position: 'absolute', top: '-2px', right: '-3px',
                  width: '6px', height: '6px',
                  borderRadius: '50%', backgroundColor: '#6B1F2A',
                  display: 'block',
                }}
              />
            )}
          </button>
          <a
            href={`https://quran.com/${sNum}/${vNum}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'rgba(28,20,16,0.32)' }}
            onClick={e => e.stopPropagation()}
          >
            <ExtLink />
          </a>
        </div>
      </div>
    </div>
  )
}

function QuizCard({ item, quizState, onAnswer, animDir }) {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', boxShadow: '0 12px 40px rgba(28,20,16,0.13)', animation: `${animDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
      <div className="px-6 pt-5 pb-1">
        <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(196,151,58,0.12)', color: '#C4973A' }}>Quick Check</span>
      </div>
      <div className="px-6 py-3 text-center" dir="rtl">
        <p style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '22px', lineHeight: '2.1', color: '#1C1410' }}>{item.arabic}</p>
      </div>
      {item.translation && (
        <div className="px-6 pb-2">
          <p style={{ fontSize: '12px', color: 'rgba(28,20,16,0.45)', fontStyle: 'italic', lineHeight: '1.6' }}>
            "{item.translation}"
          </p>
        </div>
      )}
      <div className="px-6 pb-3 pt-1">
        <p className="text-sm font-semibold" style={{ color: '#1C1410' }}>{item.question}</p>
      </div>
      <div className="px-4 pb-5 flex flex-col gap-2">
        {item.options.map((opt, i) => {
          const answered = quizState?.answered
          const selected = quizState?.selectedIndex === i
          let bg = 'rgba(28,20,16,0.04)', border = 'rgba(28,20,16,0.1)', color = 'rgba(28,20,16,0.8)'
          if (answered && opt.correct) { bg = 'rgba(196,151,58,0.12)'; border = '#C4973A'; color = '#7A5518' }
          else if (answered && selected && !opt.correct) { bg = 'rgba(160,40,40,0.07)'; border = 'rgba(160,40,40,0.35)'; color = '#8B2020' }
          else if (answered) { color = 'rgba(28,20,16,0.35)' }
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(i)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm leading-snug transition-all"
              style={{ backgroundColor: bg, border: `1px solid ${border}`, color, cursor: answered ? 'default' : 'pointer' }}
            >
              <span className="inline-block w-5 text-center font-bold mr-2 text-xs" style={{ opacity: 0.45 }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function QuranSessionPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { surah, ayaatCount, mode, tafseerOption } = state || {}
  const tafseerName = tafseerOption?.name || 'Ibn Kathir'
  const tafseerId   = tafseerOption?.id  || 169

  const [verses, setVerses]             = useState([])
  const [deck, setDeck]                 = useState([])
  const [totalAyaat, setTotalAyaat]     = useState(0)
  const [loading, setLoading]           = useState(true)
  const [loadingMsg, setLoadingMsg]     = useState('Loading verses…')
  const [error, setError]               = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [enterDir, setEnterDir]         = useState('right')
  const [quizState, setQuizState]       = useState(null)
  const [score, setScore]               = useState({ correct: 0, wrong: 0 })
  const [showResults, setShowResults]   = useState(false)
  const [displayMode, setDisplayMode]   = useState('both')

  const touchStartX = useRef(null)
  const goNextRef   = useRef(null)
  const goPrevRef   = useRef(null)

  useEffect(() => { if (!surah) navigate('/quran', { replace: true }) }, [])

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!surah) return

    const loader = verseModules[`../data/verses/${surah.id}.json`]
    if (!loader) { setError(true); setLoading(false); return }

    loader().then(async mod => {
      const all    = mod.default.verses
      const sliced = ayaatCount === 'All' ? all : all.slice(0, ayaatCount)
      setTotalAyaat(sliced.length)

      if (mode === 'Tafseer') {
        setLoadingMsg('Loading tafseer…')
        const tafseerLoader = verseModules[`../data/verses/${surah.id}_${tafseerId}.json`]
        const tafseerMap = tafseerLoader ? (await tafseerLoader()).default : {}
        const enriched = sliced.map(v => ({
          ...v,
          tafseer: tafseerMap[String(v.verse_number)] || null,
        }))
        setVerses(enriched)
        setDeck(buildDeck(enriched, tafseerName))
      } else if (mode === 'Hifz') {
        setVerses(sliced)
        setDeck(sliced.map(v => ({ type: 'hifz', verse: v })))
      } else {
        setVerses(sliced)
      }

      setLoading(false)
    }).catch(() => { setError(true); setLoading(false) })
  }, [])

  // ── Keyboard nav ─────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowRight') goNextRef.current?.()
      if (e.key === 'ArrowLeft')  goPrevRef.current?.()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const goNext = () => {
    if (currentIndex >= deck.length - 1) { setShowResults(true); return }
    setEnterDir('right'); setCurrentIndex(i => i + 1); setQuizState(null)
  }
  const goPrev = () => {
    if (currentIndex === 0) return
    setEnterDir('left'); setCurrentIndex(i => i - 1); setQuizState(null)
  }
  goNextRef.current = goNext
  goPrevRef.current = goPrev

  const handleQuizAnswer = idx => {
    if (quizState?.answered) return
    const correct = deck[currentIndex].options[idx].correct
    setQuizState({ selectedIndex: idx, answered: true })
    setScore(s => correct ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 })
  }

  const handleHifzResult = correct => {
    setScore(s => correct ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 })
  }

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 48) diff > 0 ? goNext() : goPrev()
    touchStartX.current = null
  }

  if (!surah) return null

  const currentCard = deck[currentIndex]
  const deckPct     = deck.length > 1 ? Math.round((currentIndex / (deck.length - 1)) * 100) : 0
  const isLast      = currentIndex === deck.length - 1

  const headerSub = loading        ? loadingMsg
    : showResults                  ? 'Complete'
    : mode === 'Tilawah'           ? 'Reading Mode'
    : currentCard?.type === 'quiz' ? '⚡ Quiz'
    : `Card ${currentIndex + 1} of ${deck.length}`

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#FAF7F2' }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: '#6B1F2A' }} className="relative flex-shrink-0">
        <button onClick={() => navigate('/quran')} className="absolute left-3 inset-y-0 flex items-center px-2" style={{ color: '#FAF7F2' }} aria-label="Back">
          <BackArrow />
        </button>
        <div className="py-4 px-14 text-center">
          <h1 className="text-base font-semibold tracking-wide" style={{ color: '#FAF7F2' }}>{surah.name_simple}</h1>
          <p className="text-xs mt-0.5" style={{ color: currentCard?.type === 'quiz' ? '#C4973A' : 'rgba(250,247,242,0.52)' }}>
            {headerSub}
          </p>
        </div>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex-1 flex flex-col">
          <ProgressBar pct={0} />
          <div className="flex-1 flex flex-col justify-center py-6">
            <CardSkeleton />
            <p className="text-center text-xs mt-4" style={{ color: 'rgba(28,20,16,0.35)' }}>{loadingMsg}</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm" style={{ color: 'rgba(28,20,16,0.45)' }}>Could not load verses.</p>
          <button onClick={() => navigate('/quran')} className="px-5 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>Go back</button>
        </div>
      )}

      {/* ── TILAWAH ── */}
      {!loading && !error && mode === 'Tilawah' && !showResults && (
        <TilawahView
          verses={verses}
          surahName={surah.name_simple}
          onComplete={() => setShowResults(true)}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
        />
      )}

      {/* ── HIFZ + TAFSEER (card modes) ── */}
      {!loading && !error && mode !== 'Tilawah' && !showResults && currentCard && (
        <div className="flex-1 flex flex-col overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <ProgressBar pct={deckPct} />
          <DisplayToggle displayMode={displayMode} setDisplayMode={setDisplayMode} />

          {/* Scrollable card area */}
          <div className="flex-1 overflow-y-auto py-4 select-none">
            {currentCard.type === 'hifz' && (
              <HifzCard
                key={currentIndex}
                verse={currentCard.verse}
                onResult={handleHifzResult}
                onNext={goNext}
                animDir={enterDir}
                isLast={isLast}
                displayMode={displayMode}
              />
            )}
            {currentCard.type === 'verse' && (
              <TafseerCard
                key={currentIndex}
                item={currentCard}
                surahName={surah.name_simple}
                animDir={enterDir}
                displayMode={displayMode}
                tafseerName={tafseerName}
              />
            )}
            {currentCard.type === 'quiz' && (
              <QuizCard
                key={currentIndex}
                item={currentCard}
                quizState={quizState}
                onAnswer={handleQuizAnswer}
                animDir={enterDir}
              />
            )}
          </div>

          {/* Nav buttons (Tafseer only — Hifz has its own Next inside the card) */}
          {mode === 'Tafseer' && (
            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-6 pt-2" style={{ borderTop: '1px solid rgba(28,20,16,0.05)' }}>
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ opacity: currentIndex === 0 ? 0.28 : 1, backgroundColor: 'rgba(107,31,42,0.08)', color: '#6B1F2A' }}
              >
                ← Prev
              </button>
              <p className="text-xs" style={{ color: 'rgba(28,20,16,0.28)' }}>swipe or ← →</p>
              <button onClick={goNext} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
                {isLast ? 'Finish ✓' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {showResults && (
        <ResultsScreen score={score} totalAyaat={totalAyaat} mode={mode} onNewSession={() => navigate('/quran')} />
      )}

    </div>
  )
}
