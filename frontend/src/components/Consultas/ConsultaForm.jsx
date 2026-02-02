import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CONSULTA_STATUS, DURACOES_MIN, TIPO_MARCACAO } from '../../utils/consultasStorage'
import { combineDateAndTimeToISO, toInputDate, toInputTime } from '../../utils/dateTime'
import { ESPECIALIDADES } from '../../utils/consultasLookups'
import { listAvailableSlots } from '../../utils/appointmentStorage'
import { loadPatients } from '../../utils/patientStorage'
import { loadMedicosForSelect, refreshMedicosForSelect } from '../../utils/professionalsStorage'
import { getCurrentUser, isMedicoUser } from '../../utils/apiClient'


function normalizePatient(p) {
	return {
		id: p?.id,
		nome: p?.nome,
		responsavelId: p?.responsavelId || p?.data?.responsavelId || null,
		telefone: p?.telefone || p?.data?.contactoTelefone || '',
	}
}

function normalizeText(value) {
	return String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
}

function digitsOnly(value) {
	return String(value || '').replace(/\D+/g, '')
}

function parseInputDateToLocalDate(dateStr) {
	const [y, m, d] = String(dateStr || '').split('-').map(Number)
	if (!y || !m || !d) return null
	return new Date(y, m - 1, d)
}

export default function ConsultaForm({
	initial,
	submitLabel = 'Guardar',
	onSubmit,
	onCancel,
}) {
	const currentUser = getCurrentUser()
	const lockedToCurrentMedico = isMedicoUser() && currentUser?.id
	const patientInputRef = useRef(null)
	const patientPopoverRef = useRef(null)
	const timeButtonRef = useRef(null)
	const timePopoverRef = useRef(null)

	const [form, setForm] = useState(() => ({
		patientId: initial?.patientId || '',
		patientName: initial?.patientName || '',
		forDependent: Boolean(initial?.dependentName),
		dependentId: '',
		dependentName: initial?.dependentName || '',
		medicoId: String(initial?.medicoId || (lockedToCurrentMedico ? currentUser.id : '') || ''),
		medicoName: initial?.medicoName || (lockedToCurrentMedico ? currentUser.nome : '') || '',
		specialty: initial?.specialty || 'Clínica Geral',
		date: toInputDate(initial?.startISO) || '',
		time: toInputTime(initial?.startISO) || '',
		durationMin: Number(initial?.durationMin || 30),
		bookingType: initial?.bookingType || 'vaga',
		bookingStatus: initial?.bookingStatus || 'a_confirmar',
		firstVisitReason: initial?.firstVisitReason || '',
		notes: initial?.notes || '',
	}))
	const [error, setError] = useState('')
	const [showPatientResults, setShowPatientResults] = useState(false)
	const [showTimeResults, setShowTimeResults] = useState(false)
	const [professionalOptions, setProfessionalOptions] = useState(() => loadMedicosForSelect())

	useEffect(() => {
		let mounted = true
		;(async () => {
			const list = await refreshMedicosForSelect()
			if (mounted) setProfessionalOptions(list)
		})()
		return () => {
			mounted = false
		}
	}, [])

	useEffect(() => {
		if (!lockedToCurrentMedico) return
		const myId = String(currentUser?.id || '').trim()
		if (!myId) return
		setForm((prev) => {
			if (String(prev.medicoId || '').trim() === myId) return prev
			return { ...prev, medicoId: myId, medicoName: currentUser?.nome || prev.medicoName }
		})
	}, [lockedToCurrentMedico, currentUser?.id, currentUser?.nome])

	function getProfessionalById(id) {
		return professionalOptions.find((p) => String(p.id) === String(id)) || null
	}

	const professionalOptionsWithFallback = useMemo(() => {
		const base = Array.isArray(professionalOptions) ? professionalOptions : []
		const selectedId = String(form.medicoId || '').trim()
		if (!selectedId) return base
		if (base.some((p) => String(p.id) === selectedId)) return base
		const fallbackName = String(form.medicoName || '').trim() || 'Profissional'
		return [{ id: selectedId, name: fallbackName }, ...base]
	}, [form.medicoId, form.medicoName, professionalOptions])

	const patients = useMemo(() => {
		const stored = loadPatients().map(normalizePatient)
		const map = new Map()
		for (const p of stored) {
			if (!p?.id) continue
			map.set(p.id, p)
		}
		return Array.from(map.values())
	}, [])

	const patientResults = useMemo(() => {
		const qText = normalizeText(form.patientName)
		const qDigits = digitsOnly(form.patientName)
		if (!qText && !qDigits) return []
		const scored = []
		for (const p of patients) {
			const nameNorm = normalizeText(p.nome)
			const idNorm = normalizeText(p.id)
			const phoneRaw = String(p.telefone || '')
			const phoneNorm = normalizeText(phoneRaw)
			const phoneDigits = digitsOnly(phoneRaw)
			const hay = `${nameNorm} ${idNorm} ${phoneNorm} ${phoneDigits}`

			const matchesText = qText ? hay.includes(qText) : false
			const matchesDigits = qDigits ? phoneDigits.includes(qDigits) || idNorm.includes(qDigits) : false
			if (!matchesText && !matchesDigits) continue

			let score = 50
			if (qDigits && phoneDigits.startsWith(qDigits)) score = 95
			else if (qText && idNorm === qText) score = 100
			else if (qText && nameNorm.startsWith(qText)) score = 80
			else if (qText && idNorm.startsWith(qText)) score = 70
			scored.push({ p, score })
		}
		scored.sort((a, b) => b.score - a.score)
		return scored.slice(0, 8).map((x) => x.p)
	}, [form.patientName, patients])

	function update(patch) {
		setForm((prev) => ({ ...prev, ...patch }))
		setError('')
	}

	function pickPatient(p) {
		update({
			patientName: p.nome || '',
			patientId: p.id || '',
			dependentId: '',
			dependentName: '',
		})
		setShowPatientResults(false)
	}

	const dependentsForSelectedPatient = useMemo(() => {
		const responsavelId = String(form.patientId || '').trim()
		if (!responsavelId) return []
		return patients
			.filter((p) => String(p?.responsavelId || '') === responsavelId)
			.sort((a, b) => String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-PT'))
	}, [form.patientId, patients])

	useEffect(() => {
		if (!form.forDependent) return
		if (!form.patientId) return
		if (form.dependentId) return
		if (!form.dependentName) return
		const target = normalizeText(form.dependentName)
		if (!target) return
		const match = dependentsForSelectedPatient.find((d) => normalizeText(d?.nome) === target)
		if (!match?.id) return
		setForm((prev) => ({ ...prev, dependentId: match.id }))
	}, [dependentsForSelectedPatient, form.dependentId, form.dependentName, form.forDependent, form.patientId])

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

	useEffect(() => {
		function onMouseDown(e) {
			const pop = timePopoverRef.current
			const btn = timeButtonRef.current
			if (!pop || !btn) return
			if (pop.contains(e.target) || btn.contains(e.target)) return
			setShowTimeResults(false)
		}
		window.addEventListener('mousedown', onMouseDown)
		return () => window.removeEventListener('mousedown', onMouseDown)
	}, [])

	function validate() {
		if (!String(form.patientName || '').trim()) return 'Indica o paciente.'
		if (!String(form.medicoId || '').trim()) return 'Seleciona um profissional.'
		if (!String(form.specialty || '').trim()) return 'Seleciona a especialidade.'
		if (form.forDependent) {
			if (!String(form.patientId || '').trim()) return 'Seleciona um paciente da lista para poderes escolher o dependente.'
			if (!String(form.dependentId || '').trim()) return 'Seleciona o dependente.'
		}
		if (!form.date) return 'Seleciona a data.'
		if (!form.time) return 'Seleciona a hora (apenas horários disponíveis).'
		const startISO = combineDateAndTimeToISO(form.date, form.time)
		if (!startISO) return 'Data/hora inválida.'
		
		// Verificar se a data/hora não está no passado
		const consultaDate = new Date(startISO)
		const now = new Date()
		if (consultaDate < now) return 'Não é possível criar consultas no passado.'
		
		return ''
	}

	const availableTimes = useMemo(() => {
		const day = parseInputDateToLocalDate(form.date)
		const medicoId = Number(form.medicoId)
		if (!day || !Number.isFinite(medicoId) || !medicoId) return []
		const res = listAvailableSlots({
			date: day,
			medicoId,
			durationMin: Number(form.durationMin || 30),
			limit: 200,
			stepMin: 15,
			excludeAppointmentId: initial?.id,
		})
		return Array.isArray(res?.slots) ? res.slots : []
	}, [form.date, form.durationMin, form.medicoId, initial?.id])

	useEffect(() => {
		if (!form.time) return
		if (availableTimes.includes(form.time)) return
		// if the current time isn't available for the selected day/professional/duration, clear it
		setForm((prev) => ({ ...prev, time: '' }))
	}, [availableTimes, form.time])

	function submit() {
		const v = validate()
		if (v) {
			setError(v)
			return
		}

		const prof = getProfessionalById(form.medicoId)
		const payload = {
			patientId: String(form.patientId || '').trim() || undefined,
			patientName: String(form.patientName || '').trim(),
			dependentName: form.forDependent ? String(form.dependentName || '').trim() : '',
			medicoId: Number(form.medicoId),
			medicoName: prof?.name || form.medicoName || 'Profissional',
			specialty: form.specialty,
			startISO: combineDateAndTimeToISO(form.date, form.time),
			durationMin: Number(form.durationMin || 30),
			bookingType: form.bookingType,
			bookingStatus: form.bookingStatus,
			firstVisitReason: String(form.firstVisitReason || '').trim(),
			notes: String(form.notes || '').trim(),
			isNoShow: form.bookingStatus === 'falta',
		}

		onSubmit(payload)
	}

	return (
		<section className="card shadow-sm" aria-label="Formulário de consulta">
			<div className="card-body">
				<div className="mb-3">
					<h5 className="card-title mb-1">Dados da Consulta</h5>
					<div className="text-muted small">Preenche a informação conforme o processo clínico.</div>
				</div>

			<div className="row g-3">
				<div className="col-12">
					<label className="form-label">Paciente</label>
					<div className="position-relative">
						<input
							ref={patientInputRef}
							className="form-control"
							placeholder="Pesquisar por nome, telefone ou ID"
							value={form.patientName}
							onChange={(e) => {
								update({ patientName: e.target.value, patientId: '', dependentId: '', dependentName: '' })
								setShowPatientResults(true)
							}}
							onFocus={() => setShowPatientResults(true)}
							autoComplete="off"
						/>
						{showPatientResults && patientResults.length ? (
							<div ref={patientPopoverRef} className="dropdown-menu show w-100 p-0" role="listbox">
								{patientResults.map((p) => (
									<button key={p.id} type="button" className="dropdown-item py-2" onClick={() => pickPatient(p)}>
										<div className="fw-semibold">{p.nome}</div>
										<div className="text-muted small">
											{p.id}
											{p.telefone ? ` • ${p.telefone}` : ''}
										</div>
									</button>
								))}
							</div>
						) : null}
					</div>
				</div>

				<div className="col-12">
					<div className="form-check form-switch">
						<input
							className="form-check-input"
							type="checkbox"
							role="switch"
							id="consultaForDependent"
							checked={Boolean(form.forDependent)}
							onChange={(e) => {
								const checked = e.target.checked
								update({
									forDependent: checked,
									dependentId: '',
									dependentName: '',
								})
							}}
						/>
						<label className="form-check-label" htmlFor="consultaForDependent">
							Consulta para dependente
						</label>
					</div>

					{form.forDependent ? (
						<div className="mt-2">
							<label className="form-label">Dependente</label>
							{!String(form.patientId || '').trim() ? (
								<div className="alert alert-warning py-2 mb-0" role="alert">
									Seleciona primeiro um paciente na pesquisa para listar os dependentes.
								</div>
							) : dependentsForSelectedPatient.length === 0 ? (
								<div className="alert alert-warning py-2 mb-0" role="alert">
									Este paciente não tem dependentes registados.
								</div>
							) : (
								<select
									className="form-select"
									value={form.dependentId}
									onChange={(e) => {
										const depId = e.target.value
										const dep = dependentsForSelectedPatient.find((d) => String(d.id) === String(depId))
										update({ dependentId: depId, dependentName: dep?.nome || '' })
									}}
								>
									<option value="">Selecione</option>
									{dependentsForSelectedPatient.map((d) => (
										<option key={d.id} value={d.id}>
											{d.nome}
										</option>
									))}
								</select>
							)}
						</div>
					) : null}
				</div>

				<div className="col-md-6">
					<label className="form-label">Profissional</label>
					<select
						className="form-select"
						value={form.medicoId}
						onChange={(e) => update({ medicoId: e.target.value })}
						disabled={!!lockedToCurrentMedico}
					>
						<option value="">Selecione</option>
						{professionalOptionsWithFallback.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
					{lockedToCurrentMedico ? (
						<div className="form-text">Como médico, o profissional fica automaticamente definido para si.</div>
					) : null}
				</div>

				<div className="col-md-6">
					<label className="form-label">Especialidade</label>
					<select
						className="form-select"
						value={form.specialty}
						onChange={(e) => update({ specialty: e.target.value })}
					>
						{ESPECIALIDADES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>

				<div className="col-md-6">
					<label className="form-label">Data</label>
					<input
						type="date"
						className="form-control"
						value={form.date}
						onChange={(e) => update({ date: e.target.value })}
					/>
				</div>

				<div className="col-md-6">
					<label className="form-label">Hora</label>
					<div className="position-relative">
						<button
							ref={timeButtonRef}
							type="button"
							className="form-select text-start"
							disabled={!form.date || !String(form.medicoId || '').trim()}
							aria-haspopup="listbox"
							aria-expanded={showTimeResults}
							onClick={() => setShowTimeResults((v) => !v)}
						>
							{form.time || 'Selecione'}
						</button>

						{showTimeResults ? (
							<div
								ref={timePopoverRef}
								className="dropdown-menu show w-100 p-0"
								role="listbox"
								style={{ top: '100%', left: 0, right: 0, maxHeight: 280, overflowY: 'auto' }}
							>
								{availableTimes.length ? (
									availableTimes.map((t) => (
										<button
											key={t}
											type="button"
											className={`dropdown-item py-2 ${form.time === t ? 'active' : ''}`}
											onClick={() => {
												update({ time: t })
												setShowTimeResults(false)
											}}
										>
											{t}
										</button>
									))
								) : (
									<div className="px-3 py-2 text-muted small">Sem horários disponíveis.</div>
								)}
							</div>
						) : null}
					</div>

					{form.date && String(form.medicoId || '').trim() ? (
						availableTimes.length ? null : (
							<div className="form-text text-danger">Sem horários disponíveis para este dia/duração.</div>
						)
					) : (
						<div className="form-text">Seleciona primeiro a data e o profissional.</div>
					)}
				</div>

				<div className="col-md-6">
					<label className="form-label">Duração</label>
					<select
						className="form-select"
						value={String(form.durationMin)}
						onChange={(e) => update({ durationMin: Number(e.target.value) })}
					>
						{DURACOES_MIN.map((m) => (
							<option key={m} value={m}>
								{m} min
							</option>
						))}
					</select>
				</div>

				<div className="col-md-6">
					<label className="form-label">Tipo de marcação</label>
					<select
						className="form-select"
						value={form.bookingType}
						onChange={(e) => update({ bookingType: e.target.value })}
					>
						{TIPO_MARCACAO.map((t) => (
							<option key={t.id} value={t.id}>
								{t.label}
							</option>
						))}
					</select>
				</div>


			</div>

			<div className="mt-3">
				<label className="form-label">Razão da consulta</label>
				<textarea
					className="form-control"
					rows={2}
					value={form.firstVisitReason}
					onChange={(e) => update({ firstVisitReason: e.target.value })}
				/>
			</div>

			<div className="mt-3">
				<label className="form-label">Notas internas</label>
				<textarea
					className="form-control"
					rows={3}
					value={form.notes}
					onChange={(e) => update({ notes: e.target.value })}
				/>
			</div>

			{error ? (
				<div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
					{error}
				</div>
			) : null}

			<div className="d-flex gap-2 justify-content-end mt-3">
				<button type="button" className="btn btn-secondary" onClick={onCancel}>
					Cancelar
				</button>
				<button type="button" className="btn btn-primary" onClick={submit}>
					{submitLabel}
				</button>
			</div>
			</div>
		</section>
	)
}

