import React from 'react'
import { Search } from 'lucide-react'
import { TIPO_MARCACAO } from '../../utils/consultasStorage'
import Button from '../UI/Button'

export default function ConsultasFilters({
	filters,
	onChange,
	professionals,
	onClear,
	onSaveView,
}) {
	return (
		<section className="consultas-filters-card" aria-label="Filtros">
			<div className="consultas-filters-head">
				<div>
					<div className="consultas-filters-title">Filtros</div>
					<div className="consultas-filters-subtitle">Refine por paciente, profissional, data, estado e tipo.</div>
				</div>
				<div className="consultas-filters-actions">
					<Button variant="secondary" className="consultas-btn-light" onClick={onSaveView}>
						Guardar vista
					</Button>
					<Button variant="secondary" className="consultas-btn-light" onClick={onClear}>
						Limpar
					</Button>
				</div>
			</div>

			<div className="consultas-filters-grid">
				<div className="consultas-field">
					<label className="consultas-label">Paciente</label>
					<div className="consultas-input-wrap">
						<Search className="consultas-input-icon" aria-hidden="true" />
						<input
							type="text"
							className="consultas-input"
							placeholder="Nome do paciente"
							value={filters.patient}
							onChange={(e) => onChange({ ...filters, patient: e.target.value })}
						/>
					</div>
				</div>

				<div className="consultas-field">
					<label className="consultas-label">Profissional</label>
					<select
						className="consultas-select"
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

				<div className="consultas-field">
					<label className="consultas-label">Data</label>
					<input
						type="date"
						className="consultas-input consultas-input-date"
						value={filters.date}
						onChange={(e) => onChange({ ...filters, date: e.target.value })}
					/>
				</div>

				<div className="consultas-field">
					<label className="consultas-label">Estado</label>
					<select
						className="consultas-select"
						value={filters.status}
						onChange={(e) => onChange({ ...filters, status: e.target.value })}
					>
						<option value="">Todos</option>
						<option value="true">Confirmado</option>
						<option value="false">Pendente</option>
						<option value="cancelada">Cancelado</option>
					</select>
				</div>

				<div className="consultas-field">
					<label className="consultas-label">Tipo de marcação</label>
					<select
						className="consultas-select"
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
