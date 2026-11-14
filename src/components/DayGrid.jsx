import React from 'react'
import { DAYS, headwordCountByDay } from '../lib/words.js'
import { bestAccuracyForDay } from '../lib/storage.js'

export default function DayGrid({ selected, onToggle }) {
  return (
    <div className="day-grid">
      {DAYS.map((day) => {
        const isSelected = selected.includes(day)
        const best = bestAccuracyForDay(day)
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
