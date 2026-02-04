import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import MiniCalendar from './components/Agenda/MiniCalendar'
import './AdicionarConsulta.css'

import {
	dateToISO,
	getClinicIntervalsForDate,
	isSlotFree,
	listAvailableSlots,
} from './utils/appointmentStorage'

import { loadPatients } from './utils/patientStorage'
import { loadMedicosForSelect, refreshMedicosForSelect } from './utils/professionalsStorage'
import { createConsulta } from './utils/consultasStorage'

import { useConfirm } from './components/UI/ConfirmProvider'


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
	const confirm = useConfirm()
	const patientInputRef = useRef(null)
	const patientPopoverRef = useRef(null)
	const [resources, setResources] = useState(() => loadMedicosForSelect().map((m) => ({ id: Number(m.id), name: m.name })))

	useEffect(() => {
		let mounted = true
		;(async () => {
			const list = await refreshMedicosForSelect()
			const next = list.map((m) => ({ id: Number(m.id), name: m.name })).filter((m) => Number.isFinite(m.id) && m.id)
			if (mounted) setResources(next)
		})()
		return () => {
			mounted = false
		}
	}, [])

	const [calendarMonth, setCalendarMonth] = useState(new Date())
	const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
	const [availabilityMode, setAvailabilityMode] = useState('next') // next | byPro

	const [patientQuery, setPatientQuery] = useState('')
	const [selectedPatient, setSelectedPatient] = useState(null)
	const [showPatientResults, setShowPatientResults] = useState(false)

	const [typeId, setTypeId] = useState(APPOINTMENT_TYPES[0]?.id)
	const [professionalId, setProfessionalId] = useState('any') // any | number
	const [bookingStatus, setBookingStatus] = useState('a_confirmar') // confirmada | a_confirmar
	const [firstVisitReason, setFirstVisitReason] = useState('')
	const [notes, setNotes] = useState('')
	const [notesExpanded, setNotesExpanded] = useState(false)

	const [selectedSlot, setSelectedSlot] = useState(null) // { date: Date, hhmm: string, medicoId: number }
	const [error, setError] = useState('')

	const patients = useMemo(() => {
		const stored = loadPatients().map((p) => ({
			id: p.id,
			nome: p.nome,
			telefone: p.telefone || p?.data?.contactoTelefone || '',
		}))
		const map = new Map()
		for (const p of stored) map.set(p.id, p)
		return Array.from(map.values())
	}, [])

	const selectedType = useMemo(() => APPOINTMENT_TYPES.find((t) => t.id === typeId) || APPOINTMENT_TYPES[0], [typeId])
	const durationMin = Number(selectedType?.durationMin || 30)

	const patientResults = useMemo(() => {
		const q = (patientQuery || '').trim().toLowerCase()
		if (!q) return []
		const scored = []
		for (const p of patients) {
			const hay = `${p.nome} ${p.id} ${p.telefone || ''}`.toLowerCase()
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

	const nextSlots = useMemo(
		() => computeNextSlots({ fromDate: startOfDay(new Date()), days: 14, limit: 24 }),
		[durationMin, professionalId, resources],
	)

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
	}, [calendarMonth, durationMin, professionalId, resources])

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
		if (!selectedPatient) return 'Seleciona um utente.'
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
			`Utente: ${selectedPatient.nome} (${selectedPatient.id})`,
			`Motivo: ${selectedType.label} (${durationMin} min)`,
			firstVisitReason ? `Razão: ${firstVisitReason}` : null,
			`Quando: ${formatSlotLabel(selectedSlot.date, selectedSlot.hhmm)}`,
			`Profissional: ${medicoName}`,
			`Estado: ${bookingStatus === 'confirmada' ? 'Confirmada' : 'A confirmar'}`,
		].filter(Boolean).join('\n')

		void (async () => {
			const ok = await confirm({
				title: 'Confirmar marcação',
				message: confirmText,
				confirmText: 'Confirmar',
				confirmVariant: 'primary',
			})
			if (!ok) return

			try {
				const day = new Date(selectedSlot.date)
				const [h, m] = String(selectedSlot.hhmm).split(':').map(Number)
				day.setHours(h || 0, m || 0, 0, 0)
				const startISO = day.toISOString()

				await createConsulta({
					patientId: selectedPatient.id,
					patientName: selectedPatient.nome,
					dependentName: '',
					notes: (notes || '').trim(),
					specialty: selectedType.label,
					medicoId,
					medicoName,
					bookingType: 'vaga',
					bookingStatus,
					firstVisitReason: (firstVisitReason || '').trim(),
					isReschedule: false,
					isNoShow: false,
					durationMin,
					startISO,
				})

				navigate('/agenda', { replace: true })
			} catch (e) {
				console.error(e)
				setError(e?.message || 'Erro ao criar consulta')
			}
		})()
	}, [
		bookingStatus,
		durationMin,
		navigate,
		notes,
		firstVisitReason,
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
				<button type="button" className="btn btn-secondary" onClick={() => navigate('/agenda')}>
					← Voltar
				</button>
			}
		>
			<div className="container-fluid py-3" aria-label="Marcar consulta">
				<div className="row g-3">
					<section className="col-12 col-lg-4" aria-label="Formulário">
						<div className="mcx-sticky-lg">
							<div className="card shadow-sm">
								<div className="card-body">
									<h5 className="card-title mb-3">Marcar consulta</h5>

									<div className="mb-3">
										<label className="form-label" htmlFor="patient-search">Utente</label>
										<div className="d-flex gap-2 align-items-start">
										<div className="position-relative flex-grow-1">
											<input
												id="patient-search"
												ref={patientInputRef}
												className="form-control"
												value={patientQuery}
												onChange={(e) => {
													setPatientQuery(e.target.value)
													setShowPatientResults(true)
													setSelectedPatient(null)
													setError('')
												}}
												onFocus={() => setShowPatientResults(true)}
													placeholder="Pesquisar por nome, ID ou telefone (atalho: /)"
												autoComplete="off"
											/>
											{showPatientResults && patientResults.length ? (
												<div ref={patientPopoverRef} className="dropdown-menu show w-100 p-0" role="listbox">
													{patientResults.map((p) => (
														<button key={p.id} type="button" className="dropdown-item py-2" onClick={() => pickPatient(p)}>
															<div className="fw-semibold">{p.nome}</div>
																<div className="text-muted small">{p.id}{p.telefone ? ` • ${p.telefone}` : ''}</div>
														</button>
													))}
												</div>
											) : null}
										</div>
										<button type="button" className="btn btn-light btn-sm" onClick={() => navigate('/pacientes/novo')} title="Alt+N">
											+ Novo
										</button>
									</div>
									{selectedPatient ? (
										<div className="alert alert-success py-2 mt-2 mb-0" role="status">
											Selecionado: <strong>{selectedPatient.nome}</strong>{' '}
											<span className="text-muted">({selectedPatient.id})</span>
										</div>
									) : null}
								</div>

								<div className="mb-3">
									<label className="form-label">Tipo/Motivo</label>
									<select className="form-select" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
										{APPOINTMENT_TYPES.map((t) => (
											<option key={t.id} value={t.id}>
												{t.label} ({t.durationMin} min)
											</option>
										))}
									</select>
								</div>

								<div className="mb-3">
									<label className="form-label">Profissional</label>
									<select className="form-select" value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
										<option value="any">Qualquer (mais rápido)</option>
										{resources.map((r) => (
											<option key={r.id} value={String(r.id)}>
												{r.name}
											</option>
										))}
									</select>
								</div>

								<div className="mb-3">
									<label className="form-label">Estado</label>
									<div className="btn-group w-100" role="group" aria-label="Estado">
										<button
											type="button"
											className={`btn btn-sm ${bookingStatus === 'confirmada' ? 'btn-primary' : 'btn-light'}`}
											onClick={() => setBookingStatus('confirmada')}
										>
											Confirmada
										</button>
										<button
											type="button"
											className={`btn btn-sm ${bookingStatus === 'a_confirmar' ? 'btn-primary' : 'btn-light'}`}
											onClick={() => setBookingStatus('a_confirmar')}
										>
											A confirmar
										</button>
									</div>
								</div>

								<div className="mb-3">
									<label className="form-label" htmlFor="reason">Razão da consulta</label>
									<textarea
										id="reason"
										className="form-control"
										rows={2}
										value={firstVisitReason}
										onChange={(e) => setFirstVisitReason(e.target.value)}
										placeholder="Ex.: dor, revisão, acompanhamento…"
									/>
								</div>

								<div className="mb-3">
									<div className="d-flex align-items-center justify-content-between gap-2">
										<label className="form-label mb-0" htmlFor="notes">Notas</label>
										<button type="button" className="btn btn-link p-0" onClick={() => setNotesExpanded((v) => !v)}>
											{notesExpanded ? 'Menos' : 'Expandir'}
										</button>
									</div>
									<textarea
										id="notes"
										className="form-control"
										rows={notesExpanded ? 5 : 2}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Ex.: preferir manhã; confirmar por telefone; trazer radiografia…"
									/>
								</div>

								<div className="mb-0">
									{selectedSlot ? (
										<div className="card bg-light border-0">
											<div className="card-body py-2">
												<div className="fw-bold mb-1">Horário escolhido</div>
												<div className="d-flex gap-2 flex-wrap align-items-baseline">
													<strong>{formatSlotLabel(selectedSlot.date, selectedSlot.hhmm)}</strong>
													<span className="text-muted">• {resources.find((r) => r.id === selectedSlot.medicoId)?.name || 'Profissional'}</span>
												</div>
												<button type="button" className="btn btn-link p-0" onClick={() => setSelectedSlot(null)}>
													Limpar (Esc)
												</button>
											</div>
										</div>
									) : (
										<div className="text-muted small">Dica: escolhe o horário na coluna da direita (1 clique).</div>
									)}
								</div>

								{error ? (
									<div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
										{error}
									</div>
								) : null}
								</div>
							</div>

							<div className="mcx-sticky-bottom mt-3">
								<div className="card shadow-sm">
									<div className="card-body">
										<button type="button" className="btn btn-primary w-100" onClick={submit}>
											Marcar consulta
										</button>
										<div className="text-muted small d-flex flex-wrap gap-2 mt-2">
											<span>/ pesquisar utente</span>
											<span>Ctrl+Enter marcar</span>
											<span>Alt+N novo utente</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>

					<aside className="col-12 col-lg-8" aria-label="Disponibilidade">
						<div className="card shadow-sm">
							<div className="card-body">
								<div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-3">
									<div>
										<h5 className="card-title mb-1">Disponibilidade</h5>
										<div className="text-muted small">Sem inserir hora manualmente — escolhe um slot.</div>
									</div>
								<div className="btn-group" role="tablist" aria-label="Modo de disponibilidade">
									<button
										type="button"
										role="tab"
										aria-selected={availabilityMode === 'next'}
										className={`btn btn-sm ${availabilityMode === 'next' ? 'btn-primary' : 'btn-light'}`}
										onClick={() => setAvailabilityMode('next')}
									>
										Próximos horários
									</button>
									<button
										type="button"
										role="tab"
										aria-selected={availabilityMode === 'byPro'}
										className={`btn btn-sm ${availabilityMode === 'byPro' ? 'btn-primary' : 'btn-light'}`}
										onClick={() => setAvailabilityMode('byPro')}
									>
										Por profissional
									</button>
								</div>
							</div>

							<div className="row g-3">
								<div className="col-12 col-md-5">
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
										<div className="text-muted small mt-2">Dias a cinzento: sem horários para o tipo/duração atual.</div>
								</div>

								<div className="col-12 col-md-7">
									{availabilityMode === 'next' ? (
										<>
											<div className="fw-bold mb-2">Próximos horários</div>
											{nextSlots.length ? (
												<div className="list-group">
													{nextSlots.map((s) => {
														const isActive =
															selectedSlot &&
															dateToISO(selectedSlot.date) === dateToISO(s.date) &&
															selectedSlot.hhmm === s.hhmm &&
															selectedSlot.medicoId === s.medicoId
														return (
															<button
																key={`${dateToISO(s.date)}|${s.hhmm}|${s.medicoId}`}
																type="button"
																className={`list-group-item list-group-item-action${isActive ? ' active' : ''}`}
																onClick={() => pickSlot(s)}
															>
																<div className="fw-semibold">{formatSlotLabel(s.date, s.hhmm)}</div>
																<div className={isActive ? 'text-white-50 small' : 'text-muted small'}>
																	{resources.find((r) => r.id === s.medicoId)?.name || 'Profissional'}
																</div>
															</button>
														)
													})}
												</div>
											) : (
													<div className="text-muted small">Sem horários nos próximos dias para este tipo/duração.</div>
											)}
										</>
									) : (
										<>
											<div className="fw-bold mb-2">{selectedDate.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
											<div className="d-flex flex-wrap gap-2 mb-2" role="tablist" aria-label="Profissionais">
												{resources.map((r) => (
													<button
														key={r.id}
														type="button"
														className={`btn btn-sm ${Number(professionalId) === r.id ? 'btn-primary' : 'btn-light'}`}
														onClick={() => setProfessionalId(String(r.id))}
													>
														{r.name}
													</button>
												))}
											</div>
											{professionalId === 'any' ? (
													<div className="text-muted small">Escolhe um profissional acima para ver os slots.</div>
											) : (
												(() => {
													const pid = Number(professionalId)
													const slots = byProfessionalDaySlots.get(pid) || []
													return slots.length ? (
														<div className="d-flex flex-wrap gap-2">
															{slots.map((hhmm) => (
																<button
																	key={hhmm}
																	type="button"
																	className={`btn btn-sm ${
																	selectedSlot &&
																	dateToISO(selectedSlot.date) === dateToISO(selectedDate) &&
																	selectedSlot.hhmm === hhmm &&
																	selectedSlot.medicoId === pid
																		? 'btn-primary'
																		: 'btn-light'
																	}`}
																	onClick={() => pickSlot({ date: selectedDate, hhmm, medicoId: pid })}
																>
																	{hhmm}
																</button>
															))}
														</div>
													) : (
															<div className="text-muted small">Sem horários neste dia para este tipo/duração.</div>
													)
												})()
											)}
										</>
									)}
								</div>
							</div>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</AppLayout>
	)
}
