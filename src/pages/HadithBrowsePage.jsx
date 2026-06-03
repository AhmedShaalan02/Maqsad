import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import HadithCard from '../components/HadithCard'
import { getItemsInCollection } from '../utils/hadithStorage'

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cleanHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const COLLECTION_LABELS = {
  bukhari: 'Bukhari',
  muslim: 'Muslim',
  tirmidhi: 'Tirmidhi',
  abudawud: 'Abu Dawud',
  ibnmajah: 'Ibn Majah',
  nasai: "Nasa'i",
}

function parseHadithBody(raw) {
  const text = cleanHtml(raw)
  const m1 = text.match(/^Narrated\s+(.+?):\s*(.+)$/s)
  if (m1) return { narrator: m1[1].trim(), text: m1[2].trim() }
  const m2 = text.match(/^It was narrated (?:from|that)\s+(.+?):\s*(.+)$/s)
  if (m2) return { narrator: m2[1].trim(), text: m2[2].trim() }
  const m3 = text.match(/^(.+?)\s+(?:said|reported)\s*:\s*(.+)$/s)
  if (m3 && m3[1].split(' ').length <= 5) return { narrator: m3[1].trim(), text: m3[2].trim() }
  return { narrator: null, text }
}

function parseHadith(raw) {
  const en = Array.isArray(raw.hadith) ? raw.hadith.find(h => h.lang === 'en') : null
  const ar = Array.isArray(raw.hadith) ? raw.hadith.find(h => h.lang === 'ar') : null
  if (!en) return null
  const { narrator, text } = parseHadithBody(en.body)
  if (!text || text.length < 10) return null
  const arabicText = ar ? cleanHtml(ar.body) : null
  const grade = en.grades?.[0]?.grade || null
  const cLabel = COLLECTION_LABELS[raw.collection] || raw.collection
  return {
    id: `${raw.collection}_${raw.hadithNumber}`,
    collection: raw.collection,
    collectionLabel: cLabel,
    bookNumber: raw.bookNumber,
    hadithNumber: raw.hadithNumber,
    chapterTitle: en.chapterTitle || '',
    narrator,
    text,
    arabicText,
    grade,
    reference: `${cLabel} ${raw.bookNumber}:${raw.hadithNumber}`,
    sourceUrl: `https://sunnah.com/${raw.collection}:${raw.hadithNumber}`,
  }
}

function getDisplayMode() {
  try { return localStorage.getItem('maqsad_hadith_display') || 'both' } catch { return 'both' }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
  </svg>
)

const QuizIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const SearchIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

// ── Display Toggle ────────────────────────────────────────────────────────────

function DisplayToggle({ displayMode, setDisplayMode }) {
  const OPTIONS = [
    { id: 'arabic',  label: 'Arabic' },
    { id: 'both',    label: 'Both' },
    { id: 'english', label: 'English' },
  ]
  return (
    <div
      className="flex-shrink-0 flex justify-center gap-1.5 px-4 py-2"
      style={{ borderBottom: '1px solid rgba(28,20,16,0.05)' }}
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => {
            setDisplayMode(opt.id)
            try { localStorage.setItem('maqsad_hadith_display', opt.id) } catch {}
          }}
          className="px-3.5 py-1 rounded-full text-xs font-medium transition-all"
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

// ── Book List ─────────────────────────────────────────────────────────────────

function BookCard({ book, index, onSelect }) {
  const en = book.book?.find(b => b.lang === 'en')
  const name = en?.name || `Book ${book.bookNumber}`
  return (
    <button
      onClick={() => onSelect(book)}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors"
      style={{
        borderBottom: '1px solid rgba(28,20,16,0.055)',
        animation: 'fadeInUp 0.25s ease both',
        animationDelay: `${Math.min(index * 0.03, 0.25)}s`,
      }}
    >
      <div className="flex-shrink-0 w-9 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
        style={{ backgroundColor: 'rgba(107,31,42,0.09)', color: '#6B1F2A' }}>
        {book.bookNumber}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug" style={{ color: '#1C1410' }}>{name}</p>
        {book.numberOfHadith != null && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.4)' }}>{book.numberOfHadith} hadith</p>
        )}
      </div>
      <ChevronRight />
    </button>
  )
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function buildQuizDeck(hadiths) {
  if (hadiths.length < 4) return []
  const narrators = hadiths.map(h => h.narrator).filter(Boolean)
  const uniqueNarrators = new Set(narrators)
  const useNarratorQ = uniqueNarrators.size >= 4

  return hadiths
    .map((h, i) => {
      const others = shuffle(hadiths.filter((_, j) => j !== i))
      if (useNarratorQ && h.narrator) {
        const wrongPool = others.filter(o => o.narrator && o.narrator !== h.narrator).slice(0, 3)
        if (wrongPool.length < 3) return null
        return {
          hadith: h,
          snippet: h.text.slice(0, 130) + (h.text.length > 130 ? '…' : ''),
          question: 'Who narrated this hadith?',
          options: shuffle([
            { text: h.narrator, correct: true },
            ...wrongPool.map(o => ({ text: o.narrator, correct: false })),
          ]),
        }
      }
      const pivot = h.text.indexOf(' ', Math.floor(h.text.length * 0.42))
      const breakAt = pivot > 0 ? pivot : Math.floor(h.text.length * 0.42)
      const snippet = h.text.slice(0, breakAt) + '…'
      const completion = h.text.slice(breakAt + 1).trim()
      if (completion.length < 10) return null
      const wrongs = others.slice(0, 3).map(o => {
        const p2 = o.text.indexOf(' ', Math.floor(o.text.length * 0.42))
        const b2 = p2 > 0 ? p2 : Math.floor(o.text.length * 0.42)
        return { text: o.text.slice(b2 + 1).trim().slice(0, 140), correct: false }
      })
      return {
        hadith: h,
        snippet,
        question: 'How does this hadith continue?',
        options: shuffle([
          { text: completion.slice(0, 140), correct: true },
          ...wrongs,
        ]),
      }
    })
    .filter(Boolean)
}

function gradeStyle(grade) {
  const g = (grade || '').toLowerCase()
  if (g.includes('sahih'))
    return { bg: 'rgba(74,103,65,0.14)', color: '#2D6A4F', border: 'rgba(74,103,65,0.28)' }
  if (g.includes('hasan'))
    return { bg: 'rgba(196,151,58,0.14)', color: '#9A7020', border: 'rgba(196,151,58,0.3)' }
  if (g.includes('da') || g.includes('weak'))
    return { bg: 'rgba(139,32,32,0.1)', color: '#8B2020', border: 'rgba(139,32,32,0.22)' }
  return { bg: 'rgba(28,20,16,0.07)', color: 'rgba(28,20,16,0.5)', border: 'rgba(28,20,16,0.12)' }
}

function QuizCard({ card, result, onAnswer, animDir }) {
  const gs = gradeStyle(card.hadith.grade)
  const displayGrade = card.hadith.grade || (['bukhari', 'muslim'].includes(card.hadith.collection) ? 'Sahih' : null)
  return (
    <div
      className="mx-4 rounded-3xl overflow-hidden"
      style={{
        backgroundColor: '#FFFCF7',
        boxShadow: '0 12px 40px rgba(28,20,16,0.13)',
        animation: `${animDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both`,
      }}
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          {displayGrade && (
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: gs.bg, color: gs.color, border: `1px solid ${gs.border}` }}>
              {displayGrade}
            </span>
          )}
          <span className="text-xs font-mono ml-auto" style={{ color: 'rgba(28,20,16,0.32)' }}>
            {card.hadith.reference}
          </span>
        </div>
        <div className="rounded-xl p-3 mb-3"
          style={{ backgroundColor: 'rgba(107,31,42,0.04)', border: '1px solid rgba(107,31,42,0.1)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#1C1410', fontStyle: 'italic' }}>
            "{card.snippet}"
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(28,20,16,0.4)' }}>
          {card.question}
        </p>
      </div>
      <div className="px-5 pb-5 flex flex-col gap-2">
        {card.options.map((opt, i) => {
          const answered = result !== null
          const isSelected = answered && result === i
          const isCorrect = opt.correct
          let bg = 'rgba(28,20,16,0.04)'
          let color = 'rgba(28,20,16,0.75)'
          let border = '1px solid rgba(28,20,16,0.08)'
          if (answered) {
            if (isSelected && isCorrect)  { bg = 'rgba(74,103,65,0.12)';  color = '#4A6741'; border = '1px solid rgba(74,103,65,0.3)' }
            if (isSelected && !isCorrect) { bg = 'rgba(139,32,32,0.09)'; color = '#8B2020'; border = '1px solid rgba(139,32,32,0.22)' }
            if (!isSelected && isCorrect) { bg = 'rgba(74,103,65,0.07)'; color = '#4A6741'; border = '1px solid rgba(74,103,65,0.18)' }
          }
          return (
            <button key={i} onClick={() => !answered && onAnswer(i)}
              className="text-left px-4 py-3 rounded-xl text-sm transition-all leading-relaxed"
              style={{ backgroundColor: bg, color, border }}>
              <span className="font-bold mr-2" style={{ opacity: 0.45 }}>{String.fromCharCode(65 + i)}.</span>
              {opt.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuizResults({ deck, answers, name, onExit }) {
  const correct = answers.filter((a, i) => a !== null && deck[i]?.options[a]?.correct).length
  const total = answers.filter(a => a !== null).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : null
  const col = pct === null ? '#C4973A' : pct >= 70 ? '#4A6741' : pct >= 40 ? '#C4973A' : '#6B1F2A'
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ animation: 'fadeInUp 0.35s ease both' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(107,31,42,0.08)' }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1410' }}>Quiz Complete</h2>
      <p className="text-sm mb-8" style={{ color: 'rgba(28,20,16,0.45)' }}>{deck.length} questions · {name}</p>
      {pct !== null && (
        <>
          <div className="text-6xl font-bold mb-1" style={{ color: col }}>{pct}%</div>
          <p className="text-xs uppercase tracking-widest mb-8" style={{ color: 'rgba(28,20,16,0.38)' }}>Score</p>
          <div className="flex items-center gap-10 mb-10 px-8 py-4 rounded-2xl" style={{ backgroundColor: 'rgba(28,20,16,0.04)' }}>
            <div>
              <p className="text-3xl font-bold" style={{ color: '#4A6741' }}>{correct}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.45)' }}>Correct</p>
            </div>
            <div className="w-px h-10" style={{ backgroundColor: 'rgba(28,20,16,0.1)' }} />
            <div>
              <p className="text-3xl font-bold" style={{ color: '#6B1F2A' }}>{total - correct}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.45)' }}>Wrong</p>
            </div>
          </div>
        </>
      )}
      <button onClick={onExit} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
        Back to Hadiths
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HadithBrowsePage() {
  const navigate = useNavigate()
  const { state } = useLocation()

  // Book-selection (for "By Collection")
  const [books, setBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)

  // Hadith list
  const [hadiths, setHadiths] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Display
  const [displayMode, setDisplayMode] = useState(getDisplayMode)
  const [search, setSearch] = useState('')

  // Quiz
  const [quizMode, setQuizMode] = useState(false)
  const [quizDeck, setQuizDeck] = useState([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [animDir, setAnimDir] = useState('right')

  const touchStartRef = useRef(null)

  const isCollection = state?.type === 'collection'
  const isSaved = state?.type === 'saved'
  const showBookList = isCollection && selectedBook === null

  // Fetch books
  const fetchBooks = useCallback(async () => {
    if (!state || !isCollection) return
    setBooksLoading(true)
    setBooksError(null)
    try {
      const res = await fetch(`/api/sunnah/v1/collections/${state.id}/books?limit=100`)
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const json = await res.json()
      setBooks(json.data || [])
    } catch (e) {
      setBooksError(e.message)
    } finally {
      setBooksLoading(false)
    }
  }, [state])

  // Fetch hadiths
  const doFetch = useCallback(async (pageNum, append = false) => {
    if (!state) return
    // Saved collections load from localStorage
    if (isSaved) {
      const items = getItemsInCollection(state.collectionId)
      setHadiths(items.map(i => i.hadith))
      setHasMore(false)
      return
    }
    let collectionId, bookNum
    if (isCollection) {
      if (!selectedBook) return
      collectionId = state.id
      bookNum = selectedBook.bookNumber
    } else {
      collectionId = state.collection
      bookNum = state.book
    }
    const url = `/api/sunnah/v1/collections/${collectionId}/books/${bookNum}/hadiths?limit=20&page=${pageNum}`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const json = await res.json()
      const rawList = Array.isArray(json.data) ? json.data : (json.hadiths || [])
      const parsed = rawList.map(parseHadith).filter(Boolean)
      setHadiths(prev => append ? [...prev, ...parsed] : parsed)
      setHasMore(json.next != null && parsed.length > 0)
    } catch (e) {
      setError(e.message)
    }
  }, [state, selectedBook])

  useEffect(() => {
    if (!state) { navigate('/hadith', { replace: true }); return }
    if (isCollection) {
      fetchBooks()
    } else {
      setLoading(true)
      doFetch(1).finally(() => setLoading(false))
    }
  }, [state])

  useEffect(() => {
    if (!selectedBook) return
    setHadiths([])
    setPage(1)
    setError(null)
    setSearch('')
    setLoading(true)
    doFetch(1).finally(() => setLoading(false))
  }, [selectedBook])

  if (!state) return null
  const { name, arabicName } = state

  const loadMore = async () => {
    setLoadingMore(true)
    const next = page + 1
    await doFetch(next, true)
    setPage(next)
    setLoadingMore(false)
  }

  const enterQuiz = () => {
    const deck = buildQuizDeck(displayedHadiths)
    if (!deck.length) return
    setQuizDeck(deck)
    setQuizIndex(0)
    setQuizAnswers(new Array(deck.length).fill(null))
    setShowResults(false)
    setAnimDir('right')
    setQuizMode(true)
  }

  const exitQuiz = () => { setQuizMode(false); setShowResults(false) }

  const goNext = () => {
    if (quizAnswers[quizIndex] === null) return
    if (quizIndex + 1 >= quizDeck.length) setShowResults(true)
    else { setAnimDir('right'); setQuizIndex(i => i + 1) }
  }

  const goPrev = () => {
    if (quizIndex > 0) { setAnimDir('left'); setQuizIndex(i => i - 1) }
  }

  const onTouchStart = e => { touchStartRef.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    if (touchStartRef.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current
    touchStartRef.current = null
    if (dx < -48 && quizAnswers[quizIndex] !== null) goNext()
    if (dx > 48 && quizIndex > 0) goPrev()
  }

  // Search filter
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displayedHadiths = useMemo(() => {
    if (!search.trim()) return hadiths
    const q = search.toLowerCase()
    return hadiths.filter(h =>
      h.text?.toLowerCase().includes(q) ||
      (h.narrator || '').toLowerCase().includes(q) ||
      (h.chapterTitle || '').toLowerCase().includes(q)
    )
  }, [hadiths, search])

  const quizProgress = quizDeck.length > 0
    ? ((quizIndex + (quizAnswers[quizIndex] !== null ? 1 : 0)) / quizDeck.length) * 100
    : 0

  const headerSubtitle = showBookList
    ? 'Select a Book'
    : selectedBook
      ? (selectedBook.book?.find(b => b.lang === 'en')?.name || `Book ${selectedBook.bookNumber}`)
      : arabicName

  const backAction = () => {
    if (quizMode) { exitQuiz(); return }
    if (selectedBook) { setSelectedBook(null); setHadiths([]); setSearch(''); return }
    navigate('/hadith')
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#FAF7F2' }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: '#6B1F2A' }} className="relative flex-shrink-0">
        <button onClick={backAction} className="absolute left-3 inset-y-0 flex items-center px-2"
          style={{ color: '#FAF7F2' }} aria-label="Back">
          <BackArrow />
        </button>
        <div className="py-4 px-14 text-center">
          <h1 className="text-base font-bold tracking-wide leading-snug" style={{ color: '#FAF7F2' }}>
            {quizMode ? 'Quiz Mode' : name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#C4973A', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {quizMode ? 'اختبار' : headerSubtitle}
          </p>
        </div>
        {!quizMode && !showBookList && hadiths.length >= 4 && (
          <button onClick={enterQuiz} className="absolute right-3 inset-y-0 flex items-center px-3"
            style={{ color: '#C4973A' }} aria-label="Quiz mode">
            <QuizIcon />
          </button>
        )}
      </header>

      {/* ── Quiz Mode ── */}
      {quizMode ? (
        <div className="flex-1 flex flex-col py-4 gap-4 overflow-hidden"
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="flex-shrink-0 mx-4 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(196,151,58,0.18)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${quizProgress}%`, backgroundColor: '#C4973A' }} />
          </div>
          {showResults ? (
            <QuizResults deck={quizDeck} answers={quizAnswers} name={name} onExit={exitQuiz} />
          ) : (
            <>
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                {quizDeck[quizIndex] && (
                  <QuizCard key={quizIndex} card={quizDeck[quizIndex]} result={quizAnswers[quizIndex]}
                    onAnswer={idx => setQuizAnswers(prev => { const n = [...prev]; n[quizIndex] = idx; return n })}
                    animDir={animDir} />
                )}
              </div>
              <div className="flex-shrink-0 flex gap-3 px-4">
                <button onClick={goPrev} disabled={quizIndex === 0} className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all"
                  style={{ backgroundColor: quizIndex > 0 ? 'rgba(107,31,42,0.1)' : 'rgba(107,31,42,0.04)', color: quizIndex > 0 ? '#6B1F2A' : 'rgba(28,20,16,0.2)' }}>
                  ← Prev
                </button>
                <button onClick={goNext} disabled={quizAnswers[quizIndex] === null} className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all"
                  style={{ backgroundColor: quizAnswers[quizIndex] !== null ? '#6B1F2A' : 'rgba(107,31,42,0.25)', color: quizAnswers[quizIndex] !== null ? '#FAF7F2' : 'rgba(250,247,242,0.5)' }}>
                  {quizIndex + 1 >= quizDeck.length ? 'Finish ✓' : 'Next →'}
                </button>
              </div>
            </>
          )}
        </div>

      ) : showBookList ? (
        /* ── Book List ── */
        <div className="flex-1 overflow-y-auto">
          {booksLoading ? (
            <div className="flex flex-col gap-0 pt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 mx-4 mb-2 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(28,20,16,0.05)' }} />
              ))}
            </div>
          ) : booksError ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <p className="text-sm font-semibold mb-2" style={{ color: '#6B1F2A' }}>Could not load books</p>
              <p className="text-sm mb-4" style={{ color: 'rgba(28,20,16,0.45)' }}>{booksError}</p>
              <button onClick={fetchBooks} className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>Retry</button>
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFCF7', margin: '16px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(28,20,16,0.07)', overflow: 'hidden' }}>
              {books.map((book, i) => (
                <BookCard key={book.bookNumber} book={book} index={i} onSelect={setSelectedBook} />
              ))}
            </div>
          )}
        </div>

      ) : (
        /* ── Hadith List ── */
        <>
          {/* Display mode toggle + search */}
          <DisplayToggle displayMode={displayMode} setDisplayMode={setDisplayMode} />

          {hadiths.length > 4 && (
            <div className="flex-shrink-0 px-4 py-2"
              style={{ borderBottom: '1px solid rgba(28,20,16,0.05)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: 'rgba(28,20,16,0.05)', border: '1px solid rgba(28,20,16,0.07)' }}>
                <span style={{ color: 'rgba(28,20,16,0.4)' }}><SearchIco /></span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search text or narrator…"
                  className="flex-1 text-xs bg-transparent outline-none"
                  style={{ color: '#1C1410' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ color: 'rgba(28,20,16,0.35)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse"
                    style={{ backgroundColor: '#FFFCF7', height: '200px', boxShadow: '0 2px 12px rgba(28,20,16,0.07)' }} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <p className="text-base font-semibold mb-2" style={{ color: '#6B1F2A' }}>Could not load hadiths</p>
                <p className="text-sm mb-5" style={{ color: 'rgba(28,20,16,0.45)' }}>{error}</p>
                <button onClick={() => { setError(null); setLoading(true); doFetch(1).finally(() => setLoading(false)) }}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
                  Retry
                </button>
              </div>
            ) : displayedHadiths.length === 0 && hadiths.length === 0 ? (
              <div className="flex items-center justify-center py-24 px-6 text-center">
                <p className="text-sm" style={{ color: 'rgba(28,20,16,0.4)' }}>No hadiths found.</p>
              </div>
            ) : displayedHadiths.length === 0 ? (
              <div className="flex items-center justify-center py-16 px-6 text-center">
                <p className="text-sm" style={{ color: 'rgba(28,20,16,0.4)' }}>No results for "{search}"</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4">
                {displayedHadiths.map((h, i) => (
                  <HadithCard
                    key={h.id}
                    hadith={h}
                    index={i}
                    allHadiths={displayedHadiths}
                    displayMode={displayMode}
                  />
                ))}
                {!search && hasMore && (
                  <button onClick={loadMore} disabled={loadingMore} className="w-full py-3 rounded-2xl text-sm font-semibold"
                    style={{ backgroundColor: loadingMore ? 'rgba(107,31,42,0.1)' : 'rgba(107,31,42,0.08)', color: '#6B1F2A' }}>
                    {loadingMore ? 'Loading…' : 'Load More'}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
