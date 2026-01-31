import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Clock, Eye, Pencil, X } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDatePT, formatTimePT } from '../../utils/dateTime'

export default function ConsultasTable({ rows, onView, onEdit, onSetStatus }) {
	const [openId, setOpenId] = useState(null)
	const [menuAnchorRect, setMenuAnchorRect] = useState(null)

	function closeMenu() {
		setOpenId(null)
		setMenuAnchorRect(null)
	}

	useEffect(() => {
		function onDocMouseDown(e) {
			const isInsideTrigger = e.target?.closest?.('.consultas-actions-dropdown')
			const isInsideMenu = e.target?.closest?.('.consultas-actions-menu')
			if (!isInsideTrigger && !isInsideMenu) closeMenu()
		}

		function onDocKeyDown(e) {
			if (e.key === 'Escape') closeMenu()
		}

		function onAnyScroll() {
			// Keep it simple: if the user scrolls, close to avoid mis-position.
			if (openId) closeMenu()
		}

		document.addEventListener('mousedown', onDocMouseDown)
		document.addEventListener('keydown', onDocKeyDown)
		window.addEventListener('scroll', onAnyScroll, true)
		return () => {
			document.removeEventListener('mousedown', onDocMouseDown)
			document.removeEventListener('keydown', onDocKeyDown)
			window.removeEventListener('scroll', onAnyScroll, true)
		}
	}, [openId])

	const MENU_WIDTH = 190
	function getMenuStyle(rect) {
		if (!rect) return null
		const left = Math.min(
			Math.max(8, rect.right - MENU_WIDTH),
			window.innerWidth - 8 - MENU_WIDTH,
		)
		const top = Math.min(rect.bottom + 6, window.innerHeight - 8)
		return { position: 'fixed', top, left, width: MENU_WIDTH, zIndex: 2000 }
	}

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
													onClick={(e) => {
														const nextId = openId === c.id ? null : c.id
														if (!nextId) {
															closeMenu()
															return
														}
														setOpenId(nextId)
														setMenuAnchorRect(e.currentTarget.getBoundingClientRect())
													}}
												>
													Estado
													<ChevronDown size={14} aria-hidden="true" />
												</button>

												{openId === c.id && menuAnchorRect
													? createPortal(
														<div
															className="dropdown-menu show consultas-actions-menu"
															role="menu"
															style={getMenuStyle(menuAnchorRect)}
														>
															<button
																type="button"
																className="dropdown-item"
																role="menuitem"
																onClick={() => {
																	closeMenu()
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
																	closeMenu()
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
																	closeMenu()
																	onSetStatus?.(c, 'cancelada')
															}}
															>
																<X size={14} aria-hidden="true" />
																Cancelar
															</button>
														</div>,
														document.body,
													)
													: null}
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

