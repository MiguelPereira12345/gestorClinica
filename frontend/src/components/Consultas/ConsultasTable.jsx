import React from 'react'
import { Eye, Pencil } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDatePT, formatTimePT } from '../../utils/dateTime'

export default function ConsultasTable({ rows, onView, onEdit }) {
	return (
		<section className="consultas-table-card" aria-label="Lista de Consultas">
			<div className="consultas-table-title">Lista de Consultas</div>
			<div className="consultas-table-sub">Resultados ordenados por data e hora</div>

			<div className="consultas-table-wrap">
				<table className="consultas-table">
					<thead>
						<tr>
							<th>Paciente</th>
							<th>Profissional</th>
							<th>Especialidade</th>
							<th>Data &amp; Hora</th>
							<th>Estado</th>
							<th className="consultas-actions-col">Ações</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr className="consultas-empty-row">
								<td colSpan={6}>Sem resultados para os filtros selecionados.</td>
							</tr>
						) : (
							rows.map((c) => (
								<tr key={c.id}>
									<td className="consultas-cell-strong">{c.patientName || '—'}</td>
									<td>{c.medicoName || '—'}</td>
									<td>{c.specialty || '—'}</td>
									<td className="consultas-datetime">
										<div className="consultas-dt-date">{formatDatePT(c.startISO)}</div>
										<div className="consultas-dt-time">{formatTimePT(c.startISO)}</div>
									</td>
									<td>
										<StatusBadge status={c.bookingStatus} />
									</td>
									<td className="consultas-actions">
										<button type="button" className="consultas-action-btn" onClick={() => onView(c)}>
											<Eye className="consultas-action-icon" aria-hidden="true" />
											Ver
										</button>
										<button type="button" className="consultas-action-btn" onClick={() => onEdit(c)}>
											<Pencil className="consultas-action-icon" aria-hidden="true" />
											Editar
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</section>
	)
}
