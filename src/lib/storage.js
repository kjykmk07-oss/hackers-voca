const SESSIONS_KEY = 'vocaquiz:sessions:v1'
const DAYSTATS_KEY = 'vocaquiz:dayStats:v1'
const THEME_KEY = 'vocaquiz:theme'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function scopeLabel(scope) {
  return scope === 'headwordOnly' ? '표제어만' : '표제어+유의어'
}

export function makeSessionKey(days, scope) {
  const sorted = [...days].sort((a, b) => a - b)
  return `${scope}:${sorted.join(',')}`
}

export function loadSessions() {
  return readJSON(SESSIONS_KEY, {})
}

export function saveSession(session) {
  const all = loadSessions()
  all[session.sessionKey] = session
  writeJSON(SESSIONS_KEY, all)
}

export function deleteSession(sessionKey) {
  const all = loadSessions()
  delete all[sessionKey]
  writeJSON(SESSIONS_KEY, all)
}

export function listResumableSessions() {
  const all = loadSessions()
  return Object.values(all)
    .filter((s) => s.currentIndex < s.total)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function loadDayStats() {
  return readJSON(DAYSTATS_KEY, {})
}

export function saveDayStats(stats) {
  writeJSON(DAYSTATS_KEY, stats)
}

export function bestAccuracyForDay(day) {
  const stats = loadDayStats()
  const d = stats[day]
  if (!d || d.headwordAttempts + d.synonymAttempts === 0) return null
  return d.bestAccuracy ?? null
}

// Tally session results per-day and merge into persisted dayStats.
// itemsByKey: Map of itemKey -> pooled question item (word, meanings, day, isHeadword, sourceSenses)
export function recordSessionResults(session, itemsByKey) {
  const perDay = {} // day -> {attempts, correct, headwordAttempts, headwordCorrect, synonymAttempts, synonymCorrect, missed: []}

  session.order.forEach((itemKey, idx) => {
    const item = itemsByKey.get(itemKey)
    if (!item) return
    const answer = session.answers[idx]
    if (!answer) return
    const day = item.day
    if (!perDay[day]) {
      perDay[day] = {
        attempts: 0,
        correct: 0,
        headwordAttempts: 0,
        headwordCorrect: 0,
        synonymAttempts: 0,
        synonymCorrect: 0,
        missed: [],
      }
    }
    const bucket = perDay[day]
    bucket.attempts++
    if (answer.correct) bucket.correct++
    if (item.isHeadword) {
      bucket.headwordAttempts++
      if (answer.correct) bucket.headwordCorrect++
    } else {
      bucket.synonymAttempts++
      if (answer.correct) bucket.synonymCorrect++
    }
    if (!answer.correct) {
      bucket.missed.push({
        key: item.key,
        word: item.display,
        meaning: item.meanings[0],
        isHeadword: item.isHeadword,
        headwordInfo: !item.isHeadword && item.sourceSenses[0]
          ? { word: item.sourceSenses[0].word, day: item.sourceSenses[0].day }
          : null,
      })
    }
  })

  const stats = loadDayStats()
  for (const [dayStr, bucket] of Object.entries(perDay)) {
    const day = Number(dayStr)
    if (!stats[day]) {
      stats[day] = {
        bestAccuracy: 0,
        headwordAttempts: 0,
        headwordCorrect: 0,
        synonymAttempts: 0,
        synonymCorrect: 0,
        missed: {},
      }
    }
    const d = stats[day]
    const accuracy = bucket.attempts ? Math.round((bucket.correct / bucket.attempts) * 100) : 0
    d.bestAccuracy = Math.max(d.bestAccuracy, accuracy)
    d.headwordAttempts += bucket.headwordAttempts
    d.headwordCorrect += bucket.headwordCorrect
    d.synonymAttempts += bucket.synonymAttempts
    d.synonymCorrect += bucket.synonymCorrect
    for (const m of bucket.missed) {
      if (!d.missed[m.key]) {
        d.missed[m.key] = { ...m, count: 0 }
      }
      d.missed[m.key].count++
    }
  }
  saveDayStats(stats)
  return perDay
}

export function loadTheme() {
  return readJSON(THEME_KEY, null)
}

export function saveTheme(theme) {
  writeJSON(THEME_KEY, theme)
}
