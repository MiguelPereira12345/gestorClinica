import React, { useEffect, useMemo, useState } from 'react'
import AppLayout from './components/Layout/AppLayout'
import ResourceDayCalendar from './components/Agenda/ResourceDayCalendar'
import MiniCalendar from './components/Agenda/MiniCalendar'
import WeeklyCalendar from './components/Agenda/WeeklyCalendar'
import MonthCalendar from './components/Agenda/MonthCalendar'
import './components/Agenda/Agenda.css'
import './App.css'
import { useNavigate } from 'react-router-dom'
import { computeOccupancyForDay, dateToISO, loadAppointments } from './utils/appointmentStorage'
import { syncConsultasFromApi, syncPatientsFromApi } from './utils/dataSync'
import { loadMedicosForSelect, refreshMedicosForSelect } from './utils/professionalsStorage'
import { getCurrentUser, isMedicoUser } from './utils/apiClient'

import Button from './components/UI/Button'
import PageHeader from './components/UI/PageHeader'
import { Plus } from 'lucide-react'

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
  const [rev, setRev] = useState(0)

  const currentUser = getCurrentUser()
  const isMedico = isMedicoUser()
  const currentUserId = Number(currentUser?.id || 0) || 0
  const AGENDA_ONLY_MINE_KEY = 'gestorClinica.agenda.onlyMine'
  const [onlyMine, setOnlyMine] = useState(() => {
    const raw = localStorage.getItem(AGENDA_ONLY_MINE_KEY)
    if (raw != null) return raw === '1' || raw === 'true'
    return false
  })

  useEffect(() => {
    localStorage.setItem(AGENDA_ONLY_MINE_KEY, onlyMine ? '1' : '0')
  }, [onlyMine])

  const weekStart = useMemo(() => startOfWeek(cursorDate), [cursorDate])

  const selectedDate = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + selectedDayIndex)
    return d
  }, [selectedDayIndex, weekStart])

  // constants must match WeeklyCalendar settings
  const HOUR_START = 9
  const HOUR_END = 19
  const HOUR_HEIGHT = 40
  const totalHours = HOUR_END - HOUR_START + 1
  // header for wc (day labels) approx 40px + section paddings (12*2)
  const panelHeight = totalHours * HOUR_HEIGHT + 40 + 24

  const [resources, setResources] = useState(() => {
    const medicos = loadMedicosForSelect()
    const base = medicos.map((p, idx) => ({
      id: Number(p.id),
      name: p.name,
      color: idx % 2 === 0 ? '#C6E9FF' : '#7EE7A7',
    }))

    // lane para consultas sem médico atribuído (id_medico NULL -> 0)
    return [
      ...base,
      { id: 0, name: 'Sem médico', color: '#E9E9E9' },
    ]
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const medicos = await refreshMedicosForSelect()
        const nextResources = medicos
          .map((p, idx) => ({
            id: Number(p.id),
            name: p.name,
            color: idx % 2 === 0 ? '#C6E9FF' : '#7EE7A7',
          }))
          .filter((r) => Number.isFinite(r.id) && r.id)

        nextResources.push({ id: 0, name: 'Sem médico', color: '#E9E9E9' })
        if (mounted) setResources(nextResources)

        await syncPatientsFromApi()
        await syncConsultasFromApi()
      } catch {
        // ignore
      } finally {
        if (mounted) setRev((x) => x + 1)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

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
        if (!isMedico || !onlyMine || !currentUserId) return true
        return Number(a.medicoId || 0) === currentUserId
      })
      .filter((a) => {
        const s = new Date(a.startISO)
        return s >= rangeStart && s <= rangeEnd
      })
      .map(toCalendar)

    return storedForWeek
  }, [currentUserId, isMedico, onlyMine, weekStart, rev])

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
      if (isMedico && onlyMine && currentUserId && Number(a.medicoId || 0) !== currentUserId) continue
      const s = new Date(a.startISO)
      if (s < monthStart || s > monthEnd) continue
      const iso = String(a.startISO).slice(0, 10)
      map.set(iso, (map.get(iso) || 0) + 1)
    }
    return map
  }, [cursorDate, currentUserId, isMedico, onlyMine])

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
    const medicoId = isMedico && onlyMine && currentUserId ? currentUserId : null
    return computeOccupancyForDay({ date, medicoId })
  }

  function openAppointment(appt) {
    if (!appt?.id) return
    navigate(`/consultas/${appt.id}`)
  }

  function formatWeekdayChip(d) {
    const weekday = d
      .toLocaleDateString('pt-PT', { weekday: 'short' })
      .replace('.', '')
      .replace(',', '')
      .trim()
    const day = String(d.getDate()).padStart(2, '0')
    const label = `${weekday} ${day}`
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  return (
    <AppLayout breadcrumb="Agenda" userName="Dra. Sofia Lima">
      <div className="ui-page">
        <PageHeader
          title="Agenda"
          subtitle={null}
          actions={
            <Button
              variant="primary"
              onClick={() => navigate('/consultas/nova')}
              leftIcon={<Plus size={16} aria-hidden="true" />}
            >
              Adicionar Consulta
            </Button>
          }
        />

        <div className="d-flex flex-column flex-lg-row gap-3">
          <section className="flex-grow-1">
            <div className="ui-card p-3" style={{ minHeight: panelHeight }}>
              <div className="fw-bold mb-2">Calendário</div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pb-2 mb-3">
                <div className="btn-group" role="tablist" aria-label="Vista de calendário">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'day'}
                    className={`btn btn-sm ${viewMode === 'day' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setViewMode('day')}
                  >
                    Dia
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'week'}
                    className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setViewMode('week')}
                  >
                    Semana
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'month'}
                    className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setViewMode('month')}
                  >
                    Mês
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {isMedico ? (
                    <div className="d-flex align-items-center gap-2 me-2">
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="agenda-only-mine"
                          checked={onlyMine}
                          onChange={(e) => setOnlyMine(e.target.checked)}
                        />
                        <label className="form-check-label ui-meta" htmlFor="agenda-only-mine">
                          Só as minhas
                        </label>
                      </div>
                    </div>
                  ) : null}
                  {viewMode === 'month' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={() => {
                          const d = new Date(cursorDate)
                          d.setMonth(d.getMonth() - 1)
                          setCursorDate(d)
                        }}
                      >
                        &lt; Mês Anterior
                      </button>
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
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
                      <button type="button" className="btn btn-light btn-sm" onClick={goPrevWeek}>
                        &lt; Semana Anterior
                      </button>
                      <button type="button" className="btn btn-light btn-sm" onClick={goNextWeek}>
                        Semana Seguinte &gt;
                      </button>
                    </>
                  )}
                </div>
              </div>

          {viewMode === 'day' ? (
            <>
              <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Dias da semana">
                {Array.from({ length: 6 }).map((_, i) => {
                  const d = new Date(weekStart)
                  d.setDate(d.getDate() + i)
                  const active = i === selectedDayIndex
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`btn btn-sm ${active ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setSelectedDayIndex(i)}
                    >
                      {formatWeekdayChip(d)}
                    </button>
                  )
                })}
              </div>

              <ResourceDayCalendar
                date={selectedDate}
                resources={resources}
                appointments={appointmentsWithColor}
                onSelectAppointment={openAppointment}
              />
            </>
          ) : null}

          {viewMode === 'week' ? (
            <WeeklyCalendar
              weekStart={weekStart}
              appointments={appointmentsWithColor}
              resources={resources}
              onSelectAppointment={openAppointment}
            />
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
            </div>
          </section>

          <aside className="flex-shrink-0" style={{ width: 300 }}>
            <div className="d-flex flex-column gap-3">
              <div className="ui-card p-3">
            <MiniCalendar
              currentDate={cursorDate}
              onSelectDate={handleSelectDate}
              onPrevMonth={() => { const d = new Date(cursorDate); d.setMonth(d.getMonth() - 1); setCursorDate(d)}}
              onNextMonth={() => { const d = new Date(cursorDate); d.setMonth(d.getMonth() + 1); setCursorDate(d)}}
              getDayMeta={getDayMeta}
            />
          </div>

              <div className="ui-card p-3">
                <div className="fw-bold mb-2">Legenda de Médicos</div>
                <div className="d-flex flex-column gap-2">
              {resources.map((r) => (
                    <div key={r.id} className="d-flex gap-2 align-items-center">
                      <span className="d-inline-block rounded-2 flex-shrink-0" style={{ width: 12, height: 12, background: r.color }} />
                      <span>{r.name}</span>
                </div>
              ))}
            </div>
          </div>

              <div className="ui-card p-3">
                <div className="fw-bold">Dica</div>
                <div className="ui-meta mt-2">Passe o rato sobre um bloco para ver paciente, tempo de consulta, tipo e estado.</div>
          </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
