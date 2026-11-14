const SESSIONS_KEY = 'vocaquiz:sessions:v1'
const DAYSTATS_KEY = 'vocaquiz:dayStats:v1'
const THEME_KEY = 'vocaquiz:theme'

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function trySet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// Never throws: on quota errors, sessions are pruned and the write retried once.
function writeJSON(key, value) {
  if (trySet(key, value)) return true
  if (key === SESSIONS_KEY) {
    return trySet(key, pruneSessions(value, { aggressive: true }))
  }
  return false
}

export function isRetrySession(s) {
  return Boolean(s.isRetry) || String(s.sessionKey).includes(':retry:')
}

// Keep only the current question's cached choices (no back-navigation exists,
// so earlier questions' choices are never needed again).
function compactSession(s) {
  const cur = s.choicesByIndex && s.choicesByIndex[s.currentIndex]
  return { ...s, choicesByIndex: cur ? { [s.currentIndex]: cur } : {} }
}

// Drop sessions untouched for 7+ days, keep only the newest retry session,
// and compact every session. `aggressive` additionally caps to the 3 newest.
function pruneSessions(all, { aggressive = false } = {}) {
  const now = Date.now()
  const list = Object.values(all || {})
    .filter((s) => s && s.sessionKey && now - (s.updatedAt || 0) < SESSION_MAX_AGE_MS)
    .map(compactSession)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const retries = list.filter(isRetrySession)
  let keep = list.filter((s) => !isRetrySession(s)).concat(retries.slice(0, 1))
  keep.sort((a, b) => b.updatedAt - a.updatedAt)
  if (aggressive) keep = keep.slice(0, 3)
  return Object.fromEntries(keep.map((s) => [s.sessionKey, s]))
}

export function pruneStoredSessions() {
  const all = readJSON(SESSIONS_KEY, {})
  writeJSON(SESSIONS_KEY, pruneSessions(all))
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
  all[session.sessionKey] = compactSession(session)
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

export function bestAccuracyFromStats(stats, day) {
  const d = stats[day]
  if (!d || d.headwordAttempts + d.synonymAttempts === 0) return null
  return d.bestAccuracy ?? null
}

// Pure tally of a session's answers per day (does not persist anything).
// itemsByKey: Map of itemKey -> pooled question item (word, meanings, day, isHeadword, sourceSenses)
export function tallySession(session, itemsByKey) {
  const perDay = {}

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

  return perDay
}

// Tally session results per-day and merge into persisted dayStats.
// Retry ("틀린 것만 다시 풀기") sessions are tallied for display only and never
// touch dayStats, so they can't inflate a Day's best accuracy.
export function recordSessionResults(session, itemsByKey) {
  const perDay = tallySession(session, itemsByKey)
  if (isRetrySession(session)) return perDay

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
