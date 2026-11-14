import React, { useEffect, useState } from 'react'
import { listResumableSessions, deleteSession, scopeLabel } from '../lib/storage.js'

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function sessionLabel(s) {
  return `Day ${s.days.join(', ')} · ${scopeLabel(s.scope)}${s.isRetry ? ' · 복습' : ''}`
}

export default function ResumeBanner({ onResume }) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    setSessions(listResumableSessions())
  }, [])

  function handleDelete(s) {
    const ok = window.confirm(
      `이 회차를 삭제할까요?\n\n${sessionLabel(s)} (${s.currentIndex}/${s.total})\n\n삭제하면 진행 기록이 사라지며 되돌릴 수 없습니다.`
    )
    if (!ok) return
    deleteSession(s.sessionKey)
    setSessions(listResumableSessions())
  }

  if (sessions.length === 0) return null

  return (
    <div className="resume-banner">
      <div className="resume-title">이어서 하기</div>
      <div className="resume-list">
        {sessions.map((s) => (
          <div key={s.sessionKey} className="resume-row">
            <button className="resume-item" onClick={() => onResume(s)}>
              {sessionLabel(s)} ({s.currentIndex}/{s.total})
            </button>
            <button
              className="resume-delete"
              onClick={() => handleDelete(s)}
              aria-label={`${sessionLabel(s)} 회차 삭제`}
              title="삭제"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
