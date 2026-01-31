import React, { useState, useMemo } from 'react'
import AppLayout from './components/Layout/AppLayout'
import ResourceDayCalendar from './components/Agenda/ResourceDayCalendar'
import MiniCalendar from './components/Agenda/MiniCalendar'
import WeeklyCalendar from './components/Agenda/WeeklyCalendar'
import MonthCalendar from './components/Agenda/MonthCalendar'
import './components/Agenda/Agenda.css'
import './App.css'
import { useNavigate } from 'react-router-dom'
import { computeOccupancyForDay, dateToISO, loadAppointments } from './utils/appointmentStorage'

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0,0,0,0)
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Agenda() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('day') // day | week | month
  const [cursorDate, setCursorDate] = useState(new Date())
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const weekStart = useMemo(() => startOfWeek(cursorDate), [cursorDate])

  const selectedDate = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + selectedDayIndex)
    return d
  }, [selectedDayIndex, weekStart])

  // constants must match WeeklyCalendar settings
  const HOUR_START = 8
  const HOUR_END = 19
  const HOUR_HEIGHT = 40
  const totalHours = HOUR_END - HOUR_START + 1
  // header for wc (day labels) approx 40px + section paddings (12*2)
  const panelHeight = totalHours * HOUR_HEIGHT + 40 + 24

  const resources = useMemo(
    () => [
      { id: 1, name: 'Dra. Sofia Lima', color: '#C6E9FF' },
      { id: 2, name: 'Dr. Marco Sousa', color: '#7EE7A7' },
      { id: 3, name: 'Dr. Alex Morgan', color: '#89CFFF' },
    ],
    [],
  )

  const resourceColorById = useMemo(() => {
    const map = new Map()
    for (const r of resources) map.set(r.id, r.color)
    return map
  }, [resources])

  const appointments = useMemo(() => {
    const stored = loadAppointments()

    const rangeStart = new Date(weekStart)
    rangeStart.setHours(0, 0, 0, 0)
    const rangeEnd = new Date(weekStart)
    rangeEnd.setDate(rangeEnd.getDate() + 5) // seg-sáb
    rangeEnd.setHours(23, 59, 59, 999)

    const toCalendar = (a) => ({
      id: a.id,
      paciente_nome: a.patientName || a.patientId || 'Paciente',
      medico_id: Number(a.medicoId),
      data_inicio: a.startISO,
      data_fim: a.endISO,
      tipo_consulta: a.specialty || a.bookingType || 'Consulta',
    })

    const storedForWeek = stored
      .filter((a) => a?.startISO && a?.endISO)
      .filter((a) => {
        const s = new Date(a.startISO)
        return s >= rangeStart && s <= rangeEnd
      })
      .map(toCalendar)

    if (storedForWeek.length > 0) return storedForWeek

    // fallback demo
    const mapToWeek = (idx, hourStart, durationMin, medicoId, name) => {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + idx)
      const start = new Date(day)
      start.setHours(hourStart, 0, 0, 0)
      const end = new Date(start.getTime() + durationMin * 60000)
      return {
        id: `demo-${idx}-${hourStart}-${medicoId}`,
        paciente_nome: name,
        medico_id: medicoId,
        data_inicio: start.toISOString(),
        data_fim: end.toISOString(),
        tipo_consulta: 'Consulta',
      }
    }

    return [
      mapToWeek(0, 11, 60, 3, 'João Silva'),
      mapToWeek(0, 11, 45, 1, 'Maria Ferreira'),
      mapToWeek(0, 14, 60, 2, 'Joana Oliveira'),
      mapToWeek(2, 10, 30, 1, 'Paciente X'),
      mapToWeek(4, 15, 45, 2, 'Paciente Y'),
    ]
  }, [weekStart])

  const appointmentsWithColor = useMemo(() => {
    return (appointments || []).map((a) => ({
      ...a,
      color: a.color || resourceColorById.get(a.medico_id) || '#C6E9FF',
    }))
  }, [appointments, resourceColorById])

  const monthCountByISO = useMemo(() => {
    const stored = loadAppointments()
    const year = cursorDate.getFullYear()
    const month = cursorDate.getMonth()
    const monthStart = new Date(year, month, 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(year, month + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const map = new Map()
    for (const a of stored) {
      if (!a?.startISO) continue
      const s = new Date(a.startISO)
      if (s < monthStart || s > monthEnd) continue
      const iso = String(a.startISO).slice(0, 10)
      map.set(iso, (map.get(iso) || 0) + 1)
    }
    return map
  }, [cursorDate])

  function goPrevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setCursorDate(d)
  }

  function goNextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setCursorDate(d)
  }

  function handleSelectDate(d) {
    const picked = new Date(d)
    setCursorDate(picked)

    const ws = startOfWeek(picked)
    const deltaDays = Math.floor((startOfDay(picked).getTime() - ws.getTime()) / (24 * 60 * 60 * 1000))
    setSelectedDayIndex(Math.max(0, Math.min(5, deltaDays)))
  }

  function selectDateFromMonth(d) {
    const picked = new Date(d)
    setCursorDate(picked)

    const ws = startOfWeek(picked)
    const deltaDays = Math.floor((startOfDay(picked).getTime() - ws.getTime()) / (24 * 60 * 60 * 1000))
    const idx = Math.max(0, Math.min(5, deltaDays))
    setSelectedDayIndex(idx)
    setViewMode('day')
  }

  function getDayMeta(date) {
    return computeOccupancyForDay({ date, medicoId: null })
  }

  return (
    <AppLayout
      breadcrumb="Pacientes > João Silva > Agenda"
      userName="Dra. Sofia Lima"
      actions={
        <button type="button" className="app-action-primary" onClick={() => navigate('/agenda/consultas/novo')}>
          ＋ Adicionar Consulta
        </button>
      }
    >
      <div className="agenda-grid">
        <section className="calendar-panel" style={{ minHeight: panelHeight }}>
          <div className="agenda-panel-header">
            <div className="agenda-panel-left" />

            <div className="agenda-panel-title">Agenda</div>

            <div className="agenda-panel-actions">
              {/* actions moved to toolbar */}
            </div>
          </div>

          <div className="agenda-toolbar">
            <div className="agenda-viewtabs" role="tablist" aria-label="Vista de calendário">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'day'}
                className={`agenda-viewtab${viewMode === 'day' ? ' is-active' : ''}`}
                onClick={() => setViewMode('day')}
              >
                Dia
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'week'}
                className={`agenda-viewtab${viewMode === 'week' ? ' is-active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                Semana
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'month'}
                className={`agenda-viewtab${viewMode === 'month' ? ' is-active' : ''}`}
                onClick={() => setViewMode('month')}
              >
                Mês
              </button>
            </div>

            <div className="agenda-toolbar-actions">
              {viewMode === 'month' ? (
                <>
                  <button
                    className="agenda-nav-btn"
                    onClick={() => {
                      const d = new Date(cursorDate)
                      d.setMonth(d.getMonth() - 1)
                      setCursorDate(d)
                    }}
                  >
                    &lt; Mês Anterior
                  </button>
                  <button
                    className="agenda-nav-btn"
                    onClick={() => {
                      const d = new Date(cursorDate)
                      d.setMonth(d.getMonth() + 1)
                      setCursorDate(d)
                    }}
                  >
                    Mês Seguinte &gt;
                  </button>
                </>
              ) : (
                <>
                  <button className="agenda-nav-btn" onClick={goPrevWeek}>
                    &lt; Semana Anterior
                  </button>
                  <button className="agenda-nav-btn" onClick={goNextWeek}>
                    Semana Seguinte &gt;
                  </button>
                </>
              )}
            </div>
          </div>

          {viewMode === 'day' ? (
            <>
              <div className="agenda-daytabs" aria-label="Dias da semana">
                {Array.from({ length: 6 }).map((_, i) => {
                  const d = new Date(weekStart)
                  d.setDate(d.getDate() + i)
                  const active = i === selectedDayIndex
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`agenda-daytab${active ? ' is-active' : ''}`}
                      onClick={() => setSelectedDayIndex(i)}
                    >
                      {d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' })}
                    </button>
                  )
                })}
              </div>

              <ResourceDayCalendar date={selectedDate} resources={resources} appointments={appointmentsWithColor} />
            </>
          ) : null}

          {viewMode === 'week' ? (
            <WeeklyCalendar weekStart={weekStart} appointments={appointmentsWithColor} />
          ) : null}

          {viewMode === 'month' ? (
            <MonthCalendar
              currentDate={cursorDate}
              selectedDate={selectedDate}
              onSelectDate={selectDateFromMonth}
              onPrevMonth={() => {
                const d = new Date(cursorDate)
                d.setMonth(d.getMonth() - 1)
                setCursorDate(d)
              }}
              onNextMonth={() => {
                const d = new Date(cursorDate)
                d.setMonth(d.getMonth() + 1)
                setCursorDate(d)
              }}
              getDayMeta={getDayMeta}
              getDayCount={(d) => monthCountByISO.get(dateToISO(d)) || 0}
            />
          ) : null}
        </section>

        <aside className="agenda-aside">
          <div className="agenda-card">
            <MiniCalendar
              currentDate={cursorDate}
              onSelectDate={handleSelectDate}
              onPrevMonth={() => { const d = new Date(cursorDate); d.setMonth(d.getMonth() - 1); setCursorDate(d)}}
              onNextMonth={() => { const d = new Date(cursorDate); d.setMonth(d.getMonth() + 1); setCursorDate(d)}}
              getDayMeta={getDayMeta}
            />
          </div>

          <div className="agenda-card">
            <div className="agenda-card-title">Legenda de Médicos</div>
            <div className="agenda-legend">
              {resources.map((r) => (
                <div key={r.id} className="agenda-legend-row">
                  <span className="agenda-dot" style={{ background: r.color }} /> {r.name}
                </div>
              ))}
            </div>
          </div>

          <div className="agenda-card">
            <div className="agenda-card-title">Dica</div>
            <div className="agenda-card-muted">Passe o rato sobre um bloco para ver paciente, tempo de consulta, tipo e estado.</div>
          </div>
        </aside>
      </div>
    </AppLayout>
  )
}
