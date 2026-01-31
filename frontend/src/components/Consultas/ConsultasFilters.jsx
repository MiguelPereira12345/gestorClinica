import React from 'react'
import { Search } from 'lucide-react'
import { TIPO_MARCACAO } from '../../utils/consultasStorage'

export default function ConsultasFilters({
	filters,
	onChange,
	professionals,
	onClear,
	onSaveView,
}) {
	return (
		<section className="ui-card p-3" aria-label="Filtros">
			<div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
				<div>
					<div className="fw-bold">Filtros</div>
					<div className="ui-meta">Refine por paciente, profissional, data, estado e tipo.</div>
				</div>
				<div className="d-inline-flex gap-2">
					<button type="button" className="btn btn-light btn-sm" onClick={onSaveView}>
						Guardar vista
					</button>
					<button type="button" className="btn btn-light btn-sm" onClick={onClear}>
						Limpar
					</button>
				</div>
			</div>

			<div className="row row-cols-1 row-cols-md-2 row-cols-lg-5 g-3">
				<div className="col">
					<label className="form-label">Paciente</label>
					<div className="input-group">
						<span className="input-group-text" aria-hidden="true">
							<Search size={16} aria-hidden="true" />
						</span>
						<input
							type="text"
							className="form-control"
							placeholder="Nome do paciente"
							value={filters.patient}
							onChange={(e) => onChange({ ...filters, patient: e.target.value })}
						/>
					</div>
				</div>

				<div className="col">
					<label className="form-label">Profissional</label>
					<select
						className="form-select"
						value={filters.professional}
						onChange={(e) => onChange({ ...filters, professional: e.target.value })}
					>
						<option value="">Selecione</option>
						{professionals.map((p) => (
							<option key={p.id} value={p.name}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				<div className="col">
					<label className="form-label">Data</label>
					<input
						type="date"
						className="form-control"
						value={filters.date}
						onChange={(e) => onChange({ ...filters, date: e.target.value })}
					/>
				</div>

				<div className="col">
					<label className="form-label">Estado</label>
					<select
						className="form-select"
						value={filters.status}
						onChange={(e) => onChange({ ...filters, status: e.target.value })}
					>
						<option value="">Todos</option>
						<option value="true">Confirmado</option>
						<option value="false">Pendente</option>
						<option value="cancelada">Cancelado</option>
					</select>
				</div>

				<div className="col">
					<label className="form-label">Tipo de marcação</label>
					<select
						className="form-select"
						value={filters.bookingType}
						onChange={(e) => onChange({ ...filters, bookingType: e.target.value })}
					>
						<option value="">Todos</option>
						{TIPO_MARCACAO.map((t) => (
							<option key={t.id} value={t.id}>
								{t.label}
							</option>
						))}
					</select>
				</div>
			</div>
		</section>
	)
}

