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

export function meaningsOverlap(a, b) {
  if (a === b) return true
  const ta = meaningTokens(a)
  const tb = meaningTokens(b)
  return ta.some((t) => tb.includes(t))
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

export function primaryMeaning(item) {
  return item.meanings[0]
}

function candidateMeaning(cand, correct, excludeMeanings) {
  for (const m of cand.meanings) {
    if (excludeMeanings.has(m)) continue
    if (meaningsOverlap(m, correct)) continue
    return m
  }
  return null
}

function orderedCandidates(pool, item) {
  const others = pool.filter((c) => c.key !== item.key)
  const samePos = shuffle(others.filter((c) => c.pos === item.pos))
  const otherPos = shuffle(others.filter((c) => c.pos !== item.pos))
  return [...samePos, ...otherPos]
}

// Build the 6 answer choices for a question item: 1 correct + 5 distractors.
export function buildChoices(item, scopedPool, fullPool, count = 6) {
  const correct = primaryMeaning(item)
  const excludeMeanings = new Set(item.meanings)
  const seenMeaningTexts = new Set([correct])
  const distractors = []

  function tryPool(pool) {
    for (const cand of orderedCandidates(pool, item)) {
      if (distractors.length >= count - 1) break
      const m = candidateMeaning(cand, correct, excludeMeanings)
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
