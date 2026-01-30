import React, { useState, useMemo } from 'react'
import AppLayout from './components/Layout/AppLayout'
import ResourceDayCalendar from './components/Agenda/ResourceDayCalendar'
import MiniCalendar from './components/Agenda/MiniCalendar'
import './components/Agenda/Agenda.css'
import './App.css'
import { useNavigate } from 'react-router-dom'
import { computeOccupancyForDay, loadAppointments } from './utils/appointmentStorage'

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0,0,0,0)
  return d
}

export default function Agenda() {
  const navigate = useNavigate()
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
    setCursorDate(d)
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
            <div className="agenda-panel-title">
              Agenda por Médico • {weekStart.toLocaleDateString()} - {(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+5)).toLocaleDateString()}
            </div>
            <div className="agenda-panel-actions">
              <button className="agenda-nav-btn" onClick={goPrevWeek}>&lt; Semana Anterior</button>
              <button className="agenda-nav-btn" onClick={goNextWeek}>Semana Seguinte &gt;</button>
            </div>
          </div>

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

          <ResourceDayCalendar date={selectedDate} resources={resources} appointments={appointments} />
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
