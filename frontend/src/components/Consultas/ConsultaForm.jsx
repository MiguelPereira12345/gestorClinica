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
		<section className="consulta-card" aria-label="Formulário de consulta">
			<div className="consulta-card-head">
				<div>
					<div className="consulta-card-title">Dados da Consulta</div>
					<div className="consulta-card-sub">Preenche a informação conforme o processo clínico.</div>
				</div>
			</div>

			<div className="consulta-form-grid">
				<div className="consulta-form-field">
					<label className="consulta-form-label">Paciente</label>
					<input
						className="consulta-form-input"
						placeholder="Nome do paciente"
						value={form.patientName}
						onChange={(e) => update({ patientName: e.target.value })}
					/>
				</div>

				<div className="consulta-form-field">
					<label className="consulta-form-label">ID do paciente (opcional)</label>
					<div style={{ display: 'flex', gap: 10 }}>
						<input
							className="consulta-form-input"
							placeholder="Ex: P001"
							value={form.patientId}
							onChange={(e) => update({ patientId: e.target.value })}
						/>
						<button
							type="button"
							className="consultas-btn consultas-btn-light"
							onClick={() => navigate('/pacientes/novo')}
						>
							Criar paciente
						</button>
					</div>
				</div>

				<div className="consulta-form-field">
					<label className="consulta-form-label">Profissional</label>
					<select
						className="consulta-form-select"
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

				<div className="consulta-form-field">
					<label className="consulta-form-label">Especialidade</label>
					<select
						className="consulta-form-select"
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

				<div className="consulta-form-field">
					<label className="consulta-form-label">Data</label>
					<input
						type="date"
						className="consulta-form-input"
						value={form.date}
						onChange={(e) => update({ date: e.target.value })}
					/>
				</div>

				<div className="consulta-form-field">
					<label className="consulta-form-label">Hora</label>
					<input
						type="time"
						className="consulta-form-input"
						value={form.time}
						onChange={(e) => update({ time: e.target.value })}
					/>
				</div>

				<div className="consulta-form-field">
					<label className="consulta-form-label">Duração</label>
					<select
						className="consulta-form-select"
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

				<div className="consulta-form-field">
					<label className="consulta-form-label">Tipo de marcação</label>
					<select
						className="consulta-form-select"
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

				<div className="consulta-form-field">
					<label className="consulta-form-label">Estado</label>
					<select
						className="consulta-form-select"
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

			<div style={{ marginTop: 12 }}>
				<label className="consulta-form-label">Razão da primeira visita</label>
				<textarea
					className="consulta-form-textarea"
					rows={2}
					value={form.firstVisitReason}
					onChange={(e) => update({ firstVisitReason: e.target.value })}
				/>
			</div>

			<div style={{ marginTop: 12 }}>
				<label className="consulta-form-label">Notas internas</label>
				<textarea
					className="consulta-form-textarea"
					rows={3}
					value={form.notes}
					onChange={(e) => update({ notes: e.target.value })}
				/>
			</div>

			{error ? <div style={{ marginTop: 10, color: '#c53a3a', fontWeight: 700 }}>{error}</div> : null}

			<div className="consulta-form-actions">
				<button type="button" className="consultas-btn" onClick={onCancel}>
					Cancelar
				</button>
				<button type="button" className="consultas-btn consultas-btn-primary" onClick={submit}>
					{submitLabel}
				</button>
			</div>
		</section>
	)
}
