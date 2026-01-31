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
		<section className="ui-card p-3" aria-label="Lista de Consultas">
			<div className="mb-2">
				<div className="fw-bold">Lista de Consultas</div>
				<div className="ui-meta">Resultados ordenados por data e hora</div>
			</div>

			<div className="ui-table-wrap">
				<table className="table ui-table">
					<thead>
						<tr>
							<th>Paciente</th>
							<th>Profissional</th>
							<th>Especialidade</th>
							<th>Data &amp; Hora</th>
							<th>Estado</th>
							<th className="ui-actions-col">Ações</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan={6}>Sem resultados para os filtros selecionados.</td>
							</tr>
						) : (
							rows.map((c) => (
								<tr key={c.id}>
									<td className="fw-bold">{c.patientName || '—'}</td>
									<td>{c.medicoName || '—'}</td>
									<td>{c.specialty || '—'}</td>
									<td>
										<div className="d-flex flex-column">
											<div className="fw-semibold">{formatDatePT(c.startISO)}</div>
											<small className="text-muted">{formatTimePT(c.startISO)}</small>
										</div>
									</td>
									<td>
										<StatusBadge status={c.bookingStatus} />
									</td>
										<td className="ui-actions">
											<button type="button" className="btn btn-light btn-sm" onClick={() => onView?.(c)}>
												<Eye size={14} aria-hidden="true" />
												Ver
											</button>
											<button type="button" className="btn btn-light btn-sm" onClick={() => onEdit?.(c)}>
												<Pencil size={14} aria-hidden="true" />
												Editar
											</button>

											<div className="consultas-actions-dropdown dropdown">
												<button
													type="button"
													className="btn btn-light btn-sm"
													aria-haspopup="menu"
													aria-expanded={openId === c.id}
													onClick={() => setOpenId((prev) => (prev === c.id ? null : c.id))}
												>
													Estado
													<ChevronDown size={14} aria-hidden="true" />
												</button>

												{openId === c.id ? (
													<div className="dropdown-menu dropdown-menu-end show" role="menu">
														<button
															type="button"
															className="dropdown-item"
															role="menuitem"
															onClick={() => {
																setOpenId(null)
																onSetStatus?.(c, 'confirmada')
														}}
														>
															<Check size={14} aria-hidden="true" />
															Confirmar
														</button>

														<button
															type="button"
															className="dropdown-item"
															role="menuitem"
															onClick={() => {
																setOpenId(null)
																onSetStatus?.(c, 'a_confirmar')
														}}
														>
															<Clock size={14} aria-hidden="true" />
															Pendente
														</button>

														<button
															type="button"
															className="dropdown-item"
															role="menuitem"
															onClick={() => {
																setOpenId(null)
																onSetStatus?.(c, 'cancelada')
														}}
														>
															<X size={14} aria-hidden="true" />
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

