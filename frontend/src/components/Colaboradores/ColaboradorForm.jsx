import React, { useState } from 'react'

export default function ColaboradorForm({ initial, submitLabel, onCancel, onSubmit }) {
	const [form, setForm] = useState(initial || {
		name: '',
		email: '',
		phone: '',
		cargo: '',
		status: 'ativo',
	})

	const handleChange = (e) => {
		const { name, value } = e.target
		setForm(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = (e) => {
		e.preventDefault()
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
					/>
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label">Cargo</label>
					<select
						name="cargo"
						value={form.cargo}
						onChange={handleChange}
						className="form-select"
					>
						<option value="">Selecione um cargo</option>
						<option value="admin">Admin</option>
						<option value="medico">Médico</option>
						<option value="recepcionista">Recepcionista</option>
					</select>
				</div>

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
