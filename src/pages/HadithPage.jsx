import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COLLECTIONS, TOPICS } from '../data/hadithData'

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
            <p
              className="text-sm mt-0.5"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#C4973A' }}
            >
              {collection.arabicName}
            </p>
          </div>
          <div
            className="flex-shrink-0 mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(196,151,58,0.12)', color: '#C4973A' }}
          >
            {collection.count.toLocaleString()}
          </div>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.52)' }}>
          {collection.description}
        </p>
      </div>

      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: '1px solid rgba(28,20,16,0.05)', backgroundColor: 'rgba(107,31,42,0.025)' }}
      >
        <span className="text-xs" style={{ color: 'rgba(28,20,16,0.38)' }}>
          {collection.author}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#6B1F2A' }}>
          Browse <ChevronRight />
        </span>
      </div>
    </button>
  )
}

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
      <p
        className="text-base font-bold leading-snug mb-0.5"
        style={{ color: '#1C1410' }}
      >
        {topic.name}
      </p>
      <p
        className="text-sm mb-2"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#C4973A' }}
      >
        {topic.arabicName}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,20,16,0.48)' }}>
        {topic.description}
      </p>
    </button>
  )
}

export default function HadithPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('collection')

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
            Hadith
          </h1>
          <p
            className="text-base mt-0.5"
            style={{ color: '#C4973A', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            الحديث
          </p>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(28,20,16,0.07)' }}
      >
        {[['collection', 'By Collection'], ['topic', 'By Topic']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
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

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'collection' ? (
          <div className="flex flex-col gap-3">
            {COLLECTIONS.map(c => (
              <CollectionCard key={c.id} collection={c} onSelect={handleCollectionSelect} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {TOPICS.map(t => (
              <TopicCard key={t.id} topic={t} onSelect={handleTopicSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
