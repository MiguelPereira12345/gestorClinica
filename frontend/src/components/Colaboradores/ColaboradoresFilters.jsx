import React from 'react'
import { Search, X } from 'lucide-react'

export default function ColaboradoresFilters({ filters, onChange, onClear }) {
	const handleChange = (field, value) => {
		onChange({ ...filters, [field]: value })
	}

	return (
		<div className="ui-card p-3">
			<div className="d-flex align-items-start justify-content-between gap-2 mb-3">
				<div>
					<div className="fw-bold">Filtros</div>
					<div className="ui-meta">Refine a sua busca</div>
				</div>
				<div className="d-inline-flex gap-2">
					<button type="button" className="btn btn-light btn-sm" onClick={onClear}>
						<X size={16} aria-hidden="true" />
						Limpar
					</button>
				</div>
			</div>

			<div className="row g-3">
				<div className="col-12 col-md-6 col-lg-5">
					<label className="form-label">Nome</label>
					<div className="input-group">
						<span className="input-group-text">
							<Search size={16} aria-hidden="true" />
						</span>
						<input
							type="text"
							placeholder="Buscar por nome..."
							value={filters.name}
							onChange={(e) => handleChange('name', e.target.value)}
							className="form-control"
						/>
					</div>
				</div>

				<div className="col-12 col-md-6 col-lg-4">
					<label className="form-label">Cargo</label>
					<select
						value={filters.specialty}
						onChange={(e) => handleChange('specialty', e.target.value)}
						className="form-select"
					>
						<option value="">Todos</option>
						<option value="admin">Admin</option>
						<option value="medico">Médico</option>
						<option value="recepcionista">Recepcionista</option>
					</select>
				</div>

				<div className="col-12 col-md-6 col-lg-3">
					<label className="form-label">Estado</label>
					<select
						value={filters.status}
						onChange={(e) => handleChange('status', e.target.value)}
						className="form-select"
					>
						<option value="">Todos</option>
						<option value="ativo">Ativo</option>
						<option value="inativo">Inativo</option>
					</select>
				</div>
			</div>
		</div>
	)
}
