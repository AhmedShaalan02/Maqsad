// Hijri months (1-indexed)
export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah',
]

// Keyed by "month_day" (Hijri). Returns array of significance objects.
const DATE_DB = {
  // ── Muharram ──
  '1_1':  [{ name: 'Islamic New Year', arabic: 'رأس السنة الهجرية', type: 'special',
              desc: "The first day of Muharram marks the beginning of the Islamic lunar year — the Hijri calendar, rooted in the Prophet's ﷺ migration to Madinah." }],
  '1_10': [{ name: 'Day of Ashura', arabic: 'يوم عاشوراء', type: 'fast',
              desc: "The Prophet ﷺ fasted on Ashura and recommended fasting the day before or after as well. It marks Moses' (AS) deliverance from Pharaoh." }],

  // ── Rabi al-Awwal ──
  '3_12': [{ name: "Mawlid an-Nabawi", arabic: 'المولد النبوي الشريف', type: 'special',
              desc: "Traditionally observed as the birth anniversary of the Prophet Muhammad ﷺ, a day for sending salutations upon him." }],

  // ── Rajab ──
  '7_1':  [{ name: "First of Rajab", arabic: 'أول رجب', type: 'month',
              desc: "One of the four sacred months in Islam. The Prophet ﷺ said: 'Rajab is the month of Allah, Sha'ban is my month, and Ramadan is the month of my Ummah.'" }],
  '7_27': [{ name: "Isra and Mi'raj", arabic: 'الإسراء والمعراج', type: 'special',
              desc: "The Night Journey of the Prophet ﷺ from Makkah to Jerusalem and his Ascension through the heavens — the night the five daily prayers were prescribed." }],

  // ── Sha'ban ──
  '8_1':  [{ name: "First of Sha'ban", arabic: 'أول شعبان', type: 'month',
              desc: "The month before Ramadan. The Prophet ﷺ fasted more in Sha'ban than any other month outside Ramadan — a time to spiritually prepare." }],
  '8_15': [{ name: "Laylat al-Bara'ah", arabic: 'ليلة البراءة', type: 'special',
              desc: "The Night of Forgiveness — the 15th of Sha'ban is a night of divine mercy in which many scholars report forgiveness is granted to those who seek it." }],

  // ── Ramadan (month 9) — handled dynamically below ──

  // ── Shawwal ──
  '10_1': [{ name: 'Eid al-Fitr', arabic: 'عيد الفطر', type: 'eid',
              desc: "The celebration of breaking the fast after Ramadan — a day of gratitude, charity (Zakat al-Fitr), prayer, and joy with family and community." }],
  // Days 2-7 of Shawwal — built programmatically below


  // ── Dhul Qa'dah ──
  '11_1': [{ name: "First of Dhul Qa'dah", arabic: "أول ذي القعدة", type: 'month',
              desc: "One of the four sacred months. Violence is prohibited and pilgrimage preparation begins." }],

  // ── Dhul Hijjah ──
  '12_1': [{ name: 'First 10 Days of Dhul Hijjah', arabic: 'أول أيام ذي الحجة', type: 'special',
              desc: "The Prophet ﷺ said: 'There are no days on which righteous deeds are more beloved to Allah than these ten days.'" }],
  '12_2': [{ name: 'First 10 Days of Dhul Hijjah', arabic: 'أيام ذي الحجة المباركة', type: 'special', desc: '' }],
  '12_3': [{ name: 'First 10 Days of Dhul Hijjah', arabic: 'أيام ذي الحجة المباركة', type: 'special', desc: '' }],
  '12_4': [{ name: 'First 10 Days of Dhul Hijjah', arabic: 'أيام ذي الحجة المباركة', type: 'special', desc: '' }],
  '12_5': [{ name: 'First 10 Days of Dhul Hijjah', arabic: 'أيام ذي الحجة المباركة', type: 'special', desc: '' }],
  '12_6': [{ name: 'First 10 Days of Dhul Hijjah', arabic: 'أيام ذي الحجة المباركة', type: 'special', desc: '' }],
  '12_7': [{ name: 'First 10 Days of Dhul Hijjah', arabic: 'أيام ذي الحجة المباركة', type: 'special', desc: '' }],
  '12_8': [{ name: "Day of Tarwiyah", arabic: 'يوم التروية', type: 'special',
              desc: "Pilgrims travel to Mina on this day, the 8th of Dhul Hijjah, the beginning of the Hajj rites." }],
  '12_9': [{ name: 'Day of Arafah', arabic: 'يوم عرفة', type: 'special',
              desc: "The greatest day of the year. The Prophet ﷺ said: 'There is no day on which Allah frees more people from the Fire than the Day of Arafah.' Fasting expiates two years of sins." }],
  '12_10': [{ name: 'Eid al-Adha', arabic: 'عيد الأضحى', type: 'eid',
               desc: "The Festival of Sacrifice, commemorating Ibrahim's (AS) willingness to sacrifice his son. A day of prayer, gratitude, and sharing with the poor." }],
  // Days 11-13 of Dhul Hijjah — built programmatically below
}

// Six Days of Shawwal (days 2-7) — fasting after Eid
for (let d = 2; d <= 7; d++) {
  DATE_DB[`10_${d}`] = [{ name: 'Six Days of Shawwal', arabic: 'ست شوال', type: 'fast',
    desc: d === 2 ? "Fasting any six days of Shawwal after Eid is like fasting the entire year, according to the Prophet ﷺ." : '' }]
}

// Days of Tashreeq (Dhul Hijjah 11-13)
for (let d = 11; d <= 13; d++) {
  DATE_DB[`12_${d}`] = [{ name: 'Days of Tashreeq', arabic: 'أيام التشريق', type: 'special',
    desc: d === 11 ? "The days of Tashreeq are days of eating, drinking, and remembering Allah — prohibited for fasting." : '' }]
}

// First day of every Hijri month
for (let m = 1; m <= 12; m++) {
  const key = `${m}_1`
  if (!DATE_DB[key]) {
    DATE_DB[key] = [{
      name: `First of ${HIJRI_MONTHS[m - 1]}`,
      arabic: `أول ${HIJRI_MONTHS[m - 1]}`,
      type: 'month',
      desc: 'It is Sunnah to fast on the 13th, 14th, and 15th of each Hijri month — the "white days" (Ayyam al-Bid).',
    }]
  }
}

// White days (13th, 14th, 15th of every month)
for (let m = 1; m <= 12; m++) {
  for (const d of [13, 14, 15]) {
    const key = `${m}_${d}`
    const existing = DATE_DB[key] || []
    const hasWhite = existing.some(e => e.name === 'White Days')
    if (!hasWhite) {
      DATE_DB[key] = [...existing, {
        name: 'White Days (Ayyam al-Bid)',
        arabic: 'أيام البيض',
        type: 'fast',
        desc: "The Prophet ﷺ recommended fasting the 13th, 14th, and 15th of every month — 'as if fasting the entire month.'",
      }]
    }
  }
}

// ── Ramadan (month 9) ──
for (let d = 1; d <= 30; d++) {
  const entries = []

  if (d === 1) {
    entries.push({
      name: 'First Day of Ramadan',
      arabic: 'أول رمضان',
      type: 'ramadan',
      desc: "The blessed month of fasting, Quran, and increased worship begins. The gates of Heaven are opened and the gates of Hell are closed.",
    })
  } else {
    entries.push({
      name: `Ramadan — Day ${d}`,
      arabic: `رمضان · اليوم ${d}`,
      type: 'ramadan',
      desc: "A blessed day of fasting, recitation of the Quran, and closeness to Allah ﷻ.",
    })
  }

  if (d >= 21 && d % 2 === 1 && d !== 27) {
    entries.push({
      name: 'Possible Laylat al-Qadr',
      arabic: 'ليلة القدر المحتملة',
      type: 'special',
      desc: "Seek Laylat al-Qadr in the odd nights of the last 10 days of Ramadan — a night better than a thousand months.",
    })
  }
  if (d === 27) {
    entries.push({
      name: 'Laylat al-Qadr (27th Ramadan)',
      arabic: 'ليلة القدر',
      type: 'special',
      desc: "The Night of Power — most commonly observed on the 27th of Ramadan. Worship on this night equals over 83 years of worship.",
    })
  }

  DATE_DB[`9_${d}`] = entries
}

/**
 * Returns significance entries for a given Hijri date + Gregorian day-of-week.
 * @param {number} hMonth 1-12
 * @param {number} hDay   1-30
 * @param {number} weekday 0=Sun, 1=Mon, ..., 4=Thu
 */
export function getIslamicSignificance(hMonth, hDay, weekday) {
  const results = [...(DATE_DB[`${hMonth}_${hDay}`] || [])]

  if (weekday === 1) {
    results.push({
      name: 'Monday Fast',
      arabic: 'صيام الاثنين',
      type: 'fast',
      desc: "The Prophet ﷺ fasted on Mondays, saying: 'This is the day I was born and the day revelation came to me.'",
    })
  }
  if (weekday === 4) {
    results.push({
      name: 'Thursday Fast',
      arabic: 'صيام الخميس',
      type: 'fast',
      desc: "The Prophet ﷺ fasted on Thursdays, saying: 'Deeds are presented to Allah on Mondays and Thursdays, and I like my deeds to be presented while I am fasting.'",
    })
  }
  return results
}
