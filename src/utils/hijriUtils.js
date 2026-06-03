import { HIJRI_MONTHS } from '../data/islamicDates'

/**
 * Returns the Hijri date for a given Gregorian date using the browser's
 * built-in Intl API with the Umm al-Qura calendar (identical to hijri-date-converter).
 */
export function getHijriDate(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(date)

    const get = type => parseInt(parts.find(p => p.type === type)?.value || '0')
    const day   = get('day')
    const month = get('month')
    const year  = get('year')
    const monthName = HIJRI_MONTHS[month - 1] || ''

    return { day, month, year, monthName }
  } catch {
    return null
  }
}

export function formatHijri({ day, month, year, monthName }) {
  return `${day} ${monthName} ${year}`
}

/** Gregorian date formatted for display */
export function formatGregorian(date = new Date()) {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

/** Key for localStorage cache: "YYYY-MM-DD" */
export function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}
