import React from 'react'

function pct(correct, attempts) {
  if (!attempts) return '-'
  return `${Math.round((correct / attempts) * 100)}%`
}

export default function ResultsScreen({ data, onRetryWrong, onRestart, onHome }) {
  const { perDay, attempts, correct, hwAttempts, hwCorrect, synAttempts, synCorrect, missedList } =
    data

  const dayRows = Object.entries(perDay)
    .map(([day, b]) => ({ day: Number(day), ...b }))
    .sort((a, b) => a.day - b.day)

  return (
    <div className="screen results-screen">
      <h2>결과</h2>
      <div className="score-big">
        {correct} / {attempts} ({pct(correct, attempts)})
      </div>
      {data.session.isRetry && (
        <p className="retry-note">복습 결과는 Day별 최고 기록에 반영되지 않습니다.</p>
      )}

      <h3>Day별 정답률</h3>
      <table className="results-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>정답</th>
            <th>시도</th>
            <th>정답률</th>
          </tr>
        </thead>
        <tbody>
          {dayRows.map((r) => (
            <tr key={r.day}>
              <td>{r.day}</td>
              <td>{r.correct}</td>
              <td>{r.attempts}</td>
              <td>{pct(r.correct, r.attempts)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>유형별 정답률</h3>
      <div className="type-stats">
        <div>표제어: {hwCorrect}/{hwAttempts} ({pct(hwCorrect, hwAttempts)})</div>
        <div>유의어: {synCorrect}/{synAttempts} ({pct(synCorrect, synAttempts)})</div>
      </div>

      <h3>틀린 단어 ({missedList.length})</h3>
      <ul className="missed-list">
        {missedList.map((m) => (
          <li key={m.key}>
            <strong>{m.word}</strong> — {m.meaning}
            {m.headwordInfo && (
              <span className="missed-sub">
                {' '}
                ({m.headwordInfo.word}, Day {m.headwordInfo.day}의 유의어)
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="results-actions">
        <button className="secondary-btn" disabled={missedList.length === 0} onClick={onRetryWrong}>
          틀린 것만 다시 풀기
        </button>
        <button className="secondary-btn" onClick={onRestart}>
          처음부터
        </button>
        <button className="primary-btn" onClick={onHome}>
          시작 화면
        </button>
      </div>
    </div>
  )
}
