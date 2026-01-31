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
    <div className="w-100">
      <div className="d-flex justify-content-between align-items-center">
        <button
          type="button"
          onClick={onPrevMonth}
          className="btn btn-light btn-sm border fw-bold"
          style={{ width: 32, height: 32, padding: 0 }}
          aria-label="Mês anterior"
        >
          &lt;
        </button>
        <div className="fw-semibold text-capitalize" style={{ fontSize: 13 }}>
          {currentDate.toLocaleString('pt-PT', { month: 'long' })} {year}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="btn btn-light btn-sm border fw-bold"
          style={{ width: 32, height: 32, padding: 0 }}
          aria-label="Mês seguinte"
        >
          &gt;
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginTop: 6,
        }}
      >
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((h) => (
          <div key={h} className="text-center text-muted" style={{ fontSize: 11 }}>
            {h}
          </div>
        ))}

        {cells.map((c, i) => {
          if (!c) {
            return <div key={i} className="rounded-2" style={{ minHeight: 26 }} />
          }

          const meta = typeof getDayMeta === 'function' ? getDayMeta(c) : null
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
          const isToday = c.toDateString() === new Date().toDateString()

          return (
            <button
              key={i}
              type="button"
              className={`mc-cell w-100 border-0 bg-transparent rounded-2 p-0 py-1 text-center ${
                isToday ? 'today' : ''
              } ${status ? `mc-${status}` : ''} ${occBucket ? `mc-${occBucket}` : ''}`}
              onClick={() => onSelectDate(c)}
              title={
                meta
                  ? `${status === 'holiday' ? 'Feriado' : status === 'closed' ? 'Fechado' : 'Aberto'}${
                      occ == null ? '' : ` • Ocupação: ${Math.round(occ * 100)}%`
                    }`
                  : undefined
              }
            >
              {c.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
