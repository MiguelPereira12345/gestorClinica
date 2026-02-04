import React from 'react'
import './Agenda.css'

const HOUR_START = 8
const HOUR_END = 19
const HOUR_HEIGHT = 40 // px per hour (more compact to ensure 08:00-19:00 fits)

function timeToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function layoutOverlaps(items) {
  const sorted = [...items]
    .map((appt) => {
      const s = new Date(appt.data_inicio)
      const e = new Date(appt.data_fim)
      return { appt, startMin: timeToMinutes(s), endMin: timeToMinutes(e) }
    })
    .sort((a, b) => a.startMin - b.startMin)

  // Partition into overlap clusters so widths are computed per cluster.
  const clusters = []
  let current = []
  let currentEnd = -Infinity

  for (const item of sorted) {
    if (current.length === 0) {
      current = [item]
      currentEnd = item.endMin
      continue
    }

    if (item.startMin < currentEnd) {
      current.push(item)
      currentEnd = Math.max(currentEnd, item.endMin)
    } else {
      clusters.push(current)
      current = [item]
      currentEnd = item.endMin
    }
  }
  if (current.length) clusters.push(current)

  const placed = []
  for (const cluster of clusters) {
    const colEnd = []
    let clusterCols = 1

    const clusterPlaced = cluster.map(({ appt, startMin, endMin }) => {
      let col = colEnd.findIndex((end) => end <= startMin)
      if (col === -1) {
        col = colEnd.length
        colEnd.push(endMin)
      } else {
        colEnd[col] = endMin
      }

      clusterCols = Math.max(clusterCols, colEnd.length)
      return { appt, startMin, endMin, col }
    })

    for (const p of clusterPlaced) placed.push({ ...p, clusterCols })
  }

  return placed
}

export default function WeeklyCalendar({ weekStart, appointments = [], resources = [], onSelectAppointment }) {
  const days = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const resourceList = Array.isArray(resources) ? resources : []
  const resourceCount = Math.max(1, resourceList.length)
  const resourceIndexById = new Map(resourceList.map((r, idx) => [Number(r.id), idx]))
  const resourceById = new Map(resourceList.map((r) => [Number(r.id), r]))

  // include HOUR_END as the last visible hour (inclusive)
  const totalHours = HOUR_END - HOUR_START + 1
  const gridHeight = totalHours * HOUR_HEIGHT
  const timeColWidth = 80

  return (
    <div className="w-100">
      <div className="d-flex border-bottom bg-light rounded-top-3">
        <div className="flex-shrink-0 bg-white" style={{ width: timeColWidth }} />
        {days.map((d) => (
          <div
            key={d.toDateString()}
            className="flex-grow-1 py-2 text-center small fw-semibold"
            style={{ minWidth: 0 }}
          >
            {d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit' }).replace(',', '')}
          </div>
        ))}
      </div>

      <div className="d-flex bg-white rounded-bottom-3 overflow-hidden" style={{ height: gridHeight }}>
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

        <div className="d-flex flex-grow-1" style={{ position: 'relative', minWidth: 0 }}>
          {days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={dayIndex === 0 ? 'flex-grow-1 position-relative' : 'flex-grow-1 position-relative border-start'}
              style={{ minWidth: 0 }}
            >
              <div className="position-relative" style={{ height: gridHeight }}>
                {/* per-doctor lanes inside the day (prevents different doctors from shrinking each other) */}
                {resourceList.map((r, idx) => (
                  <div
                    key={r.id}
                    className={idx === 0 ? 'position-absolute top-0 bottom-0' : 'position-absolute top-0 bottom-0 border-start'}
                    style={{
                      left: `${(idx * 100) / resourceCount}%`,
                      width: `${100 / resourceCount}%`,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {resourceList.length === 0
                  ? null
                  : resourceList.flatMap((resource) => {
                      const perDoctor = appointments.filter((a) => {
                        const s = new Date(a.data_inicio)
                        return isSameDay(s, day) && Number(a.medico_id) === Number(resource.id)
                      })

                      const placed = layoutOverlaps(perDoctor)
                      const laneIndex = resourceIndexById.get(Number(resource.id)) ?? 0
                      const laneLeftPct = (laneIndex * 100) / resourceCount
                      const laneWidthPct = 100 / resourceCount

                      return placed.map(({ appt, startMin, endMin, col, clusterCols }) => {
                        const start = new Date(appt.data_inicio)
                        const end = new Date(appt.data_fim)
                        const minutesFromDayStart = startMin - HOUR_START * 60
                        const durationMinutes = endMin - startMin
                        const top = (minutesFromDayStart / 60) * HOUR_HEIGHT
                        const height = (durationMinutes / 60) * HOUR_HEIGHT
                        const color = appt.color || resource.color || '#c6e9ff'

                        const withinLaneWidthPct = laneWidthPct / Math.max(1, clusterCols)
                        const withinLaneLeftPct = laneLeftPct + col * withinLaneWidthPct

                        const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        const doctorName = resourceById.get(Number(appt.medico_id))?.name || ''

                        const handleOpen = () => {
                          if (typeof onSelectAppointment === 'function') onSelectAppointment(appt)
                        }

                        return (
                          <div
                            key={appt.id}
                            className="agenda-appt position-absolute rounded-3 shadow-sm p-2 overflow-hidden border"
                            role={typeof onSelectAppointment === 'function' ? 'button' : undefined}
                            tabIndex={typeof onSelectAppointment === 'function' ? 0 : undefined}
                            onClick={typeof onSelectAppointment === 'function' ? handleOpen : undefined}
                            onKeyDown={
                              typeof onSelectAppointment === 'function'
                                ? (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      handleOpen()
                                    }
                                  }
                                : undefined
                            }
                            title={`${appt.utente_nome} — ${startStr}–${endStr}${appt.tipo_consulta ? ` • ${appt.tipo_consulta}` : ''}${doctorName ? ` • ${doctorName}` : ''}`}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(40, height)}px`,
                              background: color,
                              color: '#1e2a35',
                              borderColor: 'rgba(30, 42, 53, 0.18)',
                              left: `calc(${withinLaneLeftPct}% + 4px)`,
                              width: `calc(${withinLaneWidthPct}% - 8px)`,
                              zIndex: 1,
                            }}
                          >
                            <div className="fw-semibold text-truncate" style={{ fontSize: 13, lineHeight: 1.15 }}>
                              {appt.utente_nome}
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: 11, lineHeight: 1.15, marginTop: 2 }}>
                              {startStr}–{endStr}
                              {appt.tipo_consulta ? ` • ${appt.tipo_consulta}` : ''}
                            </div>
                            {doctorName ? (
                              <div className="text-muted text-truncate" style={{ fontSize: 11, lineHeight: 1.15, marginTop: 2, opacity: 0.85 }}>
                                {doctorName}
                              </div>
                            ) : null}
                          </div>
                        )
                      })
                    })}

                {/* fallback if there are appointments but no resources list */}
                {resourceList.length === 0
                  ? layoutOverlaps(
                      appointments.filter((a) => {
                        const s = new Date(a.data_inicio)
                        return isSameDay(s, day)
                      }),
                    ).map(({ appt, startMin, endMin }) => {
                      const start = new Date(appt.data_inicio)
                      const end = new Date(appt.data_fim)
                      const minutesFromDayStart = startMin - HOUR_START * 60
                      const durationMinutes = endMin - startMin
                      const top = (minutesFromDayStart / 60) * HOUR_HEIGHT
                      const height = (durationMinutes / 60) * HOUR_HEIGHT
                      const color = appt.color || '#c6e9ff'
                      const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                      return (
                        <div
                          key={appt.id}
                          className="agenda-appt position-absolute start-0 end-0 mx-1 rounded-3 shadow-sm p-2 overflow-hidden border"
                          title={`${appt.utente_nome} — ${startStr}–${endStr}${appt.tipo_consulta ? ` • ${appt.tipo_consulta}` : ''}`}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(40, height)}px`,
                            background: color,
                            color: '#1e2a35',
                            borderColor: 'rgba(30, 42, 53, 0.18)',
                          }}
                        >
                          <div className="fw-semibold text-truncate" style={{ fontSize: 13, lineHeight: 1.15 }}>
                            {appt.utente_nome}
                          </div>
                          <div className="text-muted text-truncate" style={{ fontSize: 11, lineHeight: 1.15, marginTop: 2 }}>
                            {startStr}–{endStr}
                            {appt.tipo_consulta ? ` • ${appt.tipo_consulta}` : ''}
                          </div>
                        </div>
                      )
                    })
                  : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
