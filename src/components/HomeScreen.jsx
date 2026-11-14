import React, { useMemo, useState } from 'react'
import { DAYS } from '../lib/words.js'
import DayGrid from './DayGrid.jsx'
import ResumeBanner from './ResumeBanner.jsx'

export default function HomeScreen({ onStart, onResume, onOpenWordList, poolForSession }) {
  const [selected, setSelected] = useState([...DAYS])
  const [scope, setScope] = useState('headwordAndSynonym')

  function toggleDay(day) {
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  function toggleAll() {
    setSelected((prev) => (prev.length === DAYS.length ? [] : [...DAYS]))
  }

  const totalCount = useMemo(() => {
    if (selected.length === 0) return 0
    return poolForSession(selected, scope).length
  }, [selected, scope, poolForSession])

  return (
    <div className="screen home-screen">
      <ResumeBanner onResume={onResume} />

      <div className="section-row">
        <button className="secondary-btn" onClick={toggleAll}>
          {selected.length === DAYS.length ? '전체 해제' : '전체 선택'}
        </button>
        <button className="secondary-btn" onClick={() => onOpenWordList(selected)}>
          단어 목록
        </button>
      </div>

      <DayGrid selected={selected} onToggle={toggleDay} />

      <div className="scope-toggle">
        <button
          className={`scope-btn${scope === 'headwordOnly' ? ' selected' : ''}`}
          onClick={() => setScope('headwordOnly')}
        >
          표제어만
        </button>
        <button
          className={`scope-btn${scope === 'headwordAndSynonym' ? ' selected' : ''}`}
          onClick={() => setScope('headwordAndSynonym')}
        >
          표제어 + 유의어
        </button>
      </div>

      <div className="total-preview">총 문제 수: {totalCount}</div>

      <button
        className="primary-btn start-btn"
        disabled={selected.length === 0}
        onClick={() => onStart(selected, scope)}
      >
        시작
      </button>
    </div>
  )
}
