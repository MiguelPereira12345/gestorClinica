import React, { useState } from 'react'
import { isValidName, isValidPhone, sanitizeName, sanitizePhone } from '../../utils/validation'

function sanitizeOmd(value) {
	return String(value || '')
		.replace(/\D/g, '')
		.slice(0, 5)
}

function normalizeCargoValue(value) {
	const v = String(value || '').trim().toLowerCase()
	if (!v) return ''
	if (v === 'admin') return 'admin'
	if (v === 'secretario/a' || v === 'secretário/a' || v === 'secretario' || v === 'secretário') return 'admin'
	if (v === 'medico' || v === 'médico') return 'medico'
	if (v === 'medico/a' || v === 'médico/a' || v === 'medica/o' || v === 'médica/o' || v === 'medica' || v === 'médica') return 'medico'
	// labels stored in cache
	if (v === 'médico/a' || v === 'médico' || v === 'medico/a' || v === 'medico') return 'medico'
	if (v === 'secretário/a' || v === 'secretario/a' || v === 'admin') return 'admin'
	return ''
}

export default function ColaboradorForm({ initial, submitLabel, onCancel, onSubmit }) {
	const isEdit = Boolean(initial?.id || initial?.id_utilizador || initial?.idUtilizador || initial?.userId)
	const [form, setForm] = useState(initial || {
		name: '',
		email: '',
		phone: '',
		cargo: '',
		omd: '',
		password: '',
		confirmPassword: '',
		status: 'ativo',
	})

	const cargoNorm = normalizeCargoValue(form.cargo)
	const isMedico = cargoNorm === 'medico'

	const handleChange = (e) => {
		const { name, value } = e.target
		if (name === 'cargo') {
			setForm((prev) => ({ ...prev, cargo: normalizeCargoValue(value) }))
			return
		}
		if (name === 'name') {
			setForm((prev) => ({ ...prev, name: sanitizeName(value) }))
			return
		}
		if (name === 'phone') {
			setForm((prev) => ({ ...prev, phone: sanitizePhone(value) }))
			return
		}
		if (name === 'omd') {
			setForm((prev) => ({ ...prev, omd: sanitizeOmd(value) }))
			return
		}
		setForm(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!isValidName(form.name)) {
			window.alert('Nome inválido (não pode conter números).')
			return
		}
		if (!isValidPhone(form.phone)) {
			window.alert('Telefone inválido (use apenas dígitos; mínimo 9).')
			return
		}
		if (!String(form.cargo || '').trim()) {
			window.alert('Cargo em falta')
			return
		}
		if (isMedico) {
			const omd = String(form.omd || '').trim()
			if (!omd) {
				window.alert('OMD em falta')
				return
			}
			if (!/^\d{5}$/.test(omd)) {
				window.alert('OMD inválido (tem de ter exatamente 5 números).')
				return
			}
		}
		if (!isEdit) {
			const pw = String(form.password || '')
			if (!pw.trim()) {
				window.alert('Password em falta')
				return
			}
			if (pw.length < 6) {
				window.alert('A password deve ter pelo menos 6 caracteres')
				return
			}
			if (String(form.confirmPassword || '') !== pw) {
				window.alert('As passwords não coincidem')
				return
			}
		}
		onSubmit(form)
	}

	return (
		<form onSubmit={handleSubmit} className="ui-card p-3">
			<div className="row g-3">
				<div className="col-12 col-md-6">
					<label className="form-label">Nome Completo</label>
					<input
						type="text"
						name="name"
						value={form.name}
						onChange={handleChange}
						className="form-control"
						required
					/>
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label">Email</label>
					<input
						type="email"
						name="email"
						value={form.email}
						onChange={handleChange}
						className="form-control"
						required
					/>
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label">Telefone</label>
					<input
						type="tel"
						name="phone"
						value={form.phone}
						onChange={handleChange}
						className="form-control"
						required
					/>
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label">Cargo</label>
					<select
						name="cargo"
						value={normalizeCargoValue(form.cargo)}
						onChange={handleChange}
						className="form-select"
						required
					>
						<option value="">Selecione um cargo</option>
						<option value="admin">Secretário/a</option>
						<option value="medico">Médico/a</option>
					</select>
				</div>

				{isMedico ? (
					<div className="col-12 col-md-6">
						<label className="form-label">OMD</label>
						<input
							type="text"
							name="omd"
							value={form.omd || ''}
							onChange={handleChange}
							className="form-control"
							inputMode="numeric"
							pattern="\d{5}"
							maxLength={5}
							required
						/>
					</div>
				) : null}

				{!isEdit ? (
					<>
						<div className="col-12 col-md-6">
							<label className="form-label">Password</label>
							<input
								type="password"
								name="password"
								value={form.password}
								onChange={handleChange}
								className="form-control"
								autoComplete="new-password"
								required
							/>
						</div>

						<div className="col-12 col-md-6">
							<label className="form-label">Confirmar password</label>
							<input
								type="password"
								name="confirmPassword"
								value={form.confirmPassword}
								onChange={handleChange}
								className="form-control"
								autoComplete="new-password"
								required
							/>
						</div>
					</>
				) : null}

				<div className="col-12 col-md-6">
					<label className="form-label">Estado</label>
					<select
						name="status"
						value={form.status}
						onChange={handleChange}
						className="form-select"
					>
						<option value="ativo">Ativo</option>
						<option value="inativo">Inativo</option>
					</select>
				</div>
			</div>

			<div className="d-flex justify-content-end gap-2 mt-3">
				<button type="button" className="btn btn-secondary" onClick={onCancel}>
					Cancelar
				</button>
				<button type="submit" className="btn btn-primary">
					{submitLabel}
				</button>
			</div>
		</form>
	)
}
