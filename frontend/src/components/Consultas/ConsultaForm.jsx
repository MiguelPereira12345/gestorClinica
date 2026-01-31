import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONSULTA_STATUS, DURACOES_MIN, TIPO_MARCACAO } from '../../utils/consultasStorage'
import { combineDateAndTimeToISO, toInputDate, toInputTime } from '../../utils/dateTime'
import { ESPECIALIDADES, PROFESSIONALS } from '../../utils/consultasLookups'

function getProfessionalById(id) {
	return PROFESSIONALS.find((p) => String(p.id) === String(id)) || null
}

export default function ConsultaForm({
	initial,
	submitLabel = 'Guardar',
	onSubmit,
	onCancel,
}) {
	const navigate = useNavigate()
	const [form, setForm] = useState(() => ({
		patientId: initial?.patientId || '',
		patientName: initial?.patientName || '',
		medicoId: String(initial?.medicoId || ''),
		medicoName: initial?.medicoName || '',
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

	const professionalOptions = useMemo(() => PROFESSIONALS, [])

	function update(patch) {
		setForm((prev) => ({ ...prev, ...patch }))
		setError('')
	}

	function validate() {
		if (!String(form.patientName || '').trim()) return 'Indica o paciente.'
		if (!String(form.medicoId || '').trim()) return 'Seleciona um profissional.'
		if (!String(form.specialty || '').trim()) return 'Seleciona a especialidade.'
		if (!form.date) return 'Seleciona a data.'
		if (!form.time) return 'Seleciona a hora.'
		const startISO = combineDateAndTimeToISO(form.date, form.time)
		if (!startISO) return 'Data/hora inválida.'
		return ''
	}

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
		<section className="ui-card p-3" aria-label="Formulário de consulta">
			<div className="mb-3">
				<div className="fw-bold">Dados da Consulta</div>
				<div className="ui-meta">Preenche a informação conforme o processo clínico.</div>
			</div>

			<div className="row g-3">
				<div className="col-md-6">
					<label className="form-label">Paciente</label>
					<input
						className="form-control"
						placeholder="Nome do paciente"
						value={form.patientName}
						onChange={(e) => update({ patientName: e.target.value })}
					/>
				</div>

				<div className="col-md-6">
					<label className="form-label">ID do paciente (opcional)</label>
					<div className="d-flex gap-2">
						<input
							className="form-control"
							placeholder="Ex: P001"
							value={form.patientId}
							onChange={(e) => update({ patientId: e.target.value })}
						/>
						<button
							type="button"
							className="btn btn-light"
							onClick={() => navigate('/pacientes/novo')}
						>
							Criar paciente
						</button>
					</div>
				</div>

				<div className="col-md-6">
					<label className="form-label">Profissional</label>
					<select
						className="form-select"
						value={form.medicoId}
						onChange={(e) => update({ medicoId: e.target.value })}
					>
						<option value="">Selecione</option>
						{professionalOptions.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
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
					<input
						type="time"
						className="form-control"
						value={form.time}
						onChange={(e) => update({ time: e.target.value })}
					/>
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

				<div className="col-md-6">
					<label className="form-label">Estado</label>
					<select
						className="form-select"
						value={form.bookingStatus}
						onChange={(e) => update({ bookingStatus: e.target.value })}
					>
						{CONSULTA_STATUS.map((s) => (
							<option key={s.id} value={s.id}>
								{s.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="mt-3">
				<label className="form-label">Razão da primeira visita</label>
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
		</section>
	)
}

