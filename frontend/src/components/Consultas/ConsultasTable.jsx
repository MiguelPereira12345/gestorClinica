import React, { useEffect, useState } from 'react'
import { Check, ChevronDown, Clock, Eye, Pencil, X } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDatePT, formatTimePT } from '../../utils/dateTime'

export default function ConsultasTable({ rows, onView, onEdit, onSetStatus }) {
	const [openId, setOpenId] = useState(null)

	useEffect(() => {
		function onDocMouseDown(e) {
			const isInside = e.target?.closest?.('.consultas-actions-dropdown')
			if (!isInside) setOpenId(null)
		}

		function onDocKeyDown(e) {
			if (e.key === 'Escape') setOpenId(null)
		}

		document.addEventListener('mousedown', onDocMouseDown)
		document.addEventListener('keydown', onDocKeyDown)
		return () => {
			document.removeEventListener('mousedown', onDocMouseDown)
			document.removeEventListener('keydown', onDocKeyDown)
		}
	}, [])

	return (
		<section className="consultas-table-card ui-card" aria-label="Lista de Consultas">
			<div className="consultas-table-title">Lista de Consultas</div>
			<div className="consultas-table-sub">Resultados ordenados por data e hora</div>

			<div className="consultas-table-wrap ui-table-wrap">
				<table className="consultas-table ui-table">
					<thead>
						<tr>
							<th>Paciente</th>
							<th>Profissional</th>
							<th>Especialidade</th>
							<th>Data &amp; Hora</th>
							<th>Estado</th>
							<th className="consultas-actions-col ui-actions-col">Ações</th>
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
										<button type="button" className="consultas-action-btn" onClick={() => onView?.(c)}>
											<Eye className="consultas-action-icon" aria-hidden="true" />
											Ver
										</button>
										<button type="button" className="consultas-action-btn" onClick={() => onEdit?.(c)}>
											<Pencil className="consultas-action-icon" aria-hidden="true" />
											Editar
										</button>

										<div className="consultas-actions-dropdown">
											<button
												type="button"
												className="consultas-action-btn consultas-dropdown-trigger"
												aria-haspopup="menu"
												aria-expanded={openId === c.id}
												onClick={() => setOpenId((prev) => (prev === c.id ? null : c.id))}
											>
												Estado
												<ChevronDown className="consultas-action-icon" aria-hidden="true" />
											</button>

											{openId === c.id ? (
												<div className="consultas-dropdown-menu" role="menu">
													<button
														type="button"
														className="consultas-dropdown-item"
														role="menuitem"
														onClick={() => {
															setOpenId(null)
															onSetStatus?.(c, 'confirmada')
														}}
													>
														<Check className="consultas-action-icon" aria-hidden="true" />
														Confirmar
													</button>

													<button
														type="button"
														className="consultas-dropdown-item"
														role="menuitem"
														onClick={() => {
															setOpenId(null)
															onSetStatus?.(c, 'a_confirmar')
														}}
													>
														<Clock className="consultas-action-icon" aria-hidden="true" />
														Pendente
													</button>

													<button
														type="button"
														className="consultas-dropdown-item"
														role="menuitem"
														onClick={() => {
															setOpenId(null)
															onSetStatus?.(c, 'cancelada')
														}}
													>
														<X className="consultas-action-icon" aria-hidden="true" />
														Cancelar
													</button>
												</div>
											) : null}
										</div>
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
