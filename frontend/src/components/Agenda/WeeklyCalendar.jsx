import React from 'react'
import './Agenda.css'

const HOUR_START = 8
const HOUR_END = 19
const HOUR_HEIGHT = 40 // px per hour (more compact to ensure 08:00-19:00 fits)

function timeToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes()
}

export default function WeeklyCalendar({ weekStart, appointments = [] }) {
  const days = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  // include HOUR_END as the last visible hour (inclusive)
  const totalHours = HOUR_END - HOUR_START + 1
  const gridHeight = totalHours * HOUR_HEIGHT
  const timeColWidth = 80

  return (
    <div className="w-100">
      <div className="d-flex">
        <div className="flex-shrink-0" style={{ width: timeColWidth }} />
        {days.map((d) => (
          <div
            key={d.toDateString()}
            className="flex-grow-1 py-2 text-center border-bottom bg-light small fw-semibold"
          >
            {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
          </div>
        ))}
      </div>

      <div className="d-flex" style={{ height: gridHeight }}>
        <div className="flex-shrink-0 bg-white" style={{ width: timeColWidth }}>
          {Array.from({ length: totalHours }).map((_, i) => (
            <div
              key={i}
              className="d-flex align-items-center border-bottom px-2 text-muted small"
              style={{ height: HOUR_HEIGHT }}
            >
              {String(HOUR_START + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        <div className="d-flex flex-grow-1" style={{ position: 'relative' }}>
          {days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={dayIndex === 0 ? 'flex-grow-1 position-relative' : 'flex-grow-1 position-relative border-start'}
            >
              <div className="position-relative" style={{ height: gridHeight }}>
                {/* place appointments for this day */}
                {appointments
                  .filter((a) => {
                    const s = new Date(a.data_inicio)
                    return s.getFullYear() === day.getFullYear() && s.getMonth() === day.getMonth() && s.getDate() === day.getDate()
                  })
                  .map((a) => {
                    const start = new Date(a.data_inicio)
                    const end = new Date(a.data_fim)
                    const minutesFromDayStart = timeToMinutes(start) - HOUR_START * 60
                    const durationMinutes = (end - start) / 60000
                    const top = (minutesFromDayStart / 60) * HOUR_HEIGHT
                    const height = (durationMinutes / 60) * HOUR_HEIGHT
                    const color = a.color || '#c6e9ff'

                    return (
                      <div
                        key={a.id}
                        className="position-absolute start-0 end-0 mx-2 rounded-2 shadow-sm p-2 overflow-hidden"
                        title={`${a.paciente_nome} — ${a.tipo_consulta}`}
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(28, height)}px`,
                          background: color,
                          color: '#033',
                        }}
                      >
                        <div className="fw-semibold" style={{ fontSize: 13 }}>
                          {a.paciente_nome}
                        </div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {new Date(a.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
