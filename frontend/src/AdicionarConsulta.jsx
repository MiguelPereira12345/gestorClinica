import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import MiniCalendar from './components/Agenda/MiniCalendar'
import './AdicionarConsulta.css'

import {
	buildAppointmentRecord,
	dateToISO,
	getClinicIntervalsForDate,
	isSlotFree,
	listAvailableSlots,
	upsertAppointment,
} from './utils/appointmentStorage'

import { loadPatients } from './utils/patientStorage'

const SAMPLE_PATIENTS = [
	{ id: 'P001', nome: 'Maria Gonzalez', email: 'maria.gonzalez@example.com' },
	{ id: 'P002', nome: 'Liam Chen', email: 'liam.chen@example.com' },
	{ id: 'P003', nome: 'Sofia Martins', email: 'sofia.martins@example.com' },
	{ id: 'P004', nome: 'Noah Patel', email: 'noah.patel@example.com' },
]

const APPOINTMENT_TYPES = [
	{ id: 'avaliacao', label: 'Consulta de avaliação', durationMin: 30 },
	{ id: 'higiene', label: 'Higiene/Profilaxia', durationMin: 30 },
	{ id: 'dor', label: 'Dor/Urgência', durationMin: 30 },
	{ id: 'ortodontia', label: 'Ortodontia', durationMin: 45 },
	{ id: 'endodontia', label: 'Endodontia', durationMin: 60 },
	{ id: 'cirurgia', label: 'Cirurgia Oral', durationMin: 60 },
]

function addDays(date, days) {
	const d = new Date(date)
	d.setDate(d.getDate() + days)
	return d
}

function startOfDay(date) {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d
}

function formatSlotLabel(date, hhmm) {
	const d = new Date(date)
	const weekday = d.toLocaleDateString('pt-PT', { weekday: 'short' })
	const dayMonth = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
	return `${weekday} ${dayMonth} • ${hhmm}`
}

export default function AdicionarConsulta() {
	const navigate = useNavigate()
	const patientInputRef = useRef(null)
	const patientPopoverRef = useRef(null)

	const resources = useMemo(
		() => [
			{ id: 1, name: 'Dra. Sofia Lima' },
			{ id: 2, name: 'Dr. Marco Sousa' },
			{ id: 3, name: 'Dr. Alex Morgan' },
		],
		[],
	)

	const [calendarMonth, setCalendarMonth] = useState(new Date())
	const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
	const [availabilityMode, setAvailabilityMode] = useState('next') // next | byPro

	const [patientQuery, setPatientQuery] = useState('')
	const [selectedPatient, setSelectedPatient] = useState(null)
	const [showPatientResults, setShowPatientResults] = useState(false)

	const [typeId, setTypeId] = useState(APPOINTMENT_TYPES[0]?.id)
	const [professionalId, setProfessionalId] = useState('any') // any | number
	const [bookingStatus, setBookingStatus] = useState('a_confirmar') // confirmada | a_confirmar
	const [notes, setNotes] = useState('')
	const [notesExpanded, setNotesExpanded] = useState(false)

	const [selectedSlot, setSelectedSlot] = useState(null) // { date: Date, hhmm: string, medicoId: number }
	const [error, setError] = useState('')

	const patients = useMemo(() => {
		const stored = loadPatients().map((p) => ({ id: p.id, nome: p.nome, email: p.email || '' }))
		const map = new Map()
		for (const p of [...stored, ...SAMPLE_PATIENTS]) map.set(p.id, p)
		return Array.from(map.values())
	}, [])

	const selectedType = useMemo(() => APPOINTMENT_TYPES.find((t) => t.id === typeId) || APPOINTMENT_TYPES[0], [typeId])
	const durationMin = Number(selectedType?.durationMin || 30)

	const patientResults = useMemo(() => {
		const q = (patientQuery || '').trim().toLowerCase()
		if (!q) return []
		const scored = []
		for (const p of patients) {
			const hay = `${p.nome} ${p.id} ${p.email || ''}`.toLowerCase()
			if (!hay.includes(q)) continue
			const score = p.id.toLowerCase() === q ? 100 : p.nome.toLowerCase().startsWith(q) ? 80 : 50
			scored.push({ p, score })
		}
		scored.sort((a, b) => b.score - a.score)
		return scored.slice(0, 8).map((x) => x.p)
	}, [patientQuery, patients])

	function resolveProfessionalIds() {
		if (professionalId === 'any') return resources.map((r) => r.id)
		return [Number(professionalId)]
	}

	function computeNextSlots({ fromDate, days = 14, limit = 24 }) {
		const slots = []
		const proIds = resolveProfessionalIds()
		for (let dayOffset = 0; dayOffset < days; dayOffset++) {
			const day = startOfDay(addDays(fromDate, dayOffset))
			for (const medicoId of proIds) {
				const res = listAvailableSlots({ date: day, medicoId, durationMin, limit: 50 })
				if (!res?.slots?.length) continue
				for (const hhmm of res.slots) {
					slots.push({ date: day, hhmm, medicoId })
				}
			}
		}

		slots.sort((a, b) => {
			const aKey = `${dateToISO(a.date)}T${a.hhmm}`
			const bKey = `${dateToISO(b.date)}T${b.hhmm}`
			return aKey.localeCompare(bKey)
		})

		const unique = []
		const seen = new Set()
		for (const s of slots) {
			const k = `${dateToISO(s.date)}|${s.hhmm}|${s.medicoId}`
			if (seen.has(k)) continue
			seen.add(k)
			unique.push(s)
			if (unique.length >= limit) break
		}
		return unique
	}

	const nextSlots = useMemo(() => computeNextSlots({ fromDate: startOfDay(new Date()), days: 14, limit: 24 }), [durationMin, professionalId])

	const monthMeta = useMemo(() => {
		const year = calendarMonth.getFullYear()
		const month = calendarMonth.getMonth()
		const first = new Date(year, month, 1)
		const last = new Date(year, month + 1, 0)
		const map = new Map()
		const proIds = resolveProfessionalIds()

		for (let d = 1; d <= last.getDate(); d++) {
			const day = new Date(year, month, d)
			const base = getClinicIntervalsForDate({ date: day, medicoId: null }).status
			if (base === 'closed' || base === 'holiday') {
				map.set(dateToISO(day), { status: base, occupancy: 0 })
				continue
			}
			let hasSlot = false
			for (const medicoId of proIds) {
				const r = listAvailableSlots({ date: day, medicoId, durationMin, limit: 1 })
				if (r?.slots?.length) {
					hasSlot = true
					break
				}
			}
			map.set(dateToISO(day), { status: hasSlot ? 'open' : 'noslots', occupancy: hasSlot ? 0.2 : 0 })
		}

		return map
	}, [calendarMonth, durationMin, professionalId])

	function getDayMeta(date) {
		return monthMeta.get(dateToISO(date)) || { status: 'open', occupancy: 0 }
	}

	function pickPatient(p) {
		setSelectedPatient(p)
		setPatientQuery(p.nome)
		setShowPatientResults(false)
		setError('')
	}

	function pickSlot(s) {
		setSelectedSlot(s)
		setSelectedDate(startOfDay(s.date))
		setError('')
	}

	function validate() {
		if (!selectedPatient) return 'Seleciona um paciente.'
		if (!selectedSlot) return 'Escolhe um horário (1 clique na lista).'
		return ''
	}

	const submit = useCallback(() => {
		const v = validate()
		if (v) {
			setError(v)
			return
		}

		const dayStatus = getClinicIntervalsForDate({ date: selectedSlot.date, medicoId: null }).status
		if (dayStatus === 'closed' || dayStatus === 'holiday') {
			setError('Dia fechado/feriado. Escolhe outro dia.')
			return
		}

		const medicoId = Number(selectedSlot.medicoId)
		const medicoName = resources.find((r) => r.id === medicoId)?.name || 'Profissional'
		const free = isSlotFree({ date: selectedSlot.date, medicoId, startHHMM: selectedSlot.hhmm, durationMin })
		if (!free) {
			setError('Esse horário acabou de ficar ocupado. Escolhe outro.')
			return
		}

		const confirmText = [
			'Confirmar marcação?',
			'',
			`Paciente: ${selectedPatient.nome} (${selectedPatient.id})`,
			`Motivo: ${selectedType.label} (${durationMin} min)`,
			`Quando: ${formatSlotLabel(selectedSlot.date, selectedSlot.hhmm)}`,
			`Profissional: ${medicoName}`,
			`Estado: ${bookingStatus === 'confirmada' ? 'Confirmada' : 'A confirmar'}`,
		].join('\n')

		if (!window.confirm(confirmText)) return

		const record = buildAppointmentRecord({
			patientId: selectedPatient.id,
			patientName: selectedPatient.nome,
			dependentName: '',
			notes: (notes || '').trim(),
			specialty: selectedType.label,
			medicoId,
			medicoName,
			bookingType: 'vaga',
			bookingStatus,
			firstVisitReason: '',
			isReschedule: false,
			isNoShow: false,
			durationMin,
			date: selectedSlot.date,
			startHHMM: selectedSlot.hhmm,
		})

		upsertAppointment(record)
		navigate('/agenda', { replace: true })
	}, [
		bookingStatus,
		durationMin,
		navigate,
		notes,
		resources,
		selectedPatient,
		selectedSlot,
		selectedType,
	])

	useEffect(() => {
		function onKeyDown(e) {
			const target = e.target
			const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

			if (e.key === '/' && !isTyping) {
				e.preventDefault()
				patientInputRef.current?.focus()
				setShowPatientResults(true)
				return
			}
			if (e.key === 'Escape') {
				setSelectedSlot(null)
				setError('')
				return
			}
			if (e.key === 'Enter' && e.ctrlKey) {
				e.preventDefault()
				submit()
				return
			}
			if ((e.key === 'n' || e.key === 'N') && e.altKey) {
				e.preventDefault()
				navigate('/pacientes/novo')
			}
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [navigate, submit])

	useEffect(() => {
		function onMouseDown(e) {
			const pop = patientPopoverRef.current
			const input = patientInputRef.current
			if (!pop || !input) return
			if (pop.contains(e.target) || input.contains(e.target)) return
			setShowPatientResults(false)
		}
		window.addEventListener('mousedown', onMouseDown)
		return () => window.removeEventListener('mousedown', onMouseDown)
	}, [])

	const byProfessionalDaySlots = useMemo(() => {
		const day = startOfDay(selectedDate)
		const map = new Map()
		for (const r of resources) {
			const res = listAvailableSlots({ date: day, medicoId: r.id, durationMin, limit: 20 })
			map.set(r.id, res?.slots || [])
		}
		return map
	}, [resources, selectedDate, durationMin])

	return (
		<AppLayout
			breadcrumb="Agenda / Marcar consulta"
			userName="Receção"
			actions={
				<button type="button" className="mcx-top-btn" onClick={() => navigate('/agenda')}>
					← Voltar
				</button>
			}
		>
			<div className="mcx-page" aria-label="Marcar consulta">
				<section className="mcx-left" aria-label="Formulário">
					<div className="mcx-card">
						<div className="mcx-card-title">Marcar consulta</div>

						<div className="mcx-field">
							<label className="mcx-label" htmlFor="patient-search">Paciente</label>
							<div className="mcx-patient-row">
								<div className="mcx-patient-search">
									<input
										id="patient-search"
										ref={patientInputRef}
										value={patientQuery}
										onChange={(e) => {
											setPatientQuery(e.target.value)
											setShowPatientResults(true)
											setSelectedPatient(null)
											setError('')
										}}
										onFocus={() => setShowPatientResults(true)}
										placeholder="Pesquisar por nome, ID ou email (atalho: /)"
										autoComplete="off"
									/>
									{showPatientResults && patientResults.length ? (
										<div ref={patientPopoverRef} className="mcx-popover" role="listbox">
											{patientResults.map((p) => (
												<button
													key={p.id}
													type="button"
													className="mcx-popover-item"
													onClick={() => pickPatient(p)}
												>
													<div className="mcx-popover-main">{p.nome}</div>
													<div className="mcx-popover-sub">{p.id}{p.email ? ` • ${p.email}` : ''}</div>
												</button>
											))}
										</div>
									) : null}
								</div>
								<button type="button" className="mcx-btn" onClick={() => navigate('/pacientes/novo')} title="Alt+N">
									+ Novo
								</button>
							</div>
							{selectedPatient ? (
								<div className="mcx-selected">
									Selecionado: <strong>{selectedPatient.nome}</strong> <span className="mcx-muted">({selectedPatient.id})</span>
								</div>
							) : null}
						</div>

						<div className="mcx-field">
							<label className="mcx-label">Tipo/Motivo</label>
							<select className="mcx-select" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
								{APPOINTMENT_TYPES.map((t) => (
									<option key={t.id} value={t.id}>
										{t.label} ({t.durationMin} min)
									</option>
								))}
							</select>
						</div>

						<div className="mcx-field">
							<label className="mcx-label">Profissional</label>
							<select className="mcx-select" value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
								<option value="any">Qualquer (mais rápido)</option>
								{resources.map((r) => (
									<option key={r.id} value={String(r.id)}>
										{r.name}
									</option>
								))}
							</select>
						</div>

						<div className="mcx-field">
							<label className="mcx-label">Estado</label>
							<div className="mcx-seg">
								<button
									type="button"
									className={`mcx-seg-btn${bookingStatus === 'confirmada' ? ' is-active' : ''}`}
									onClick={() => setBookingStatus('confirmada')}
								>
									Confirmada
								</button>
								<button
									type="button"
									className={`mcx-seg-btn${bookingStatus === 'a_confirmar' ? ' is-active' : ''}`}
									onClick={() => setBookingStatus('a_confirmar')}
								>
									A confirmar
								</button>
							</div>
						</div>

						<div className="mcx-field">
							<div className="mcx-notes-head">
								<label className="mcx-label" htmlFor="notes">Notas</label>
								<button type="button" className="mcx-link" onClick={() => setNotesExpanded((v) => !v)}>
									{notesExpanded ? 'Menos' : 'Expandir'}
								</button>
							</div>
							<textarea
								id="notes"
								className="mcx-textarea"
								rows={notesExpanded ? 5 : 2}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Ex.: preferir manhã; confirmar por telefone; trazer radiografia…"
							/>
						</div>

						{selectedSlot ? (
							<div className="mcx-summary">
								<div className="mcx-summary-title">Horário escolhido</div>
								<div className="mcx-summary-row">
									<strong>{formatSlotLabel(selectedSlot.date, selectedSlot.hhmm)}</strong>
									<span className="mcx-muted">• {resources.find((r) => r.id === selectedSlot.medicoId)?.name || 'Profissional'}</span>
								</div>
								<button type="button" className="mcx-link" onClick={() => setSelectedSlot(null)}>
									Limpar (Esc)
								</button>
							</div>
						) : (
							<div className="mcx-muted">Dica: escolhe o horário na coluna da direita (1 clique).</div>
						)}

						{error ? <div className="mcx-error" role="alert">{error}</div> : null}
					</div>

					<div className="mcx-sticky">
						<button type="button" className="mcx-primary" onClick={submit}>
							Marcar consulta
						</button>
						<div className="mcx-hints">
							<span>/ pesquisar paciente</span>
							<span>Ctrl+Enter marcar</span>
							<span>Alt+N novo paciente</span>
						</div>
					</div>
				</section>

				<aside className="mcx-right" aria-label="Disponibilidade">
					<div className="mcx-card">
						<div className="mcx-right-head">
							<div>
								<div className="mcx-card-title">Disponibilidade</div>
								<div className="mcx-muted">Sem inserir hora manualmente — escolhe um slot.</div>
							</div>
							<div className="mcx-tabs" role="tablist">
								<button
									type="button"
									role="tab"
									aria-selected={availabilityMode === 'next'}
									className={`mcx-tab${availabilityMode === 'next' ? ' is-active' : ''}`}
									onClick={() => setAvailabilityMode('next')}
								>
									Próximos horários
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={availabilityMode === 'byPro'}
									className={`mcx-tab${availabilityMode === 'byPro' ? ' is-active' : ''}`}
									onClick={() => setAvailabilityMode('byPro')}
								>
									Por profissional
								</button>
							</div>
						</div>

						<div className="mcx-right-grid">
							<div className="mcx-calendar">
								<MiniCalendar
									currentDate={calendarMonth}
									onSelectDate={(d) => setSelectedDate(startOfDay(d))}
									onPrevMonth={() => {
										const d = new Date(calendarMonth)
										d.setMonth(d.getMonth() - 1)
										setCalendarMonth(d)
									}}
									onNextMonth={() => {
										const d = new Date(calendarMonth)
										d.setMonth(d.getMonth() + 1)
										setCalendarMonth(d)
									}}
									getDayMeta={getDayMeta}
								/>
								<div className="mcx-muted mcx-mini-legend">Dias a cinzento: sem horários para o tipo/duração atual.</div>
							</div>

							<div className="mcx-slots">
								{availabilityMode === 'next' ? (
									<>
										<div className="mcx-section-title">Próximos horários</div>
										{nextSlots.length ? (
											<div className="mcx-slot-list">
												{nextSlots.map((s) => (
													<button
														key={`${dateToISO(s.date)}|${s.hhmm}|${s.medicoId}`}
														type="button"
														className={`mcx-slot-btn${selectedSlot && dateToISO(selectedSlot.date) === dateToISO(s.date) && selectedSlot.hhmm === s.hhmm && selectedSlot.medicoId === s.medicoId ? ' is-selected' : ''}`}
														onClick={() => pickSlot(s)}
													>
														<div className="mcx-slot-main">{formatSlotLabel(s.date, s.hhmm)}</div>
														<div className="mcx-slot-sub">{resources.find((r) => r.id === s.medicoId)?.name || 'Profissional'}</div>
													</button>
												))}
											</div>
										) : (
											<div className="mcx-muted">Sem horários nos próximos dias para este tipo/duração.</div>
										)}
									</>
								) : (
									<>
										<div className="mcx-section-title">{selectedDate.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
										<div className="mcx-pro-tabs" role="tablist" aria-label="Profissionais">
											{resources.map((r) => (
												<button
													key={r.id}
													type="button"
													className={`mcx-pro-tab${Number(professionalId) === r.id ? ' is-active' : ''}`}
													onClick={() => setProfessionalId(String(r.id))}
												>
													{r.name}
												</button>
											))}
										</div>
										{professionalId === 'any' ? (
											<div className="mcx-muted">Escolhe um profissional acima para ver os slots.</div>
										) : (
											(() => {
												const pid = Number(professionalId)
												const slots = byProfessionalDaySlots.get(pid) || []
												return slots.length ? (
													<div className="mcx-chip-row">
														{slots.map((hhmm) => (
															<button
																key={hhmm}
																type="button"
																className={`mcx-chip${selectedSlot && dateToISO(selectedSlot.date) === dateToISO(selectedDate) && selectedSlot.hhmm === hhmm && selectedSlot.medicoId === pid ? ' is-selected' : ''}`}
																onClick={() => pickSlot({ date: selectedDate, hhmm, medicoId: pid })}
															>
																{hhmm}
															</button>
														))}
													</div>
												) : (
													<div className="mcx-muted">Sem horários neste dia para este tipo/duração.</div>
												)
											})()
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</aside>
			</div>
		</AppLayout>
	)
}
