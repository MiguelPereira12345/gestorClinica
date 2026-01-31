import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function TarefasAlertas({ tasks }) {
	const navigate = useNavigate()

	return (
		<section className="dashboard-card" aria-label="Tarefas e Alertas">
			<div className="dashboard-card-header dashboard-card-header-row">
				<h3 className="dashboard-card-title">Tarefas / Alertas</h3>
				<button
					type="button"
					className="dashboard-btn dashboard-btn-ghost"
					onClick={() => navigate('/pacientes')}
				>
					Ver pacientes
				</button>
			</div>

			<div className="dashboard-list" role="list">
				{tasks.map((t) => (
					<div key={t.id} className="dashboard-list-item" role="listitem">
						<div className="dashboard-list-left">
							<div className="dashboard-list-title">{t.titulo}</div>
							<div className="dashboard-list-sub">{t.detalhe}</div>
						</div>

						<div className="dashboard-list-right">
							<span
								className={`dashboard-badge${
									t.severidade === 'danger'
										? ' is-danger'
										: t.severidade === 'warning'
											? ' is-warn'
											: ' is-info'
								}`}
							>
								{t.tipo === 'alert' ? 'Alerta' : 'Tarefa'}
							</span>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
