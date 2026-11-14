import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { SENSES, DAYS } from './lib/words.js'
import { buildQuestionPool, buildFullPool } from './lib/pool.js'
import {
  makeSessionKey,
  saveSession,
  deleteSession,
  recordSessionResults,
  loadTheme,
  saveTheme,
} from './lib/storage.js'
import { shuffle } from './lib/shuffle.js'
import HomeScreen from './components/HomeScreen.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import WordListScreen from './components/WordListScreen.jsx'

function nowTheme() {
  const saved = loadTheme()
  if (saved) return saved
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export default function App() {
  const [theme, setTheme] = useState(nowTheme)
  const [screen, setScreen] = useState('home')
  const [activeSession, setActiveSession] = useState(null)
  const [resultsData, setResultsData] = useState(null)
  const [wordListInitialDays, setWordListInitialDays] = useState(DAYS)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const fullPoolHeadwordOnly = useMemo(() => buildFullPool(SENSES, false), [])
  const fullPoolWithSyn = useMemo(() => buildFullPool(SENSES, true), [])

  const poolForSession = useCallback(
    (days, scope) => buildQuestionPool(SENSES, days, scope === 'headwordAndSynonym'),
    []
  )

  const itemsByKeyForSession = useCallback(
    (days, scope) => {
      const pool = poolForSession(days, scope)
      return new Map(pool.map((i) => [i.key, i]))
    },
    [poolForSession]
  )

  function startNewSession(days, scope) {
    const pool = poolForSession(days, scope)
    const order = shuffle(pool.map((i) => i.key))
    const session = {
      sessionKey: makeSessionKey(days, scope),
      days: [...days].sort((a, b) => a - b),
      scope,
      order,
      total: order.length,
      currentIndex: 0,
      choicesByIndex: {},
      answers: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveSession(session)
    setActiveSession(session)
    setScreen('quiz')
  }

  function resumeSession(session) {
    setActiveSession(session)
    setScreen('quiz')
  }

  function persist(session) {
    const next = { ...session, updatedAt: Date.now() }
    saveSession(next)
    setActiveSession(next)
    return next
  }

  function exitQuiz(session) {
    persist(session)
    setActiveSession(null)
    setScreen('home')
  }

  function finishSession(session) {
    const itemsByKey = itemsByKeyForSession(session.days, session.scope)
    const perDay = recordSessionResults(session, itemsByKey)
    deleteSession(session.sessionKey)

    let attempts = 0,
      correct = 0,
      hwAttempts = 0,
      hwCorrect = 0,
      synAttempts = 0,
      synCorrect = 0
    const missedList = []
    session.order.forEach((key, idx) => {
      const item = itemsByKey.get(key)
      const answer = session.answers[idx]
      if (!item || !answer) return
      attempts++
      if (answer.correct) correct++
      if (item.isHeadword) {
        hwAttempts++
        if (answer.correct) hwCorrect++
      } else {
        synAttempts++
        if (answer.correct) synCorrect++
      }
      if (!answer.correct) {
        missedList.push({
          key: item.key,
          word: item.display,
          meaning: item.meanings[0],
          isHeadword: item.isHeadword,
          day: item.day,
          headwordInfo:
            !item.isHeadword && item.sourceSenses[0]
              ? { word: item.sourceSenses[0].word, day: item.sourceSenses[0].day }
              : null,
        })
      }
    })

    setResultsData({
      session,
      perDay,
      attempts,
      correct,
      hwAttempts,
      hwCorrect,
      synAttempts,
      synCorrect,
      missedList,
    })
    setActiveSession(null)
    setScreen('results')
  }

  function retryWrong(data) {
    const keys = data.missedList.map((m) => m.key)
    if (keys.length === 0) return
    const session = {
      sessionKey: `${data.session.sessionKey}:retry:${Date.now()}`,
      days: data.session.days,
      scope: data.session.scope,
      order: shuffle(keys),
      total: keys.length,
      currentIndex: 0,
      choicesByIndex: {},
      answers: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveSession(session)
    setActiveSession(session)
    setScreen('quiz')
  }

  function restartSame(data) {
    startNewSession(data.session.days, data.session.scope)
  }

  function openWordList(days) {
    setWordListInitialDays(days && days.length ? days : DAYS)
    setScreen('wordlist')
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Hackers TOEFL Voca Quiz</h1>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="다크모드 전환">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </header>

      {screen === 'home' && (
        <HomeScreen
          onStart={startNewSession}
          onResume={resumeSession}
          onOpenWordList={openWordList}
          poolForSession={poolForSession}
        />
      )}

      {screen === 'quiz' && activeSession && (
        <QuizScreen
          session={activeSession}
          setSession={(s) => setActiveSession(s)}
          persist={persist}
          onExit={exitQuiz}
          onFinish={finishSession}
          scopedPool={poolForSession(activeSession.days, activeSession.scope)}
          fullPool={activeSession.scope === 'headwordAndSynonym' ? fullPoolWithSyn : fullPoolHeadwordOnly}
          itemsByKey={itemsByKeyForSession(activeSession.days, activeSession.scope)}
        />
      )}

      {screen === 'results' && resultsData && (
        <ResultsScreen
          data={resultsData}
          onRetryWrong={() => retryWrong(resultsData)}
          onRestart={() => restartSame(resultsData)}
          onHome={() => setScreen('home')}
        />
      )}

      {screen === 'wordlist' && (
        <WordListScreen initialDays={wordListInitialDays} onBack={() => setScreen('home')} />
      )}
    </div>
  )
}
