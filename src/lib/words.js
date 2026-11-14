import raw from '../data/words.json'

export const SENSES = raw.map((e) => ({
  ...e,
  id: `${e.day}-${e.no}-${e.sense}`,
}))

export const DAYS = Array.from(new Set(SENSES.map((s) => s.day))).sort((a, b) => a - b)

const byDayCache = new Map()
export function sensesByDay(day) {
  if (!byDayCache.has(day)) {
    byDayCache.set(day, SENSES.filter((s) => s.day === day))
  }
  return byDayCache.get(day)
}

const headwordCountCache = new Map()
export function headwordCountByDay(day) {
  if (!headwordCountCache.has(day)) {
    headwordCountCache.set(day, new Set(sensesByDay(day).map((s) => s.no)).size)
  }
  return headwordCountCache.get(day)
}

const synonymCountCache = new Map()
export function synonymCountByDay(day) {
  if (!synonymCountCache.has(day)) {
    synonymCountCache.set(
      day,
      sensesByDay(day).reduce((sum, s) => sum + s.synonyms.length, 0)
    )
  }
  return synonymCountCache.get(day)
}

export function totalHeadwordCount() {
  return new Set(SENSES.map((s) => `${s.day}-${s.no}`)).size
}
