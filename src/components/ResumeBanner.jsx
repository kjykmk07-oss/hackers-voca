import React, { useEffect, useState } from 'react'
import { listResumableSessions, scopeLabel } from '../lib/storage.js'

export default function ResumeBanner({ onResume }) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    setSessions(listResumableSessions())
  }, [])

  if (sessions.length === 0) return null

  return (
    <div className="resume-banner">
      <div className="resume-title">이어서 하기</div>
      <div className="resume-list">
        {sessions.map((s) => (
          <button key={s.sessionKey} className="resume-item" onClick={() => onResume(s)}>
            Day {s.days.join(', ')} · {scopeLabel(s.scope)} ({s.currentIndex}/{s.total})
          </button>
        ))}
      </div>
    </div>
  )
}
