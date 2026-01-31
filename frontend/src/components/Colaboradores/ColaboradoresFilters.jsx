import React from 'react'
import { X } from 'lucide-react'

export default function ColaboradoresFilters({ filters, onChange, onClear }) {
	const handleChange = (field, value) => {
		onChange({ ...filters, [field]: value })
	}

	return (
		<div className="colaboradores-filters-card">
			<div className="colaboradores-filters-head">
				<div>
					<div className="colaboradores-filters-title">Filtros</div>
					<div className="colaboradores-filters-subtitle">Refine sua busca</div>
				</div>
				<div className="colaboradores-filters-actions">
					<button
						type="button"
						className="colaboradores-btn colaboradores-btn-light"
						onClick={onClear}
					>
						<X width="16" height="16" aria-hidden="true" />
						Limpar
					</button>
				</div>
			</div>

			<div className="colaboradores-filters-grid">
				<div className="colaboradores-field">
					<label className="colaboradores-label">Nome</label>
					<div className="colaboradores-input-wrap">
						<input
							type="text"
							placeholder="Buscar por nome..."
							value={filters.name}
							onChange={(e) => handleChange('name', e.target.value)}
							className="colaboradores-input"
						/>
					</div>
				</div>

				<div className="colaboradores-field">
					<label className="colaboradores-label">Cargo</label>
					<select
						value={filters.specialty}
						onChange={(e) => handleChange('specialty', e.target.value)}
						className="colaboradores-select"
					>
						<option value="">Todos</option>
						<option value="admin">Admin</option>
						<option value="medico">Médico</option>
						<option value="recepcionista">Recepcionista</option>
					</select>
				</div>

				<div className="colaboradores-field">
					<label className="colaboradores-label">Status</label>
					<select
						value={filters.status}
						onChange={(e) => handleChange('status', e.target.value)}
						className="colaboradores-select"
					>
						<option value="">Todos</option>
						<option value="ativo">Ativo</option>
						<option value="inativo">Inativo</option>
					</select>
				</div>

				<div className="colaboradores-field"></div>
				<div className="colaboradores-field"></div>
			</div>
		</div>
	)
}
