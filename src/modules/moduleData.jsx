const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <line x1="12" y1="6" x2="18" y2="6"/>
    <line x1="12" y1="10" x2="18" y2="10"/>
  </svg>
)

const FeatherIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
    <line x1="16" y1="8" x2="2" y2="22"/>
    <line x1="17.5" y1="15" x2="9" y2="15"/>
  </svg>
)

const TimelineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
    <circle cx="18" cy="12" r="2" fill="currentColor" stroke="none"/>
    <line x1="6" y1="10" x2="6" y2="6"/>
    <line x1="12" y1="14" x2="12" y2="18"/>
    <line x1="18" y1="10" x2="18" y2="6"/>
  </svg>
)

const ScaleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <path d="M5 21h14"/>
    <path d="M5 8l7-5 7 5"/>
    <path d="M5 8l3 7H2L5 8z"/>
    <path d="M19 8l3 7h-6l3-7z"/>
  </svg>
)

const LampIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
)

const AtomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <ellipse cx="12" cy="12" rx="10" ry="3.5"/>
    <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(120 12 12)"/>
  </svg>
)

export const modules = [
  {
    id: 'quran',
    name: 'Quran',
    description: 'Recitation, tajweed & tafseer',
    accent: '#6B1F2A',
    icon: <BookIcon />,
    path: '/quran',
  },
  {
    id: 'hadith',
    name: 'Hadith',
    description: 'Prophetic narrations & sciences',
    accent: '#C4973A',
    icon: <FeatherIcon />,
  },
  {
    id: 'seerah',
    name: 'Seerah',
    description: 'The life of the Prophet ﷺ',
    accent: '#4A6741',
    icon: <TimelineIcon />,
  },
  {
    id: 'fiqh',
    name: 'Fiqh',
    description: 'Islamic jurisprudence & rulings',
    accent: '#6B1F2A',
    icon: <ScaleIcon />,
  },
  {
    id: 'islamic-studies',
    name: 'Islamic Studies',
    description: 'Aqeedah, ethics & history',
    accent: '#C4973A',
    icon: <LampIcon />,
  },
  {
    id: 'burhan',
    name: 'Burhan',
    description: 'Evidence, logic & apologetics',
    accent: '#1C1410',
    icon: <AtomIcon />,
  },
]
