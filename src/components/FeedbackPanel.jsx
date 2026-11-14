import React from 'react'

export default function FeedbackPanel({ correct, item, correctChoice, chosenChoice }) {
  const correctText = correctChoice.text
  const matchingSense =
    item.sourceSenses.find((s) => s.meaning === correctText) || item.sourceSenses[0]

  const headwordInfo = !item.isHeadword
    ? { word: matchingSense.word, day: matchingSense.day }
    : null

  return (
    <div className={`feedback-panel ${correct ? 'feedback-correct' : 'feedback-wrong'}`}>
      <div className="feedback-title">{correct ? 'Correct' : 'Incorrect'}</div>

      {!correct && (
        <div className="feedback-wrong-note">
          "{chosenChoice.text}"는 <strong>{chosenChoice.fromWord}</strong>의 뜻
        </div>
      )}

      <div className="feedback-meaning">
        {headwordInfo && (
          <div className="feedback-synonym-of">
            {item.display} → <strong>{headwordInfo.word}</strong> (Day {headwordInfo.day})의 유의어
          </div>
        )}
        <div className="feedback-meaning-text">{correctText}</div>
        <div className="feedback-example">{matchingSense.example}</div>
      </div>

      {headwordInfo && (
        <div className="feedback-synonym-list">
          <strong>{headwordInfo.word}</strong>의 유의어 전체: {matchingSense.synonyms.join(', ')}
        </div>
      )}
    </div>
  )
}
