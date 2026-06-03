import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { COLLECTIONS, TOPICS } from '../data/hadithData'
import { getCollections, getCollectionCount, deleteCollection, getItemsInCollection } from '../utils/hadithStorage'
import HadithCard from '../components/HadithCard'

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
  </svg>
)

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

const SearchIco = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const TrashIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

// ── Collection Card ───────────────────────────────────────────────────────────

function CollectionCard({ collection, onSelect }) {
  return (
    <button
      onClick={() => onSelect(collection)}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
      style={{
        backgroundColor: '#FFFCF7',
        boxShadow: '0 2px 14px rgba(28,20,16,0.07)',
        border: '1px solid rgba(196,151,58,0.18)',
      }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 pr-3">
            <h3 className="font-bold text-base leading-snug" style={{ color: '#1C1410' }}>
              {collection.name}
            </h3>
            <p className="text-sm mt-0.5" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#C4973A' }}>
              {collection.arabicName}
            </p>
          </div>
          <div className="flex-shrink-0 mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(196,151,58,0.12)', color: '#C4973A' }}>
            {collection.count.toLocaleString()}
          </div>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.52)' }}>
          {collection.description}
        </p>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: '1px solid rgba(28,20,16,0.05)', backgroundColor: 'rgba(107,31,42,0.025)' }}>
        <span className="text-xs" style={{ color: 'rgba(28,20,16,0.38)' }}>{collection.author}</span>
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#6B1F2A' }}>
          Browse <ChevronRight />
        </span>
      </div>
    </button>
  )
}

// ── Topic Card ────────────────────────────────────────────────────────────────

function TopicCard({ topic, onSelect }) {
  return (
    <button
      onClick={() => onSelect(topic)}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.97]"
      style={{
        backgroundColor: '#FFFCF7',
        boxShadow: '0 2px 10px rgba(28,20,16,0.06)',
        border: '1px solid rgba(107,31,42,0.09)',
      }}
    >
      <p className="text-base font-bold leading-snug mb-0.5" style={{ color: '#1C1410' }}>{topic.name}</p>
      <p className="text-sm mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#C4973A' }}>
        {topic.arabicName}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.48)' }}>{topic.description}</p>
    </button>
  )
}

// ── My Collections Tab ────────────────────────────────────────────────────────

function MyCollectionsView({ onSelectCollection }) {
  const [collections, setCollections] = useState(getCollections)
  const [deleteTick, setDeleteTick] = useState(0)

  const handleDelete = (e, colId) => {
    e.stopPropagation()
    deleteCollection(colId)
    setCollections(getCollections())
    setDeleteTick(t => t + 1)
  }

  const total = collections.reduce((sum, c) => sum + getCollectionCount(c.id), 0)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(107,31,42,0.08)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3 className="font-bold text-base mb-2" style={{ color: '#1C1410' }}>No saved hadiths yet</h3>
        <p className="text-sm" style={{ color: 'rgba(28,20,16,0.45)' }}>
          Tap the bookmark icon on any hadith card to save it to a collection.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {collections.map(col => {
        const count = getCollectionCount(col.id)
        const isDefault = col.id === 'favorites' || col.id === 'share-later'
        return (
          <button
            key={col.id}
            onClick={() => count > 0 && onSelectCollection(col)}
            className="w-full text-left rounded-2xl overflow-hidden transition-all"
            style={{
              backgroundColor: '#FFFCF7',
              boxShadow: '0 2px 12px rgba(28,20,16,0.07)',
              border: '1px solid rgba(28,20,16,0.06)',
              opacity: count === 0 ? 0.5 : 1,
            }}
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: 'rgba(107,31,42,0.07)', color: '#6B1F2A', fontSize: '18px', fontFamily: 'monospace' }}>
                {col.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: '#1C1410' }}>{col.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(28,20,16,0.42)' }}>
                  {count === 0 ? 'Empty' : `${count} hadith${count !== 1 ? 's' : ''}`}
                </p>
              </div>
              {count > 0 && <ChevronRight />}
              {!isDefault && (
                <button
                  onClick={e => handleDelete(e, col.id)}
                  className="p-2 rounded-lg"
                  style={{ color: 'rgba(28,20,16,0.3)' }}
                >
                  <TrashIco />
                </button>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Saved Hadiths View ────────────────────────────────────────────────────────

function SavedHadithsView({ collection, onBack }) {
  const items = getItemsInCollection(collection.id)
  const hadiths = items.map(i => i.hadith)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? hadiths.filter(h =>
        h.text?.toLowerCase().includes(search.toLowerCase()) ||
        (h.narrator || '').toLowerCase().includes(search.toLowerCase())
      )
    : hadiths

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Sub-header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(28,20,16,0.07)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: '#6B1F2A' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
          </svg>
          Collections
        </button>
        <span className="font-bold text-sm flex-1 text-center" style={{ color: '#1C1410' }}>{collection.name}</span>
        <span className="text-xs" style={{ color: 'rgba(28,20,16,0.38)' }}>{hadiths.length}</span>
      </div>

      {/* Search */}
      {hadiths.length > 3 && (
        <div className="px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: 'rgba(28,20,16,0.06)', border: '1px solid rgba(28,20,16,0.08)' }}>
            <SearchIco />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search saved hadiths…"
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: '#1C1410' }}
            />
          </div>
        </div>
      )}

      {/* Hadith list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'rgba(28,20,16,0.4)' }}>No results found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((h, i) => (
              <HadithCard key={h.id} hadith={h} index={i} allHadiths={filtered} displayMode="both" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HadithPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('collection')
  const [search, setSearch] = useState('')
  const [selectedSavedCol, setSelectedSavedCol] = useState(null)

  const TABS = [
    ['collection', 'By Collection'],
    ['topic', 'By Topic'],
    ['saved', 'My Collections'],
  ]

  const filteredCollections = useMemo(() => {
    if (!search.trim()) return COLLECTIONS
    const q = search.toLowerCase()
    return COLLECTIONS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.arabicName.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.author.toLowerCase().includes(q)
    )
  }, [search])

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return TOPICS
    const q = search.toLowerCase()
    return TOPICS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.arabicName.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    )
  }, [search])

  const handleCollectionSelect = collection => {
    navigate('/hadith/browse', {
      state: {
        type: 'collection',
        id: collection.id,
        name: collection.name,
        arabicName: collection.arabicName,
      },
    })
  }

  const handleTopicSelect = topic => {
    navigate('/hadith/browse', {
      state: {
        type: 'topic',
        id: topic.id,
        name: topic.name,
        arabicName: topic.arabicName,
        collection: topic.collection,
        book: topic.book,
      },
    })
  }

  const showSavedHadiths = tab === 'saved' && selectedSavedCol !== null

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
          <h1 className="text-lg font-bold tracking-wide" style={{ color: '#FAF7F2' }}>Hadith</h1>
          <p className="text-base mt-0.5" style={{ color: '#C4973A', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            الحديث
          </p>
        </div>
      </header>

      {/* ── Search Bar ── */}
      {!showSavedHadiths && (
        <div className="flex-shrink-0 px-4 pt-3 pb-1">
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
            style={{ backgroundColor: 'rgba(28,20,16,0.06)', border: '1px solid rgba(28,20,16,0.08)' }}
          >
            <span style={{ color: 'rgba(28,20,16,0.4)' }}><SearchIco /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                tab === 'collection' ? 'Search collections…' :
                tab === 'topic' ? 'Search topics…' :
                'Search my collections…'
              }
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: '#1C1410' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'rgba(28,20,16,0.35)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Bar ── */}
      {!showSavedHadiths && (
        <div
          className="flex-shrink-0 flex gap-2 px-4 py-2.5"
          style={{ borderBottom: '1px solid rgba(28,20,16,0.07)' }}
        >
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSearch('') }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                tab === id
                  ? { backgroundColor: '#6B1F2A', color: '#FAF7F2' }
                  : { backgroundColor: 'rgba(107,31,42,0.08)', color: 'rgba(28,20,16,0.55)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {showSavedHadiths ? (
        <SavedHadithsView collection={selectedSavedCol} onBack={() => setSelectedSavedCol(null)} />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === 'collection' && (
            filteredCollections.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredCollections.map(c => (
                  <CollectionCard key={c.id} collection={c} onSelect={handleCollectionSelect} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-12" style={{ color: 'rgba(28,20,16,0.4)' }}>
                No collections match "{search}"
              </p>
            )
          )}

          {tab === 'topic' && (
            filteredTopics.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredTopics.map(t => (
                  <TopicCard key={t.id} topic={t} onSelect={handleTopicSelect} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-12" style={{ color: 'rgba(28,20,16,0.4)' }}>
                No topics match "{search}"
              </p>
            )
          )}

          {tab === 'saved' && (
            <MyCollectionsView onSelectCollection={col => setSelectedSavedCol(col)} />
          )}
        </div>
      )}
    </div>
  )
}
