import React from 'react'
import { Eye, Edit } from 'lucide-react'

export default function ColaboradoresTable({ rows, onView, onEdit }) {
	return (
		<div className="colaboradores-table-card">
			<div className="colaboradores-table-title">Lista de Colaboradores</div>
			<div className="colaboradores-table-sub">Total: {rows.length} colaboradores</div>

			<div className="colaboradores-table-wrap">
				<table className="colaboradores-table">
					<thead>
						<tr>
							<th>Nome</th>
							<th>Email</th>
							<th>Telefone</th>
							<th>Cargo</th>
							<th>Status</th>
							<th className="colaboradores-actions-col">Ações</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr className="colaboradores-empty-row">
								<td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
									Nenhum colaborador encontrado
								</td>
							</tr>
						) : (
							rows.map(colaborador => (
								<tr key={colaborador.id}>
									<td className="colaboradores-cell-strong">{colaborador.name}</td>
									<td>{colaborador.email}</td>
									<td>{colaborador.phone}</td>
									<td>{colaborador.cargo}</td>
									<td>
										<span className={`colaborador-badge is-${colaborador.status}`}>
											{colaborador.status === 'ativo' ? '✓ Ativo' : '✗ Inativo'}
										</span>
									</td>
									<td className="colaboradores-actions-col">
										<div className="colaboradores-actions">
											<button
												type="button"
												className="colaboradores-action-btn"
												onClick={() => onView(colaborador)}
												title="Ver detalhes"
											>
												<Eye className="colaboradores-action-icon" aria-hidden="true" />
											</button>
											<button
												type="button"
												className="colaboradores-action-btn"
												onClick={() => onEdit(colaborador)}
												title="Editar"
											>
												<Edit className="colaboradores-action-icon" aria-hidden="true" />
											</button>
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
