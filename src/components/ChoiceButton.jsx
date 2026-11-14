import React from 'react'

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function ChoiceButton({ index, choice, state, disabled, onClick }) {
  // state: 'idle' | 'correct' | 'wrong' | 'dimmed'
  return (
    <button
      className={`choice-btn choice-${state}`}
      disabled={disabled}
      onClick={() => onClick(index)}
    >
      <span className="choice-label">({LABELS[index]})</span>
      <span className="choice-text">{choice.text}</span>
    </button>
  )
}
