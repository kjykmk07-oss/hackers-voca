import React, { useMemo } from 'react'
import { DAYS, headwordCountByDay } from '../lib/words.js'
import { loadDayStats, bestAccuracyFromStats } from '../lib/storage.js'

export default function DayGrid({ selected, onToggle }) {
  // Read stats once per mount (they only change after a session finishes,
  // and this grid remounts whenever the home/word-list screen is reopened).
  const stats = useMemo(() => loadDayStats(), [])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  return (
    <div className="day-grid">
      {DAYS.map((day) => {
        const isSelected = selectedSet.has(day)
        const best = bestAccuracyFromStats(stats, day)
        return (
          <button
            key={day}
            className={`day-btn${isSelected ? ' selected' : ''}`}
            onClick={() => onToggle(day)}
          >
            <span className="day-num">Day {day}</span>
            <span className="day-meta">{headwordCountByDay(day)}단어</span>
            <span className="day-meta">{best != null ? `최고 ${best}%` : '-'}</span>
          </button>
        )
      })}
    </div>
  )
}
