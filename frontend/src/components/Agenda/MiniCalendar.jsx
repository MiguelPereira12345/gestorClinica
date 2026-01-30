import React from 'react'
import './Agenda.css'

export default function MiniCalendar({
  currentDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  getDayMeta,
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const daysBefore = first.getDay() === 0 ? 6 : first.getDay() - 1 // start monday

  const cells = []
  for (let i = 0; i < daysBefore; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))

  return (
    <div className="mc-root">
      <div className="mc-header">
        <button onClick={onPrevMonth} className="mc-nav">&lt;</button>
        <div className="mc-title">{currentDate.toLocaleString(undefined, { month: 'long' })} {year}</div>
        <button onClick={onNextMonth} className="mc-nav">&gt;</button>
      </div>
      <div className="mc-grid">
        {['S','T','Q','Q','S','S','D'].map((h) => <div key={h} className="mc-weekday">{h}</div>)}
      {cells.map((c, i) => (
        (() => {
          const meta = c && typeof getDayMeta === 'function' ? getDayMeta(c) : null
          const status = meta?.status || ''
          const occ = typeof meta?.occupancy === 'number' ? meta.occupancy : null
          const occBucket =
            occ == null
              ? ''
              : occ >= 0.8
                ? 'occ-4'
                : occ >= 0.6
                  ? 'occ-3'
                  : occ >= 0.35
                    ? 'occ-2'
                    : occ > 0
                      ? 'occ-1'
                      : 'occ-0'
          const isToday = c && c.toDateString() === new Date().toDateString()

          return (
            <div
              key={i}
              className={`mc-cell ${isToday ? 'today' : ''} ${status ? `mc-${status}` : ''} ${occBucket ? `mc-${occBucket}` : ''}`}
              onClick={() => c && onSelectDate(c)}
              title={
                meta
                  ? `${status === 'holiday' ? 'Feriado' : status === 'closed' ? 'Fechado' : 'Aberto'}${occ == null ? '' : ` • Ocupação: ${Math.round(occ * 100)}%`}`
                  : undefined
              }
            >
              {c ? c.getDate() : ''}
            </div>
          )
        })()
      ))}
      </div>
    </div>
  )
}
