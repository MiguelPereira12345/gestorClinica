import React, { useState } from 'react'

function normalizeCargoValue(value) {
	const v = String(value || '').trim().toLowerCase()
	if (!v) return ''
	if (v === 'admin') return 'admin'
	if (v === 'medico' || v === 'médico') return 'medico'
	if (v === 'secretaria') return 'secretaria'
	if (v === 'recepcionista' || v === 'recepcionista(a)' || v === 'receção' || v === 'rececao') return 'secretaria'
	// labels stored in cache
	if (v === 'médico' || v === 'medico') return 'medico'
	if (v === 'admin') return 'admin'
	if (v === 'secretaria') return 'secretaria'
	return ''
}

export default function ColaboradorForm({ initial, submitLabel, onCancel, onSubmit }) {
	const isEdit = Boolean(initial?.id)
	const [form, setForm] = useState(initial || {
		name: '',
		email: '',
		phone: '',
		cargo: '',
		password: '',
		confirmPassword: '',
		status: 'ativo',
	})

	const handleChange = (e) => {
		const { name, value } = e.target
		if (name === 'cargo') {
			setForm((prev) => ({ ...prev, cargo: normalizeCargoValue(value) }))
			return
		}
		setForm(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!String(form.cargo || '').trim()) {
			window.alert('Cargo em falta')
			return
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
						<option value="admin">Admin</option>
						<option value="medico">Médico</option>
						<option value="secretaria">Secretaria</option>
					</select>
				</div>

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
