import { shuffle } from './shuffle.js'

export function normalizeWord(w) {
  return w.trim().toLowerCase()
}

const SPLIT_RE = /[,;·/]\s*/

export function meaningTokens(meaning) {
  return meaning
    .split(SPLIT_RE)
    .map((t) => t.trim())
    .filter(Boolean)
}

// Strip parenthetical/bracketed qualifiers and whitespace so that
// "(부당하게) 이용하다" and "이용하다" compare as the same meaning.
function normToken(t) {
  return t.replace(/\(.*?\)|\[.*?\]|〈.*?〉|<.*?>/g, '').replace(/\s+/g, '').trim()
}

export function meaningsOverlap(a, b) {
  if (a === b) return true
  const ta = meaningTokens(a).map(normToken).filter(Boolean)
  const tb = meaningTokens(b).map(normToken).filter(Boolean)
  return ta.some((x) =>
    tb.some(
      (y) => x === y || (x.length >= 2 && y.length >= 2 && (x.includes(y) || y.includes(x)))
    )
  )
}

// Build a map of normalized-word -> pooled question item from a set of sense entries.
// Each item merges every occurrence of that exact word text, whether it appears as a
// headword or as a synonym of some other headword (so a word never produces two
// separate questions, and all of its valid meanings are accepted as correct).
export function buildWordPool(senses, { includeSynonyms }) {
  const map = new Map()

  function addOcc(text, sense, isHeadwordOcc) {
    const key = normalizeWord(text)
    if (!key) return
    let item = map.get(key)
    if (!item) {
      item = {
        key,
        display: text,
        meanings: [],
        pos: sense.pos,
        day: sense.day,
        isHeadword: false,
        sourceSenses: [],
      }
      map.set(key, item)
    }
    if (isHeadwordOcc) {
      item.isHeadword = true
      item.display = text
      item.day = sense.day
      item.pos = sense.pos
    }
    if (!item.meanings.includes(sense.meaning)) item.meanings.push(sense.meaning)
    if (!item.sourceSenses.some((s) => s.id === sense.id)) item.sourceSenses.push(sense)
  }

  for (const sense of senses) addOcc(sense.word, sense, true)
  if (includeSynonyms) {
    for (const sense of senses) {
      for (const syn of sense.synonyms) addOcc(syn, sense, false)
    }
  }
  return map
}

export function buildQuestionPool(allSenses, selectedDays, includeSynonyms) {
  const daySet = new Set(selectedDays)
  const scoped = allSenses.filter((s) => daySet.has(s.day))
  return [...buildWordPool(scoped, { includeSynonyms }).values()]
}

export function buildFullPool(allSenses, includeSynonyms) {
  return [...buildWordPool(allSenses, { includeSynonyms }).values()]
}

// Memoized { pool, byKey } per (scope, day-set). Small LRU so toggling many
// day combinations on the home screen doesn't grow memory without bound.
const POOL_CACHE_MAX = 8
const poolCache = new Map()
export function getSessionPool(allSenses, days, includeSynonyms) {
  const k = `${includeSynonyms ? 1 : 0}:${[...days].sort((a, b) => a - b).join(',')}`
  let entry = poolCache.get(k)
  if (entry) {
    poolCache.delete(k)
    poolCache.set(k, entry)
    return entry
  }
  const pool = buildQuestionPool(allSenses, days, includeSynonyms)
  entry = { pool, byKey: new Map(pool.map((i) => [i.key, i])) }
  poolCache.set(k, entry)
  if (poolCache.size > POOL_CACHE_MAX) poolCache.delete(poolCache.keys().next().value)
  return entry
}

export function primaryMeaning(item) {
  return item.meanings[0]
}

function candidateMeaning(cand, validMeanings) {
  for (const m of cand.meanings) {
    if (validMeanings.includes(m)) continue
    if (validMeanings.some((v) => meaningsOverlap(m, v))) continue
    return m
  }
  return null
}

// Every word that shares a headword/synonym group with the item.
function relatedKeys(item) {
  const set = new Set()
  for (const s of item.sourceSenses) {
    set.add(normalizeWord(s.word))
    for (const syn of s.synonyms) set.add(normalizeWord(syn))
  }
  return set
}

// True if cand and item belong to the same synonym group, checked from both
// sides (the scoped item may not know about groups from unselected Days).
function isRelated(cand, item, itemRelated) {
  if (itemRelated.has(cand.key)) return true
  return cand.sourceSenses.some(
    (s) => normalizeWord(s.word) === item.key || s.synonyms.some((x) => normalizeWord(x) === item.key)
  )
}

function orderedCandidates(pool, item) {
  const itemRelated = relatedKeys(item)
  const others = pool.filter((c) => c.key !== item.key && !isRelated(c, item, itemRelated))
  const samePos = shuffle(others.filter((c) => c.pos === item.pos))
  const otherPos = shuffle(others.filter((c) => c.pos !== item.pos))
  return [...samePos, ...otherPos]
}

// Build the 6 answer choices for a question item: 1 correct + 5 distractors.
export function buildChoices(item, scopedPool, fullPool, count = 6) {
  const correct = primaryMeaning(item)
  const seenMeaningTexts = new Set([correct])
  const distractors = []

  function tryPool(pool) {
    for (const cand of orderedCandidates(pool, item)) {
      if (distractors.length >= count - 1) break
      const m = candidateMeaning(cand, item.meanings)
      if (!m || seenMeaningTexts.has(m)) continue
      distractors.push({ text: m, fromWord: cand.display })
      seenMeaningTexts.add(m)
    }
  }

  tryPool(scopedPool)
  if (distractors.length < count - 1) tryPool(fullPool)

  const choices = shuffle([
    { text: correct, correct: true, fromWord: item.display },
    ...distractors.map((d) => ({ text: d.text, correct: false, fromWord: d.fromWord })),
  ])
  return choices
}
