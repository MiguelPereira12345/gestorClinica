import React from 'react'
import { Eye, Edit, Trash2 } from 'lucide-react'
import StatusBadge from '../UI/StatusBadge'

export default function ColaboradoresTable({ rows, onView, onEdit, onDelete }) {
	return (
		<div className="ui-card p-3">
			<div className="fw-bold">Lista de colaboradores</div>
			<div className="ui-meta">Total: {rows.length} colaboradores</div>

			<div className="ui-table-wrap mt-3">
				<table className="ui-table">
					<thead>
						<tr>
							<th>Nome</th>
							<th>Email</th>
							<th>Telefone</th>
							<th>Cargo</th>
							<th>Estado</th>
							<th className="ui-actions-col">Ações</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan="6" className="ui-meta" style={{ textAlign: 'center', padding: '20px' }}>
									Nenhum colaborador encontrado
								</td>
							</tr>
						) : (
							rows.map(colaborador => (
								<tr key={colaborador.id}>
									<td className="fw-bold">{colaborador.name}</td>
									<td>{colaborador.email}</td>
									<td>{colaborador.phone}</td>
									<td>{colaborador.cargo}</td>
									<td>
										<StatusBadge status={colaborador.status} />
									</td>
									<td className="ui-actions-col">
										<div className="ui-actions">
											<button
												type="button"
												className="btn btn-light btn-sm"
												onClick={() => onView(colaborador)}
												title="Ver detalhes"
											>
												<Eye size={14} aria-hidden="true" />
												Ver
											</button>
											{onEdit ? (
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => onEdit(colaborador)}
													title="Editar"
												>
													<Edit size={14} aria-hidden="true" />
													Editar
												</button>
											) : null}
											{onDelete ? (
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => onDelete?.(colaborador)}
													title="Eliminar"
												>
													<Trash2 size={14} aria-hidden="true" />
													Eliminar
												</button>
											) : null}
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
