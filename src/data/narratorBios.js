const BIOS = [
  {
    keys: ['abu hurairah', 'abu huraira'],
    name: 'Abu Hurairah (RA)',
    bio: "Abd al-Rahman ibn Sakhr al-Dawsi embraced Islam in 7 AH and devoted himself entirely to the Prophet ﷺ as one of the People of the Suffah. He is the most prolific narrator of hadith with over 5,000 accepted narrations — the Prophet ﷺ prayed that Abu Hurairah would never forget what he had heard, and he never did.",
  },
  {
    keys: ["a'isha", 'aisha', "'a'ishah", "aishah"],
    name: "A'isha bint Abi Bakr (RA)",
    bio: "Wife of the Prophet ﷺ and daughter of Abu Bakr al-Siddiq, she is among the three most prolific narrators of hadith. The Companions would refer difficult questions of Sunnah to her after the Prophet's ﷺ passing. She was a master of poetry, medicine, lineage, and jurisprudence — a complete scholar in her own right.",
  },
  {
    keys: ["ibn umar", "ibn 'umar", "ibn omar", "abdullah ibn umar", "abdulla ibn"],
    name: "Abdullah ibn Umar (RA)",
    bio: "Son of the second Caliph Umar ibn al-Khattab and one of the most scrupulous Companions in following the Sunnah. He narrated over 2,600 hadiths and was known for painstaking precision — he would replicate even minor acts of the Prophet ﷺ, down to the exact routes he walked in Madinah.",
  },
  {
    keys: ['ibn abbas', "ibn 'abbas", "abdullah ibn al-'abbas", "ibn al-'"],
    name: "Abdullah ibn Abbas (RA)",
    bio: "Cousin of the Prophet ﷺ, who prayed for him: 'O Allah, grant him understanding in religion and teach him the interpretation of the Quran.' He became the foremost scholar of Quranic exegesis in Islamic history and narrated over 1,600 hadiths. He is known as the 'Scholar of the Ummah' (Hibr al-Ummah).",
  },
  {
    keys: ['anas ibn malik', 'anas bin malik', 'anas'],
    name: "Anas ibn Malik (RA)",
    bio: "Anas served the Prophet ﷺ in Madinah for ten years from the age of ten. He narrated over 2,000 hadiths and lived to nearly 100 years old, making him one of the last surviving Companions. The Prophet ﷺ made du'a for him — for long life, many children, and abundance in wealth — and it was visibly answered.",
  },
  {
    keys: ['ibn masud', "ibn mas'ud", 'ibnu masud', 'abdulla ibn masud', 'abdullaah ibn masood'],
    name: "Abdullah ibn Masud (RA)",
    bio: "One of the earliest Muslims and among the first to recite the Quran publicly in Makkah, enduring physical harm to do so. The Prophet ﷺ described him as one of four people from whom the Quran should be learned. He served as a faqih and teacher in Kufa and narrated over 800 hadiths.",
  },
  {
    keys: ['ali ibn abi talib', 'ali bin abi talib', "'ali ibn abi talib", 'ali ibn'],
    name: "Ali ibn Abi Talib (RA)",
    bio: "Cousin and son-in-law of the Prophet ﷺ, husband of Fatimah, and the fourth Caliph of Islam. He was among the first males to embrace Islam as a young boy. Renowned for his profound knowledge, courage, and eloquence, he narrated over 500 hadiths and is the source of much of the early tradition of Islamic jurisprudence and spirituality.",
  },
  {
    keys: ['jabir ibn abdullah', 'jabir bin', "jabir ibn 'abdullah"],
    name: "Jabir ibn Abdullah (RA)",
    bio: "An Ansari Companion from Madinah who participated in nearly all of the Prophet's ﷺ military expeditions. He narrated over 1,500 hadiths and continued to teach the Sunnah well into the era of the Tabi'een. He was known for his profound attachment to the Prophet ﷺ and his long journeys to verify a single hadith.",
  },
  {
    keys: ['abu said', 'abu sa', "abu sa'id", 'abu saeed'],
    name: "Abu Said al-Khudri (RA)",
    bio: "Sa'd ibn Malik al-Ansari, known as Abu Said, participated in twelve military expeditions with the Prophet ﷺ from the age of thirteen. He narrated over 1,170 hadiths and was celebrated for his fearlessness in commanding good and forbidding evil, even before rulers. He is particularly known for hadiths on eschatology and Islamic ethics.",
  },
  {
    keys: ["umar ibn al-khattab", "umar ibn al-", "'umar ibn al-khattab", 'umar bin al-khattab', 'umar'],
    name: "Umar ibn al-Khattab (RA)",
    bio: "The second Caliph of Islam, who converted after hearing the Quran recited and was transformed in an instant. His embrace of Islam strengthened the early Muslims so much that the Prophet ﷺ reportedly wished for it. He narrated over 500 hadiths, was known for his justice and far-sighted statecraft, and his rulings are second only to Abu Bakr in authority.",
  },
  {
    keys: ['abu musa', 'al-ashari', 'abu musa al-'],
    name: "Abu Musa al-Ashari (RA)",
    bio: "A Yemeni Companion praised by the Prophet ﷺ for his melodious recitation of the Quran: 'He has been given one of the wind-instruments of the family of David.' He served as a governor of Basra and Kufa and as a judge, narrating over 350 hadiths. He is a key transmitter of the tradition of Quranic recitation.",
  },
  {
    keys: ['muadh', 'mu\'adh', "mu'adh ibn jabal"],
    name: "Muadh ibn Jabal (RA)",
    bio: "The Prophet ﷺ called him 'the most knowledgeable of my community in what is permitted and what is forbidden.' He was sent to Yemen as a teacher and judge while still young. He died in the plague of Amwas at approximately 34 years of age, and his loss was mourned deeply by the scholarly Companions.",
  },
  {
    keys: ['salman', 'salman al-farisi', 'salman the persian'],
    name: "Salman al-Farisi (RA)",
    bio: "A Persian seeker of truth who traveled from Zoroastrianism through Christianity before reaching Islam. He suggested the strategy of digging a trench during the Battle of the Trench, and the Prophet ﷺ honored him saying 'Salman is from us, the people of the household.' He was renowned for his wisdom, deep piety, and asceticism.",
  },
  {
    keys: ['abu darda', "abu al-darda", "abu al-dardaa"],
    name: "Abu Darda (RA)",
    bio: "A later convert who became one of the most devoted worshippers among the Companions. The Prophet ﷺ paired him as a brotherhood with Salman al-Farisi, and their exchange about balancing worship with the rights of the body and family is a celebrated teaching. He served as judge in Damascus and was a preeminent teacher of the Syrian Muslims.",
  },
  {
    keys: ['hudhayfah', 'hudhayfa', 'hudhaifa', 'hudhifa'],
    name: "Hudhayfah ibn al-Yaman (RA)",
    bio: "Uniquely entrusted by the Prophet ﷺ with the names of the hypocrites in Madinah — Umar ibn al-Khattab would watch whether Hudhayfah prayed over the deceased before joining. He narrated crucial hadiths about trials (fitan), end-times, and the signs of the Hour, making him an essential source for Islamic eschatology.",
  },
  {
    keys: ['zayd ibn thabit', 'zayd bin thabit'],
    name: "Zayd ibn Thabit (RA)",
    bio: "Chief scribe of the Prophet ﷺ who, at the Prophet's command, learned Syriac and Hebrew within days. He is one of the foremost authorities on the Quran among the Companions, and was entrusted by both Abu Bakr and Uthman to compile and standardize the written Quran. He was also a leading scholar of inheritance law.",
  },
  {
    keys: ["abdullah ibn 'amr", "abdullâh ibn 'amr", "abdullah ibn amr"],
    name: "Abdullah ibn Amr ibn al-As (RA)",
    bio: "One of the few Companions who received the Prophet's ﷺ explicit permission to write down hadiths, resulting in a collection called al-Sahifah al-Sadiqah. He narrated over 700 hadiths and was extraordinarily devoted to worship — the Prophet ﷺ counseled him to moderate his fasting and night prayers to maintain his family rights.",
  },
  {
    keys: ['umm salamah', "umm salama", 'hind bint'],
    name: "Umm Salamah (RA)",
    bio: "Hind bint Abi Umayya, a wife of the Prophet ﷺ celebrated for her sharp intellect and wise counsel. It was her advice on the Day of Hudaybiyyah — that the Prophet ﷺ should shave his head first without waiting — that broke the stalemate. She narrated over 370 hadiths and lived to approximately 90 years of age.",
  },
  {
    keys: ['fatimah', 'fatima', "fatimah al-zahra"],
    name: "Fatimah al-Zahra (RA)",
    bio: "The youngest daughter of the Prophet ﷺ and wife of Ali ibn Abi Talib. The Prophet ﷺ described her as 'the leader of the women of Paradise' and said 'Fatimah is a part of me.' She was so close in her mannerisms to the Prophet ﷺ that whoever wished to see the Prophet's walk would look at Fatimah.",
  },
  {
    keys: ['bilal ibn rabah', 'bilal bin rabah', 'bilal'],
    name: "Bilal ibn Rabah (RA)",
    bio: "An Abyssinian slave who was among the earliest converts to Islam, enduring brutal torture at the hands of his master Umayyah ibn Khalaf before being freed by Abu Bakr al-Siddiq. The Prophet ﷺ appointed him as the first muezzin of Islam. His story is a cornerstone of Islam's rejection of racial hierarchy and elevation of the oppressed.",
  },
]

export function findNarratorBio(narrator) {
  if (!narrator) return null
  const n = narrator.toLowerCase()
  return BIOS.find(b => b.keys.some(k => n.includes(k))) || null
}
