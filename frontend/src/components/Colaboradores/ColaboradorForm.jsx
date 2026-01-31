import React, { useState } from 'react'
import { X } from 'lucide-react'

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
		<form onSubmit={handleSubmit} className="colaborador-card">
			<div className="colaborador-form-grid">
				<div className="colaborador-form-field">
					<label className="colaborador-form-label">Nome Completo</label>
					<input
						type="text"
						name="name"
						value={form.name}
						onChange={handleChange}
						className="colaborador-form-input"
						required
					/>
				</div>

				<div className="colaborador-form-field">
					<label className="colaborador-form-label">Email</label>
					<input
						type="email"
						name="email"
						value={form.email}
						onChange={handleChange}
						className="colaborador-form-input"
						required
					/>
				</div>

				<div className="colaborador-form-field">
					<label className="colaborador-form-label">Telefone</label>
					<input
						type="tel"
						name="phone"
						value={form.phone}
						onChange={handleChange}
						className="colaborador-form-input"
					/>
				</div>

				<div className="colaborador-form-field">
					<label className="colaborador-form-label">Cargo</label>
					<select
						name="cargo"
						value={form.cargo}
						onChange={handleChange}
						className="colaborador-form-select"
					>
						<option value="">Selecione um cargo</option>
						<option value="admin">Admin</option>
						<option value="medico">Médico</option>
						<option value="recepcionista">Recepcionista</option>
					</select>
				</div>

				<div className="colaborador-form-field">
					<label className="colaborador-form-label">Status</label>
					<select
						name="status"
						value={form.status}
						onChange={handleChange}
						className="colaborador-form-select"
					>
						<option value="ativo">Ativo</option>
						<option value="inativo">Inativo</option>
					</select>
				</div>
			</div>

			<div className="colaborador-form-actions">
				<button type="button" className="colaboradores-btn" onClick={onCancel}>
					Cancelar
				</button>
				<button type="submit" className="colaboradores-btn colaboradores-btn-primary">
					{submitLabel}
				</button>
			</div>
		</form>
	)
}
