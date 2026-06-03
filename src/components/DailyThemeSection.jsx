import { useState, useEffect, useRef, useMemo } from 'react'
import dailyThemes from '../data/dailyThemes.json'
import GoldDivider from './GoldDivider'
import { gradeStyle } from '../utils/gradeUtils'
import { COLLECTION_LABELS } from '../data/hadithData'
import { loadCollection } from '../utils/hadithLoader'
import { dateKey } from '../utils/hijriUtils'
import { saveDailyTheme, getDailyTheme, saveReflection } from '../utils/myMaqsadStorage'
import surahData from '../data/surahs.json'

const chapters = surahData.chapters
const verseModules = import.meta.glob('../data/verses/*.json')

const CARD_LABELS = ['Verse', 'Hadith', 'Context', 'Reflect']

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date - start) / (1000 * 60 * 60 * 24))
}

async function loadVerse(surahNum, verseNum) {
  const key = `../data/verses/${surahNum}.json`
  if (!verseModules[key]) return null
  const mod = await verseModules[key]()
  return mod.default.verses.find(v => v.verse_number === verseNum) ?? mod.default.verses[0] ?? null
}

async function loadHadith(collection, number) {
  try {
    const hadiths = await loadCollection(collection)
    if (!hadiths) return null
    return hadiths.find(h => h.hadithNumber === number || h.hadithNumber === String(number)) ?? null
  } catch { return null }
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function buildQuiz(theme, surahNum, hadith) {
  const surah  = chapters.find(c => c.id === surahNum)
  const wrongs3 = arr => arr.sort(() => Math.random() - 0.5).slice(0, 3)
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

  const questions = []

  if (surah) {
    const wrongSurahs = wrongs3(chapters.filter(c => c.id !== surahNum))
    questions.push({
      q: "Which surah contains today's verse?",
      options: shuffle([
        { text: surah.name_simple, correct: true },
        ...wrongSurahs.map(s => ({ text: s.name_simple, correct: false })),
      ]),
    })
  }

  if (hadith?.collection) {
    const wrongCols = wrongs3(
      ['bukhari','muslim','tirmidhi','abudawud','ibnmajah','nasai'].filter(c => c !== hadith.collection)
    )
    questions.push({
      q: "Which collection contains today's hadith?",
      options: shuffle([
        { text: COLLECTION_LABELS[hadith.collection], correct: true },
        ...wrongCols.map(c => ({ text: COLLECTION_LABELS[c], correct: false })),
      ]),
    })
  }

  if (hadith?.narrator) {
    const pool = ['Abu Hurairah','Aisha','Ibn Umar','Anas ibn Malik','Ibn Abbas','Ali ibn Abi Talib']
    const wrongs = pool
      .filter(n => !n.toLowerCase().includes((hadith.narrator || '').toLowerCase().split(' ')[0]))
      .slice(0, 3)
    if (wrongs.length === 3) {
      questions.push({
        q: "Who narrated today's hadith?",
        options: shuffle([
          { text: hadith.narrator, correct: true },
          ...wrongs.map(w => ({ text: w, correct: false })),
        ]),
      })
    }
  }

  if (theme) {
    const distractors = [
      'Gratitude (Shukr)','Patience (Sabr)','Trust in Allah (Tawakkul)',
      'Sincerity (Ikhlas)','Remembrance (Dhikr)','Justice (Adl)','Knowledge (Ilm)',
    ].filter(t => !t.toLowerCase().includes((theme.split(' ')[0] || '').toLowerCase()))
    if (distractors.length >= 3) {
      questions.push({
        q: "What is today's learning theme?",
        options: shuffle([
          { text: theme, correct: true },
          ...distractors.slice(0, 3).map(w => ({ text: w, correct: false })),
        ]),
      })
    }
  }

  return questions.slice(0, 4)
}

function QuizModal({ questions, onClose }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(new Array(questions.length).fill(null))
  const [done, setDone] = useState(false)

  const answer = i => {
    if (answers[current] !== null) return
    const next = [...answers]; next[current] = i; setAnswers(next)
  }
  const goNext = () => {
    if (current + 1 >= questions.length) setDone(true)
    else setCurrent(c => c + 1)
  }

  const correct = answers.filter((a, i) => a !== null && questions[i]?.options[a]?.correct).length
  const pct = Math.round((correct / questions.length) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(28,20,16,0.55)' }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl px-5 pt-5 pb-10"
        style={{ backgroundColor: '#FAF7F2', animation: 'slideUp 0.3s ease both', maxHeight: '85dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(28,20,16,0.15)' }} />

        {done ? (
          <div className="text-center py-4">
            <div className="text-5xl font-bold mb-2" style={{ color: pct >= 70 ? '#2D6A4F' : pct >= 40 ? '#C4973A' : '#6B1F2A' }}>
              {pct}%
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: '#1C1410' }}>Quiz Complete</p>
            <p className="text-sm mb-6" style={{ color: 'rgba(28,20,16,0.45)' }}>{correct}/{questions.length} correct</p>
            <button onClick={onClose} className="w-full py-3 rounded-2xl font-semibold text-sm"
              style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'rgba(196,151,58,0.18)' }}>
              <div className="h-full rounded-full" style={{
                width: `${((current + (answers[current] !== null ? 1 : 0)) / questions.length) * 100}%`,
                backgroundColor: '#C4973A', transition: 'width 0.4s ease',
              }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(28,20,16,0.38)' }}>
              Question {current + 1} of {questions.length}
            </p>
            <p className="text-base font-semibold mb-4" style={{ color: '#1C1410' }}>{questions[current]?.q}</p>
            <div className="flex flex-col gap-2 mb-4">
              {questions[current]?.options.map((opt, i) => {
                const ans = answers[current]
                const sel = ans === i
                const cor = opt.correct
                let bg = 'rgba(28,20,16,0.05)', color = '#1C1410', border = '1px solid rgba(28,20,16,0.08)'
                if (ans !== null) {
                  if (sel && cor)  { bg = 'rgba(74,103,65,0.12)';  color = '#2D6A4F'; border = '1px solid rgba(74,103,65,0.3)' }
                  if (sel && !cor) { bg = 'rgba(139,32,32,0.1)';   color = '#8B2020'; border = '1px solid rgba(139,32,32,0.25)' }
                  if (!sel && cor) { bg = 'rgba(74,103,65,0.07)';  color = '#2D6A4F'; border = '1px solid rgba(74,103,65,0.2)' }
                }
                return (
                  <button key={i} onClick={() => answer(i)} className="text-left px-4 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: bg, color, border }}>
                    <span className="font-bold mr-2" style={{ opacity: 0.4 }}>{String.fromCharCode(65 + i)}.</span>
                    {opt.text}
                  </button>
                )
              })}
            </div>
            <button onClick={goNext} disabled={answers[current] === null}
              className="w-full py-3 rounded-2xl font-semibold text-sm"
              style={{
                backgroundColor: answers[current] !== null ? '#6B1F2A' : 'rgba(107,31,42,0.2)',
                color: answers[current] !== null ? '#FAF7F2' : 'rgba(250,247,242,0.5)',
              }}>
              {current + 1 >= questions.length ? 'Finish ✓' : 'Next →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function VerseCard({ verse, surahNum }) {
  const surah = chapters.find(c => c.id === surahNum)
  return (
    <div className="h-full flex flex-col px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>
          Quran
        </span>
        <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.35)' }}>
          {verse?.verse_key} · {surah?.name_simple}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {verse?.text_uthmani && (
          <p dir="rtl" className="text-right mb-3"
            style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '22px', lineHeight: '2.2', color: '#1C1410' }}>
            {verse.text_uthmani}
          </p>
        )}
        <GoldDivider />
        {verse?.transliteration && (
          <p className="text-center text-xs mb-2" style={{ color: '#C4973A', fontStyle: 'italic' }}>
            {verse.transliteration}
          </p>
        )}
        <p className="text-sm leading-relaxed" style={{ color: '#1C1410', lineHeight: '1.85' }}>
          {verse?.translations?.[0]?.text ?? 'Loading verse…'}
        </p>
      </div>
    </div>
  )
}

function HadithCardDaily({ hadith }) {
  const gs = gradeStyle(hadith?.grade)
  return (
    <div className="h-full flex flex-col px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        {hadith?.grade ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: gs.bg, color: gs.color, border: `1px solid ${gs.border}` }}>
            {hadith.grade}
          </span>
        ) : <span />}
        <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.35)' }}>
          {hadith?.reference ?? '…'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {hadith?.arabicText && (
          <>
            <p dir="rtl" className="text-right mb-2"
              style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '18px', lineHeight: '2.0', color: '#1C1410' }}>
              {hadith.arabicText.slice(0, 300)}{hadith.arabicText.length > 300 ? '…' : ''}
            </p>
            <GoldDivider />
          </>
        )}
        <p className="text-sm leading-relaxed mb-2" style={{ color: '#1C1410', lineHeight: '1.85' }}>
          {hadith?.text ?? 'Loading hadith…'}
        </p>
        {hadith?.narrator && (
          <p className="text-xs" style={{ color: 'rgba(28,20,16,0.5)', fontStyle: 'italic' }}>
            — Narrated by {hadith.narrator}
          </p>
        )}
      </div>
    </div>
  )
}

function ContextCard({ theme, themeArabic, context }) {
  return (
    <div className="h-full flex flex-col px-5 py-4 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 200">
        <polygon fill="#6B1F2A" points="100,10 120,80 190,80 135,120 155,190 100,150 45,190 65,120 10,80 80,80" />
        <polygon fill="#6B1F2A" points="100,30 115,75 162,75 124,100 139,147 100,122 61,147 76,100 38,75 85,75" />
      </svg>
      <div className="relative flex-1 flex flex-col">
        <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(28,20,16,0.38)' }}>
          Historical Context
        </span>
        <div className="mb-3">
          <h3 className="text-xl font-bold" style={{ color: '#1C1410', fontFamily: 'Georgia, serif' }}>
            {theme ?? '…'}
          </h3>
          {themeArabic && (
            <p className="text-base mt-0.5" style={{ fontFamily: 'Georgia, serif', color: '#C4973A' }}>
              {themeArabic}
            </p>
          )}
        </div>
        <GoldDivider />
        <div className="flex-1 overflow-y-auto mt-2">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(28,20,16,0.75)', lineHeight: '1.85' }}>
            {context ?? 'Loading…'}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReflectionCard({ question, dk }) {
  const stored = getDailyTheme(dk)?.reflection ?? ''
  const [text, setText] = useState(stored)
  const [saved, setSaved] = useState(!!stored)

  const handleSave = () => {
    saveReflection(dk, text)
    setSaved(true)
  }

  return (
    <div className="h-full flex flex-col px-5 py-4">
      <span className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(28,20,16,0.38)' }}>
        Reflect
      </span>
      <div className="rounded-2xl p-4 mb-4"
        style={{ backgroundColor: 'rgba(107,31,42,0.05)', border: '1px solid rgba(107,31,42,0.1)' }}>
        <p className="text-base font-medium leading-relaxed"
          style={{ color: '#1C1410', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          "{question ?? 'Loading question…'}"
        </p>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false) }}
        placeholder="Write your reflection here…"
        rows={4}
        className="flex-1 w-full px-3 py-2 rounded-xl text-sm outline-none resize-none mb-3"
        style={{ border: '1px solid rgba(196,151,58,0.3)', backgroundColor: 'rgba(196,151,58,0.04)', color: '#1C1410' }}
      />
      <button onClick={handleSave} className="w-full py-2.5 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: saved ? 'rgba(74,103,65,0.12)' : '#6B1F2A', color: saved ? '#2D6A4F' : '#FAF7F2' }}>
        {saved ? '✓ Reflection saved' : 'Save reflection'}
      </button>
    </div>
  )
}

// ── Placeholder (empty dailyThemes.json) ──────────────────────────────────────

function PlaceholderCard() {
  return (
    <div className="rounded-2xl overflow-hidden mx-4 relative"
      style={{ backgroundColor: '#FFFCF7', boxShadow: '0 4px 24px rgba(28,20,16,0.12)', minHeight: '240px' }}>
      {/* Islamic star watermark */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]" viewBox="0 0 200 200">
        <polygon fill="#6B1F2A" points="100,10 120,80 190,80 135,120 155,190 100,150 45,190 65,120 10,80 80,80" />
        <polygon fill="#6B1F2A" points="100,30 115,75 162,75 124,100 139,147 100,122 61,147 76,100 38,75 85,75" />
      </svg>

      <div className="relative flex flex-col items-center justify-center text-center px-8 py-10">
        {/* Crescent icon */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(107,31,42,0.07)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>

        <h3 className="text-lg font-bold mb-2" style={{ color: '#1C1410', fontFamily: 'Georgia, serif' }}>
          Daily Themes Coming Soon
        </h3>

        <p className="text-base mb-1" dir="rtl"
          style={{ fontFamily: 'Georgia, serif', color: '#C4973A', lineHeight: '1.8' }}>
          وَمَن يَتَّقِ ٱللَّهَ يَجۡعَل لَّهُۥ مَخۡرَجًا
        </p>
        <p className="text-xs mb-4" style={{ color: 'rgba(28,20,16,0.42)', fontStyle: 'italic' }}>
          "Whoever fears Allah, He will make for him a way out." — 65:2
        </p>

        <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.45)', maxWidth: '240px' }}>
          Curated daily lessons pairing a Quran verse, hadith, historical context, and reflection are being prepared.
        </p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DailyThemeSection() {
  const isEmpty = dailyThemes.length === 0

  const today     = new Date()
  const dk        = dateKey(today)
  const dayIndex  = getDayOfYear(today)
  const themeIndex = isEmpty ? 0 : dayIndex % dailyThemes.length
  const rawTheme  = isEmpty ? null : dailyThemes[themeIndex]

  const [verse,    setVerse]    = useState(null)
  const [hadith,   setHadith]   = useState(null)
  const [loading,  setLoading]  = useState(!isEmpty)

  const [currentCard, setCurrentCard] = useState(0)
  const [dragOffset,  setDragOffset]  = useState(0)
  const [isDragging,  setIsDragging]  = useState(false)
  const [showQuiz,    setShowQuiz]    = useState(false)

  const touchX       = useRef(null)
  const containerRef = useRef(null)

  // Load verse + hadith content, using today's localStorage entry as a cache
  useEffect(() => {
    if (!rawTheme) return

    const cached = getDailyTheme(dk)
    if (cached?.themeIndex === themeIndex && cached.verse && cached.hadith) {
      setVerse(cached.verse)
      setHadith(cached.hadith)
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      loadVerse(rawTheme.surahNumber, rawTheme.ayahNumber),
      loadHadith(rawTheme.hadithCollection, String(rawTheme.hadithNumber)),
    ]).then(([v, h]) => {
      setVerse(v)
      setHadith(h)
      // Save to My Maqsad daily library
      saveDailyTheme(dk, { ...rawTheme, verse: v, hadith: h, generatedAt: dk, themeIndex })
    }).finally(() => setLoading(false))
  }, [themeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Touch swipe handlers
  const onTouchStart = e => { touchX.current = e.touches[0].clientX; setIsDragging(true) }
  const onTouchMove  = e => {
    if (touchX.current == null) return
    setDragOffset(e.touches[0].clientX - touchX.current)
  }
  const onTouchEnd = () => {
    setIsDragging(false)
    if (dragOffset < -60 && currentCard < 3) setCurrentCard(c => c + 1)
    if (dragOffset > 60 && currentCard > 0)  setCurrentCard(c => c - 1)
    setDragOffset(0)
    touchX.current = null
  }

  const cardWidth  = containerRef.current?.offsetWidth ?? 300
  const translateX = -currentCard * 100 + (dragOffset / cardWidth) * 100

  const quiz = useMemo(
    () => rawTheme ? buildQuiz(rawTheme.theme, rawTheme.surahNumber, hadith) : [],
    [rawTheme, hadith]
  )

  // ── Empty state ──
  if (isEmpty) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(28,20,16,0.38)' }}>
            Today's Theme
          </p>
        </div>
        <PlaceholderCard />
      </div>
    )
  }

  return (
    <div className="py-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(28,20,16,0.38)' }}>
            Today's Theme
          </p>
          {rawTheme?.theme && (
            <p className="text-base font-bold mt-0.5" style={{ color: '#1C1410', fontFamily: 'Georgia, serif' }}>
              {rawTheme.theme}
            </p>
          )}
        </div>
        {rawTheme?.themeArabic && (
          <p className="text-sm" style={{ color: '#C4973A', fontFamily: 'Georgia, serif' }}>
            {rawTheme.themeArabic}
          </p>
        )}
      </div>

      {/* Card carousel */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl mx-4"
        style={{ boxShadow: '0 4px 24px rgba(28,20,16,0.12)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center" style={{ backgroundColor: '#FFFCF7' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin mb-3"
              style={{ borderColor: 'rgba(107,31,42,0.2)', borderTopColor: '#6B1F2A' }} />
            <p className="text-sm" style={{ color: 'rgba(28,20,16,0.4)' }}>Loading today's theme…</p>
          </div>
        ) : (
          <div
            className="flex"
            style={{
              backgroundColor: '#FFFCF7',
              transform: `translateX(${translateX}%)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          >
            {[
              <VerseCard    key="v" verse={verse}   surahNum={rawTheme.surahNumber} />,
              <HadithCardDaily key="h" hadith={hadith} />,
              <ContextCard  key="c" theme={rawTheme.theme} themeArabic={rawTheme.themeArabic} context={rawTheme.historicalContext} />,
              <ReflectionCard key="r" question={rawTheme.reflectiveQuestion} dk={dk} />,
            ].map((card, i) => (
              <div key={i} className="flex-shrink-0 w-full" style={{ minHeight: '280px' }}>
                {card}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {!loading && (
        <div className="flex flex-col items-center mt-3 gap-1.5">
          <div className="flex items-center gap-3">
            {CARD_LABELS.map((_, i) => (
              <button key={i} onClick={() => setCurrentCard(i)} aria-label={CARD_LABELS[i]}>
                <div className="rounded-full transition-all duration-200" style={{
                  width:           currentCard === i ? '20px' : '6px',
                  height:          '6px',
                  backgroundColor: currentCard === i ? '#6B1F2A' : 'rgba(107,31,42,0.25)',
                }} />
              </button>
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: 'rgba(28,20,16,0.4)' }}>
            {CARD_LABELS[currentCard]} · {currentCard + 1} of 4
          </p>
        </div>
      )}

      {/* Quiz + Skip */}
      {!loading && quiz.length > 0 && (
        <div className="flex gap-2 px-4 mt-3">
          <button onClick={() => setShowQuiz(true)}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
            ⚡ Today's Quiz
          </button>
          <button className="px-5 py-2.5 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: 'rgba(28,20,16,0.06)', color: 'rgba(28,20,16,0.5)' }}>
            Skip
          </button>
        </div>
      )}

      {showQuiz && <QuizModal questions={quiz} onClose={() => setShowQuiz(false)} />}
    </div>
  )
}
