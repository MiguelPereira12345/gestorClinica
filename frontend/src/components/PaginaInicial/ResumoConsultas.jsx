import React from 'react'

export default function ResumoConsultas({ summary }) {
	return (
		<section className="dashboard-card" aria-label="Resumo de Consultas de Hoje">
			<div className="dashboard-card-header">
				<h3 className="dashboard-card-title">Resumo de Consultas de Hoje</h3>
			</div>
			<div className="dashboard-stats">
				<div className="dashboard-stat">
					<div className="dashboard-stat-label">Agendadas</div>
					<div className="dashboard-stat-value">{summary.total}</div>
				</div>
				<div className="dashboard-stat">
					<div className="dashboard-stat-label">Em andamento</div>
					<div className="dashboard-stat-value">{summary.confirmed}</div>
				</div>
				<div className="dashboard-stat">
					<div className="dashboard-stat-label">Concluídas</div>
					<div className="dashboard-stat-value">{summary.inProgress}</div>
				</div>
			</div>
		</section>
	)
}
