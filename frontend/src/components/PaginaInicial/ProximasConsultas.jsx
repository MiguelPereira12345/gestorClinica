import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProximasConsultas({ appointments, onSetStatus }) {
	const navigate = useNavigate()

	return (
		<section className="dashboard-card" aria-label="Próximas Consultas">
			<div className="dashboard-card-header dashboard-card-header-row">
				<h3 className="dashboard-card-title">Próximas Consultas</h3>
				<button
					type="button"
					className="dashboard-btn dashboard-btn-light"
					onClick={() => navigate('/agenda')}
				>
					<span className="dashboard-btn-icon" aria-hidden="true">🗓</span>
					Ver agenda
				</button>
			</div>

			<div className="dashboard-list" role="list">
				{appointments.slice(0, 6).map((a) => (
					<div key={a.id} className="dashboard-list-item" role="listitem">
						<div className="dashboard-list-left">
							<div className="dashboard-list-title">{a.paciente}</div>
							<div className="dashboard-list-sub">
								{a.inicio}–{a.fim} • {a.medico} • {a.tipo}
							</div>
						</div>

						<div className="dashboard-list-right">
							<span
								className={`dashboard-badge${
									a.estado === 'Confirmada'
										? ' is-ok'
										: a.estado === 'Em atraso'
											? ' is-warn'
											: ' is-muted'
								}`}
							>
								{a.estado}
							</span>

							<div className="dashboard-item-actions">
								<button
									className="dashboard-action-btn"
									type="button"
									onClick={() => onSetStatus(a.id, 'Confirmada')}
								>
									Confirmar
								</button>
								<button
									className="dashboard-action-btn"
									type="button"
									onClick={() => navigate('/agenda')}
								>
									Reagendar
								</button>
								<button
									className="dashboard-action-btn"
									type="button"
									onClick={() => navigate('/editar-detalhes')}
								>
									Abrir ficha
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
