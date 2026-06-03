export const COLLECTIONS = [
  {
    id: 'bukhari',
    name: 'Sahih Bukhari',
    arabicName: 'صحيح البخاري',
    author: 'Imam al-Bukhari',
    count: 7563,
    description:
      'The most rigorously authenticated hadith collection. Imam al-Bukhari spent 16 years selecting only the most verified narrations from 600,000.',
  },
  {
    id: 'muslim',
    name: 'Sahih Muslim',
    arabicName: 'صحيح مسلم',
    author: 'Imam Muslim ibn al-Hajjaj',
    count: 7500,
    description:
      'Second only to Bukhari in authenticity. Renowned for its meticulous organization and grouping of chains of narration.',
  },
  {
    id: 'tirmidhi',
    name: "Jami' at-Tirmidhi",
    arabicName: 'جامع الترمذي',
    author: 'Imam al-Tirmidhi',
    count: 3956,
    description:
      "Covers all major aspects of Islamic practice and includes the compiler's own authenticity ratings for each narration.",
  },
  {
    id: 'abudawud',
    name: 'Sunan Abu Dawud',
    arabicName: 'سنن أبي داود',
    author: 'Imam Abu Dawud',
    count: 5274,
    description:
      'Focused on legal (fiqh) rulings. Abu Dawud reviewed 500,000 narrations and selected only the strongest for this work.',
  },
  {
    id: 'ibnmajah',
    name: 'Sunan Ibn Majah',
    arabicName: 'سنن ابن ماجه',
    author: 'Imam Ibn Majah',
    count: 4341,
    description:
      'Contains many unique narrations not found in other collections, completing the six canonical books (Kutub al-Sittah).',
  },
  {
    id: 'nasai',
    name: "Sunan an-Nasa'i",
    arabicName: 'سنن النسائي',
    author: "Imam an-Nasa'i",
    count: 5761,
    description:
      "Known for exceptionally strict standards of authentication — one of the most critically rigorous of the six canonical books.",
  },
]

/** Maps collection ID → display name, derived from COLLECTIONS. */
export const COLLECTION_LABELS = Object.fromEntries(COLLECTIONS.map(c => [c.id, c.name]))

export const TOPICS = [
  {
    id: 'faith',
    name: 'Faith',
    arabicName: 'الإيمان',
    description: 'The pillars and nature of iman',
    collection: 'bukhari',
    book: '2',
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    arabicName: 'العلم',
    description: 'Seeking knowledge and its virtue',
    collection: 'bukhari',
    book: '3',
  },
  {
    id: 'prayer',
    name: 'Prayer',
    arabicName: 'الصلاة',
    description: 'Rules, virtues and etiquette of salah',
    collection: 'muslim',
    book: '4',
  },
  {
    id: 'fasting',
    name: 'Fasting',
    arabicName: 'الصيام',
    description: 'Ramadan, voluntary fasts and their rewards',
    collection: 'bukhari',
    book: '30',
  },
  {
    id: 'zakat',
    name: 'Zakat',
    arabicName: 'الزكاة',
    description: 'Obligatory charity and purification of wealth',
    collection: 'bukhari',
    book: '24',
  },
  {
    id: 'hajj',
    name: 'Hajj',
    arabicName: 'الحج',
    description: 'The pilgrimage to Makkah and its rituals',
    collection: 'bukhari',
    book: '25',
  },
  {
    id: 'manners',
    name: 'Manners & Ethics',
    arabicName: 'الأخلاق',
    description: 'Character, conduct and prophetic etiquette',
    collection: 'bukhari',
    book: '78',
  },
  {
    id: 'marriage',
    name: 'Marriage & Family',
    arabicName: 'النكاح',
    description: 'Marriage, family relations and children',
    collection: 'bukhari',
    book: '67',
  },
  {
    id: 'business',
    name: 'Business & Trade',
    arabicName: 'البيوع',
    description: 'Halal commerce, contracts and transactions',
    collection: 'bukhari',
    book: '34',
  },
  {
    id: 'jihad',
    name: 'Jihad & Struggle',
    arabicName: 'الجهاد',
    description: 'Striving in the way of Allah',
    collection: 'bukhari',
    book: '56',
  },
  {
    id: 'death',
    name: 'Death & Afterlife',
    arabicName: 'الآخرة',
    description: 'Death, the grave, resurrection and the hereafter',
    collection: 'bukhari',
    book: '23',
  },
  {
    id: 'dhikr',
    name: 'Dhikr & Dua',
    arabicName: 'الذكر والدعاء',
    description: 'Remembrance of Allah and supplications',
    collection: 'bukhari',
    book: '80',
  },
]
