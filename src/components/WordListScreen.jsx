import React, { useMemo, useState } from 'react'
import { SENSES, DAYS } from '../lib/words.js'
import DayGrid from './DayGrid.jsx'

export default function WordListScreen({ initialDays, onBack }) {
  const [selected, setSelected] = useState(initialDays)
  const [query, setQuery] = useState('')

  function toggleDay(day) {
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  function toggleAll() {
    setSelected((prev) => (prev.length === DAYS.length ? [] : [...DAYS]))
  }

  const rows = useMemo(() => {
    const daySet = new Set(selected)
    const q = query.trim().toLowerCase()
    return SENSES.filter((s) => daySet.has(s.day)).filter((s) => {
      if (!q) return true
      if (s.word.toLowerCase().includes(q)) return true
      return s.synonyms.some((syn) => syn.toLowerCase().includes(q))
    }).sort((a, b) => a.day - b.day || a.no - b.no || a.sense - b.sense)
  }, [selected, query])

  return (
    <div className="screen wordlist-screen">
      <div className="section-row">
        <button className="secondary-btn" onClick={onBack}>
          ← 뒤로
        </button>
        <button className="secondary-btn" onClick={toggleAll}>
          {selected.length === DAYS.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      <DayGrid selected={selected} onToggle={toggleDay} />

      <input
        className="search-input"
        placeholder="표제어 또는 유의어 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="wordlist-count">{rows.length}개</div>

      <table className="results-table wordlist-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>No</th>
            <th>표제어</th>
            <th>품사</th>
            <th>뜻</th>
            <th>유의어</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>{s.day}</td>
              <td>{s.no}</td>
              <td>{s.word}</td>
              <td>{s.pos}</td>
              <td>{s.meaning}</td>
              <td>{s.synonyms.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
