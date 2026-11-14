import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { buildChoices } from '../lib/pool.js'
import ChoiceButton from './ChoiceButton.jsx'
import FeedbackPanel from './FeedbackPanel.jsx'

export default function QuizScreen({
  session,
  setSession,
  persist,
  onExit,
  onFinish,
  scopedPool,
  fullPool,
  itemsByKey,
}) {
  const idx = session.currentIndex
  const itemKey = session.order[idx]
  const item = itemsByKey.get(itemKey)

  const [selectedIndex, setSelectedIndex] = useState(null)

  const choices = useMemo(() => {
    const cached = session.choicesByIndex[idx]
    if (cached) return cached
    return buildChoices(item, scopedPool, fullPool, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, itemKey, session.choicesByIndex])

  useEffect(() => {
    if (!session.choicesByIndex[idx]) {
      persist({
        ...session,
        choicesByIndex: { ...session.choicesByIndex, [idx]: choices },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, itemKey])

  useEffect(() => {
    const existingAnswer = session.answers[idx]
    setSelectedIndex(existingAnswer ? existingAnswer.chosenIndex : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const locked = selectedIndex != null

  const handleChoice = useCallback(
    (i) => {
      if (locked) return
      const correct = choices[i].correct
      setSelectedIndex(i)
      const nextSession = {
        ...session,
        answers: { ...session.answers, [idx]: { chosenIndex: i, correct } },
      }
      persist(nextSession)
    },
    [locked, choices, session, idx, persist]
  )

  const handleNext = useCallback(() => {
    if (!locked) return
    if (idx + 1 >= session.total) {
      onFinish(session)
    } else {
      const nextSession = { ...session, currentIndex: idx + 1 }
      persist(nextSession)
    }
  }, [locked, idx, session, onFinish, persist])

  useEffect(() => {
    function onKeyDown(e) {
      const k = e.key
      if (!locked) {
        const letterIdx = 'abcdef'.indexOf(k.toLowerCase())
        const numIdx = '123456'.indexOf(k)
        const i = letterIdx !== -1 ? letterIdx : numIdx
        if (i !== -1 && i < choices.length) {
          handleChoice(i)
          return
        }
      } else if (k === 'Enter' || k === 'ArrowRight') {
        handleNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [locked, choices, handleChoice, handleNext])

  if (!item) {
    return (
      <div className="screen quiz-screen">
        <p>단어를 불러올 수 없습니다.</p>
        <button className="secondary-btn" onClick={() => onExit(session)}>
          Exit
        </button>
      </div>
    )
  }

  const progressPct = Math.round((idx / session.total) * 100)

  return (
    <div className="screen quiz-screen">
      <div className="quiz-top">
        <button className="exit-btn" onClick={() => onExit(session)}>
          Exit
        </button>
        <div className="progress-wrap">
          <div className="progress-text">
            {idx + 1} / {session.total}
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="quiz-word-area">
        <div className="quiz-pos">{item.pos}</div>
        <div className="quiz-word">{item.display}</div>
      </div>

      <div className="choice-grid">
        {choices.map((choice, i) => {
          let state = 'idle'
          if (locked) {
            if (choice.correct) state = 'correct'
            else if (i === selectedIndex) state = 'wrong'
            else state = 'dimmed'
          }
          return (
            <ChoiceButton
              key={i}
              index={i}
              choice={choice}
              state={state}
              disabled={locked}
              onClick={handleChoice}
            />
          )
        })}
      </div>

      {locked && (
        <FeedbackPanel
          correct={choices[selectedIndex].correct}
          item={item}
          correctChoice={choices.find((c) => c.correct)}
          chosenChoice={choices[selectedIndex]}
        />
      )}

      <button className="next-fab" disabled={!locked} onClick={handleNext} aria-label="다음 문제">
        &gt;
      </button>
    </div>
  )
}
