import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ModuleCard from '../components/ModuleCard'
import SupportStrip from '../components/SupportStrip'
import Highlight from '../components/Highlight'
import { modules } from '../modules/moduleData'
import surahData from '../data/surahs.json'
import { COLLECTIONS, TOPICS, COLLECTION_LABELS } from '../data/hadithData'
import { gradeStyle } from '../utils/gradeUtils'
import GoldDivider from '../components/GoldDivider'
import { getCollections, getItemsInCollection } from '../utils/hadithStorage'
import { getHijriDate, formatGregorian, dateKey } from '../utils/hijriUtils'
import { getIslamicSignificance } from '../data/islamicDates'
import { requestLocation, calcPrayerTimes, getNextPrayer, formatCountdown } from '../utils/prayerUtils'
import { saveDailyTheme, getDailyTheme, saveReflection } from '../utils/myMaqsadStorage'
import { getLibraryCounts } from '../utils/myMaqsadStorage'

const chapters = surahData.chapters
const verseModules = import.meta.glob('../data/verses/*.json')

// ── Constants ─────────────────────────────────────────────────────────────────

const BADGE_COLORS = {
  special:  { bg: 'rgba(196,151,58,0.18)',  color: '#9A7020' },
  eid:      { bg: 'rgba(74,103,65,0.15)',   color: '#2D6A4F' },
  ramadan:  { bg: 'rgba(107,31,42,0.12)',   color: '#6B1F2A' },
  fast:     { bg: 'rgba(28,20,16,0.07)',    color: 'rgba(28,20,16,0.6)' },
  month:    { bg: 'rgba(196,151,58,0.10)',  color: '#C4973A' },
}

const DAILY_SYSTEM_PROMPT = `You are an Islamic learning assistant. Generate a daily themed learning experience. Return ONLY valid JSON with these fields: theme (string), themeArabic (string), surahNumber (number 1-114), ayahNumber (number), hadithCollection (string: bukhari/muslim/tirmidhi/abudawud/ibnmajah/nasai), hadithNumber (number), historicalContext (string, 3-4 sentences about a Seerah story or Islamic history related to the theme), reflectiveQuestion (string). Be aware of the Hijri date provided and make content seasonally appropriate.`

// ── Verse / Hadith loaders ────────────────────────────────────────────────────

async function loadVerse(surahNum, verseNum) {
  const key = `../data/verses/${surahNum}.json`
  if (!verseModules[key]) return null
  const mod = await verseModules[key]()
  return mod.default.verses.find(v => v.verse_number === verseNum) || mod.default.verses[0]
}

async function loadHadith(collection, number) {
  try {
    const res = await fetch(`/api/hadith-lookup?collection=${collection}&number=${number}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

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
  const today = new Date()
  const hijri = getHijriDate(today)
  const significance = hijri ? getIslamicSignificance(hijri.month, hijri.day, today.getDay()) : []

  const [prayerInfo, setPrayerInfo] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [locError, setLocError] = useState(false)

  useEffect(() => {
    requestLocation()
      .then(({ lat, lng }) => {
        const pt = calcPrayerTimes(lat, lng)
        const next = getNextPrayer(pt)
        setPrayerInfo(next)
        if (next?.time) setCountdown(formatCountdown(next.time))
      })
      .catch(() => setLocError(true))
  }, [])

  useEffect(() => {
    if (!prayerInfo?.time) return
    const id = setInterval(() => {
      setCountdown(formatCountdown(prayerInfo.time))
    }, 60_000)
    return () => clearInterval(id)
  }, [prayerInfo])

  return (
    <div
      className="px-5 pt-4 pb-5"
      style={{ background: 'linear-gradient(180deg, #5C1822 0%, #6B1F2A 100%)' }}
    >
      {/* Hijri date */}
      {hijri && (
        <>
          <h1 className="text-2xl font-bold text-center tracking-wide" style={{ color: '#FAF7F2', fontFamily: 'Georgia, serif' }}>
            {hijri.day} {hijri.monthName} {hijri.year}
          </h1>
          <p className="text-center text-sm mt-0.5" style={{ color: 'rgba(250,247,242,0.6)' }}>
            {formatGregorian(today)}
          </p>
        </>
      )}

      {/* Significance badges */}
      {significance.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {significance.slice(0, 2).map((sig, i) => {
            const style = BADGE_COLORS[sig.type] || BADGE_COLORS.month
            return (
              <span
                key={i}
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {sig.name}
              </span>
            )
          })}
        </div>
      )}

      {/* Prayer time */}
      <div className="flex justify-center mt-3">
        {prayerInfo && countdown ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4973A" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" stroke="#C4973A" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: '#FAF7F2' }}>
              Next: {prayerInfo.name} in {countdown}
            </span>
          </div>
        ) : locError ? (
          <span className="text-xs" style={{ color: 'rgba(250,247,242,0.4)' }}>Enable location for prayer times</span>
        ) : (
          <span className="text-xs" style={{ color: 'rgba(250,247,242,0.3)' }}>Calculating prayer times…</span>
        )}
      </div>
    </div>
  )
}

// ── Daily Theme Cards ─────────────────────────────────────────────────────────

function VerseCard({ verse, surahNum }) {
  const surah = chapters.find(c => c.id === surahNum)
  return (
    <div className="h-full flex flex-col px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>
          Quran
        </span>
        <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.35)' }}>
          {verse?.verse_key} · {surah?.name_simple}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {verse?.text_uthmani && (
          <p dir="rtl" className="text-right mb-3" style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '22px', lineHeight: '2.2', color: '#1C1410' }}>
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
          {verse?.translations?.[0]?.text || 'Loading verse…'}
        </p>
      </div>
    </div>
  )
}

function HadithCardDaily({ hadith }) {
  const grade = hadith?.grade
  const gs = gradeStyle(grade)

  return (
    <div className="h-full flex flex-col px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        {grade ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: gs.bg, color: gs.color, border: `1px solid ${gs.border}` }}>
            {grade}
          </span>
        ) : <span />}
        <span className="text-xs font-mono" style={{ color: 'rgba(28,20,16,0.35)' }}>{hadith?.reference || '…'}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hadith?.arabicText && (
          <>
            <p dir="rtl" className="text-right mb-2" style={{ fontFamily: '"Amiri", Georgia, serif', fontSize: '18px', lineHeight: '2.0', color: '#1C1410' }}>
              {hadith.arabicText.slice(0, 300)}{hadith.arabicText.length > 300 ? '…' : ''}
            </p>
            <GoldDivider />
          </>
        )}
        <p className="text-sm leading-relaxed mb-2" style={{ color: '#1C1410', lineHeight: '1.85' }}>
          {hadith?.text || 'Loading hadith…'}
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
      {/* Decorative background pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <polygon fill="#6B1F2A" points="100,10 120,80 190,80 135,120 155,190 100,150 45,190 65,120 10,80 80,80" />
        <polygon fill="#6B1F2A" points="100,30 115,75 162,75 124,100 139,147 100,122 61,147 76,100 38,75 85,75" />
      </svg>

      <div className="relative flex-1 flex flex-col">
        <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(28,20,16,0.38)' }}>
          Historical Context
        </span>
        <div className="mb-3">
          <h3 className="text-xl font-bold" style={{ color: '#1C1410', fontFamily: 'Georgia, serif' }}>
            {theme || '…'}
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
            {context || 'Loading historical context…'}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReflectionCard({ question, dateKey: dk }) {
  const stored = getDailyTheme(dk)?.reflection || ''
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

      <div
        className="rounded-2xl p-4 mb-4"
        style={{ backgroundColor: 'rgba(107,31,42,0.05)', border: '1px solid rgba(107,31,42,0.1)' }}
      >
        <p className="text-base font-medium leading-relaxed" style={{ color: '#1C1410', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          "{question || 'Loading question…'}"
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

      <button
        onClick={handleSave}
        className="w-full py-2.5 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: saved ? 'rgba(74,103,65,0.12)' : '#6B1F2A', color: saved ? '#2D6A4F' : '#FAF7F2' }}
      >
        {saved ? '✓ Reflection saved' : 'Save reflection'}
      </button>
    </div>
  )
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function buildQuiz(theme, surahNum, hadith) {
  const surah = chapters.find(c => c.id === surahNum)
  const wrongSurahs = chapters.filter(c => c.id !== surahNum).sort(() => Math.random() - 0.5).slice(0, 3)
  const wrongCols = ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'ibnmajah', 'nasai']
    .filter(c => c !== hadith?.collection).sort(() => Math.random() - 0.5).slice(0, 3)

  const questions = []

  if (surah) {
    const opts = [
      { text: surah.name_simple, correct: true },
      ...wrongSurahs.map(s => ({ text: s.name_simple, correct: false })),
    ].sort(() => Math.random() - 0.5)
    questions.push({ q: 'Which surah contains today\'s verse?', options: opts })
  }

  if (hadith?.collection) {
    const opts = [
      { text: COLLECTION_LABELS[hadith.collection], correct: true },
      ...wrongCols.map(c => ({ text: COLLECTION_LABELS[c], correct: false })),
    ].sort(() => Math.random() - 0.5)
    questions.push({ q: 'Which collection contains today\'s hadith?', options: opts })
  }

  if (hadith?.narrator) {
    const common = ['Abu Hurairah', 'Aisha', 'Ibn Umar', 'Anas ibn Malik', 'Ibn Abbas', 'Ali ibn Abi Talib']
    const wrongs = common.filter(n => !n.toLowerCase().includes((hadith.narrator || '').toLowerCase().split(' ')[0])).slice(0, 3)
    if (wrongs.length === 3) {
      const opts = [{ text: hadith.narrator, correct: true }, ...wrongs.map(w => ({ text: w, correct: false }))].sort(() => Math.random() - 0.5)
      questions.push({ q: 'Who narrated today\'s hadith?', options: opts })
    }
  }

  // Theme question
  const themes = ['Gratitude (Shukr)', 'Patience (Sabr)', 'Trust in Allah (Tawakkul)', 'Sincerity (Ikhlas)', 'Remembrance (Dhikr)', 'Justice (Adl)', 'Knowledge (Ilm)', 'Charity (Sadaqah)']
  const wrongThemes = themes.filter(t => !t.toLowerCase().includes((theme?.split(' ')[0] || '').toLowerCase())).slice(0, 3)
  if (theme && wrongThemes.length === 3) {
    const opts = [{ text: theme, correct: true }, ...wrongThemes.map(w => ({ text: w, correct: false }))].sort(() => Math.random() - 0.5)
    questions.push({ q: 'What is today\'s learning theme?', options: opts })
  }

  return questions.slice(0, 4)
}

function QuizModal({ questions, onClose }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(new Array(questions.length).fill(null))
  const [done, setDone] = useState(false)

  const answer = i => {
    if (answers[current] !== null) return
    const next = [...answers]
    next[current] = i
    setAnswers(next)
  }

  const goNext = () => {
    if (current + 1 >= questions.length) setDone(true)
    else setCurrent(c => c + 1)
  }

  const correct = answers.filter((a, i) => a !== null && questions[i]?.options[a]?.correct).length
  const pct = Math.round((correct / questions.length) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(28,20,16,0.55)' }} onClick={onClose}>
      <div className="w-full rounded-t-3xl px-5 pt-5 pb-10" style={{ backgroundColor: '#FAF7F2', animation: 'slideUp 0.3s ease both', maxHeight: '85dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'rgba(28,20,16,0.15)' }} />

        {done ? (
          <div className="text-center py-4">
            <div className="text-5xl font-bold mb-2" style={{ color: pct >= 70 ? '#2D6A4F' : pct >= 40 ? '#C4973A' : '#6B1F2A' }}>{pct}%</div>
            <p className="text-base font-semibold mb-1" style={{ color: '#1C1410' }}>Quiz Complete</p>
            <p className="text-sm mb-6" style={{ color: 'rgba(28,20,16,0.45)' }}>{correct}/{questions.length} correct</p>
            <button onClick={onClose} className="w-full py-3 rounded-2xl font-semibold text-sm" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>Done</button>
          </div>
        ) : (
          <>
            <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'rgba(196,151,58,0.18)' }}>
              <div className="h-full rounded-full" style={{ width: `${((current + (answers[current] !== null ? 1 : 0)) / questions.length) * 100}%`, backgroundColor: '#C4973A', transition: 'width 0.4s ease' }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(28,20,16,0.38)' }}>Question {current + 1} of {questions.length}</p>
            <p className="text-base font-semibold mb-4" style={{ color: '#1C1410' }}>{questions[current]?.q}</p>
            <div className="flex flex-col gap-2 mb-4">
              {questions[current]?.options.map((opt, i) => {
                const ans = answers[current]
                const isSelected = ans === i
                const isCorrect = opt.correct
                let bg = 'rgba(28,20,16,0.05)', color = '#1C1410', border = '1px solid rgba(28,20,16,0.08)'
                if (ans !== null) {
                  if (isSelected && isCorrect) { bg = 'rgba(74,103,65,0.12)'; color = '#2D6A4F'; border = '1px solid rgba(74,103,65,0.3)' }
                  if (isSelected && !isCorrect) { bg = 'rgba(139,32,32,0.1)'; color = '#8B2020'; border = '1px solid rgba(139,32,32,0.25)' }
                  if (!isSelected && isCorrect) { bg = 'rgba(74,103,65,0.07)'; color = '#2D6A4F'; border = '1px solid rgba(74,103,65,0.2)' }
                }
                return (
                  <button key={i} onClick={() => answer(i)} className="text-left px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: bg, color, border }}>
                    <span className="font-bold mr-2" style={{ opacity: 0.4 }}>{String.fromCharCode(65 + i)}.</span>{opt.text}
                  </button>
                )
              })}
            </div>
            <button onClick={goNext} disabled={answers[current] === null}
              className="w-full py-3 rounded-2xl font-semibold text-sm"
              style={{ backgroundColor: answers[current] !== null ? '#6B1F2A' : 'rgba(107,31,42,0.2)', color: answers[current] !== null ? '#FAF7F2' : 'rgba(250,247,242,0.5)' }}>
              {current + 1 >= questions.length ? 'Finish ✓' : 'Next →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Daily Theme Section ───────────────────────────────────────────────────────

const CARD_LABELS = ['Verse', 'Hadith', 'Context', 'Reflect']

function DailyThemeSection() {
  const dk = dateKey()
  const [theme, setTheme] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const touchX = useRef(null)
  const containerRef = useRef(null)

  const fetchTheme = useCallback(async (hijri) => {
    setLoading(true)
    setError(null)
    try {
      // Get last 7 theme names to avoid repetition
      const recent = getAllDailyThemes()
        .filter(t => t.dateKey !== dk && t.theme)
        .slice(0, 7)
        .map(t => t.theme)

      const userMsg = `Today's Hijri date: ${hijri || 'unknown'}. Recent themes to avoid: ${recent.slice(0, 7).join(', ') || 'none'}. Generate today's theme.`

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: DAILY_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMsg }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const parsed = JSON.parse(jsonMatch[0])

      // Load actual content
      const [verse, hadith] = await Promise.all([
        loadVerse(parsed.surahNumber, parsed.ayahNumber),
        loadHadith(parsed.hadithCollection, String(parsed.hadithNumber)),
      ])

      const full = { ...parsed, verse, hadith, generatedAt: dk }
      saveDailyTheme(dk, full)
      setTheme(full)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [dk])

  useEffect(() => {
    const cached = getDailyTheme(dk)
    if (cached?.generatedAt === dk && cached.theme) {
      setTheme(cached)
      return
    }
    const hijri = getHijriDate()
    const hijriStr = hijri ? `${hijri.day} ${hijri.monthName} ${hijri.year}` : ''
    fetchTheme(hijriStr)
  }, [])

  // Swipe handlers
  const onTouchStart = e => { touchX.current = e.touches[0].clientX; setIsDragging(true) }
  const onTouchMove = e => { if (touchX.current == null) return; setDragOffset(e.touches[0].clientX - touchX.current) }
  const onTouchEnd = () => {
    setIsDragging(false)
    if (dragOffset < -60 && currentCard < 3) setCurrentCard(c => c + 1)
    if (dragOffset > 60 && currentCard > 0) setCurrentCard(c => c - 1)
    setDragOffset(0)
    touchX.current = null
  }

  const cardWidth = containerRef.current?.offsetWidth || 300
  const translateX = -currentCard * 100 + (dragOffset / cardWidth) * 100

  const quiz = useMemo(
    () => theme ? buildQuiz(theme.theme, theme.surahNumber, theme.hadith) : [],
    [theme]
  )

  return (
    <div className="px-0 py-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(28,20,16,0.38)' }}>Today's Theme</p>
          {theme?.theme && (
            <p className="text-base font-bold mt-0.5" style={{ color: '#1C1410', fontFamily: 'Georgia, serif' }}>
              {theme.theme}
            </p>
          )}
        </div>
        {theme?.themeArabic && (
          <p className="text-sm" style={{ color: '#C4973A', fontFamily: 'Georgia, serif' }}>{theme.themeArabic}</p>
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
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3" style={{ borderColor: 'rgba(107,31,42,0.3)', borderTopColor: '#6B1F2A' }} />
            <p className="text-sm" style={{ color: 'rgba(28,20,16,0.4)' }}>Generating today's theme…</p>
          </div>
        ) : error ? (
          <div className="h-48 flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#FFFCF7' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#6B1F2A' }}>Theme unavailable</p>
            <p className="text-xs mb-3" style={{ color: 'rgba(28,20,16,0.45)' }}>{error.includes('ANTHROPIC_API_KEY') ? 'Set ANTHROPIC_API_KEY to enable daily themes.' : error}</p>
            <button onClick={() => fetchTheme(getHijriDate() ? `${getHijriDate().day} ${getHijriDate().monthName} ${getHijriDate().year}` : '')}
              className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}>
              Retry
            </button>
          </div>
        ) : theme ? (
          <div
            className="flex"
            style={{
              transform: `translateX(${translateX}%)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
              backgroundColor: '#FFFCF7',
            }}
          >
            {[
              <VerseCard key="v" verse={theme.verse} surahNum={theme.surahNumber} />,
              <HadithCardDaily key="h" hadith={theme.hadith} />,
              <ContextCard key="c" theme={theme.theme} themeArabic={theme.themeArabic} context={theme.historicalContext} />,
              <ReflectionCard key="r" question={theme.reflectiveQuestion} dateKey={dk} />,
            ].map((card, i) => (
              <div key={i} className="flex-shrink-0 w-full" style={{ minHeight: '280px' }}>
                {card}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Card indicators + labels */}
      {theme && (
        <div className="flex flex-col items-center mt-3 gap-1.5">
          <div className="flex items-center gap-3">
            {CARD_LABELS.map((label, i) => (
              <button key={i} onClick={() => setCurrentCard(i)} className="flex flex-col items-center gap-1">
                <div className="rounded-full transition-all" style={{
                  width: currentCard === i ? '20px' : '6px',
                  height: '6px',
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

      {/* Quiz + Skip row */}
      {theme && quiz.length > 0 && (
        <div className="flex gap-2 px-4 mt-3">
          <button
            onClick={() => setShowQuiz(true)}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: '#6B1F2A', color: '#FAF7F2' }}
          >
            ⚡ Today's Quiz
          </button>
          <button
            className="px-5 py-2.5 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: 'rgba(28,20,16,0.06)', color: 'rgba(28,20,16,0.5)' }}
          >
            Skip
          </button>
        </div>
      )}

      {showQuiz && quiz.length > 0 && <QuizModal questions={quiz} onClose={() => setShowQuiz(false)} />}
    </div>
  )
}

// ── Global Search Results ─────────────────────────────────────────────────────

function GroupHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 px-1 mt-4 mb-2">
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(28,20,16,0.38)' }}>{label}</span>
      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(107,31,42,0.1)', color: '#6B1F2A' }}>{count}</span>
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
        {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(28,20,16,0.4)' }}><Highlight text={subtitle} query={query} /></p>}
      </div>
      {item.arabicName && <p className="text-sm flex-shrink-0" style={{ fontFamily: 'Georgia, serif', color: '#C4973A' }}>{item.arabicName}</p>}
      {item.reference && <p className="text-xs flex-shrink-0 font-mono" style={{ color: 'rgba(28,20,16,0.32)' }}>{item.reference}</p>}
    </button>
  )
}

function EmptySearchState({ query }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(107,31,42,0.08)' }}>
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
  const [query, setQuery] = useState('')
  const [hadithResults, setHadithResults] = useState([])
  const [libCounts, setLibCounts] = useState({ dailyThemes: 0, quranVerses: 0, hadiths: 0 })

  useEffect(() => { setLibCounts(getLibraryCounts()) }, [])

  const totalSaved = libCounts.dailyThemes + libCounts.quranVerses + libCounts.hadiths

  // Static results from local data
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

    const savedItems = getCollections().flatMap(col =>
      getItemsInCollection(col.id)
        .filter(i => i.hadith?.text?.toLowerCase().includes(q) || (i.hadith?.narrator || '').toLowerCase().includes(q))
        .map(i => ({ ...i, collectionName: col.name }))
    ).slice(0, 3)

    return { quranSurahs, hadithTopics, hadithCollections, savedItems }
  }, [query])

  // Full-text hadith search via local file server
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
    ? staticResults.quranSurahs.length + staticResults.hadithTopics.length + staticResults.hadithCollections.length + staticResults.savedItems.length + hadithResults.length
    : 0

  const isSearching = query.trim().length > 0

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>

      {/* ── Daily header (replaces old Header component) ── */}
      <div style={{ backgroundColor: '#6B1F2A' }} className="relative">
        {/* Maqsad brand strip */}
        <div className="flex items-center justify-center py-2 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-base font-bold tracking-widest" style={{ color: 'rgba(250,247,242,0.6)', fontFamily: 'Georgia, serif' }}>مقصد</span>
          <span className="mx-2 text-xs" style={{ color: 'rgba(250,247,242,0.3)' }}>·</span>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(250,247,242,0.5)' }}>Maqsad</span>
        </div>
        <DailyHeader />
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 pt-4 pb-1">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
          style={{
            backgroundColor: isSearching ? '#FFFCF7' : 'rgba(28,20,16,0.06)',
            border: `1.5px solid ${isSearching ? 'rgba(107,31,42,0.22)' : 'transparent'}`,
            boxShadow: isSearching ? '0 2px 12px rgba(28,20,16,0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
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
        /* ── Search results ── */
        <div className="px-4 pb-6">
          {totalResults === 0 && hadithResults.length === 0 ? (
            <EmptySearchState query={query.trim()} />
          ) : (
            <div className="flex flex-col gap-2">
              {staticResults?.quranSurahs.length > 0 && (
                <>
                  <GroupHeader label="Quran" count={staticResults.quranSurahs.length} />
                  {staticResults.quranSurahs.map(s => (
                    <QuranResult key={s.id} surah={s} query={query.trim()} onClick={() => navigate('/quran', { state: { preselectSurah: s } })} />
                  ))}
                </>
              )}
              {hadithResults.length > 0 && (
                <>
                  <GroupHeader label="Hadith" count={hadithResults.length} />
                  {hadithResults.map((h, i) => (
                    <HadithResult key={i} item={{ ...h, name: h.text?.slice(0, 80) + '…', arabicName: null }}
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
                      subtitle={`${item.collectionName}`}
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

          {/* Divider */}
          <div className="mx-4 h-px my-2" style={{ backgroundColor: 'rgba(28,20,16,0.07)' }} />

          {/* ── My Maqsad button ── */}
          <div className="px-4 py-3">
            <button
              onClick={() => navigate('/my-maqsad')}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #6B1F2A 0%, #8B2A38 100%)',
                boxShadow: '0 4px 16px rgba(107,31,42,0.28)',
              }}
            >
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: '#C4973A' }}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: '#FAF7F2' }}>My Maqsad</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(250,247,242,0.6)' }}>
                    {totalSaved > 0 ? `${totalSaved} saved item${totalSaved !== 1 ? 's' : ''}` : 'Your personal library'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: 'rgba(250,247,242,0.5)' }}><ChevRight /></span>
              </div>
            </button>
          </div>

          {/* ── Modules ── */}
          <main className="px-4 pt-1 pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'rgba(28, 20, 16, 0.35)', letterSpacing: '0.16em' }}>
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
