import { Coordinates, PrayerTimes, CalculationMethod, Prayer } from 'adhan'

export const PRAYER_LABELS = {
  fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr',
  asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
}
const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { timeout: 8000 }
    )
  })
}

export function calcPrayerTimes(lat, lng, date = new Date()) {
  const coords  = new Coordinates(lat, lng)
  const params  = CalculationMethod.MuslimWorldLeague()
  return new PrayerTimes(coords, date, params)
}

/** Returns { name, time } for the next upcoming prayer, or null if all passed. */
export function getNextPrayer(pt) {
  const now = new Date()
  for (const key of PRAYER_ORDER) {
    if (key === 'sunrise') continue  // skip sunrise for prayer countdown
    const t = pt[key]
    if (t instanceof Date && t > now) return { name: PRAYER_LABELS[key], time: t }
  }
  return null
}

/** Formats ms-until as "Xh Ym" or "Ym". */
export function formatCountdown(targetDate) {
  const diff = targetDate - new Date()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
