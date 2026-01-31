import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function TarefasAlertas({ tasks }) {
	const navigate = useNavigate()

	const getBadgeStyle = (severity) => {
		if (severity === 'danger') {
			return {
				background: 'rgba(229, 62, 62, 0.10)',
				border: '1px solid rgba(229, 62, 62, 0.24)',
				color: '#a61b1b',
			}
		}

		if (severity === 'warning') {
			return {
				background: 'rgba(184, 148, 49, 0.12)',
				border: '1px solid rgba(184, 148, 49, 0.28)',
				color: '#6b4d00',
			}
		}

		return {
			background: 'rgba(66, 153, 225, 0.10)',
			border: '1px solid rgba(66, 153, 225, 0.22)',
			color: '#1f5f9a',
		}
	}

	return (
		<section
			className="bg-white border rounded-3 p-3"
			style={{ borderColor: '#ebe5dd' }}
			aria-label="Tarefas e Alertas"
		>
			<div className="d-flex align-items-center justify-content-between gap-2 mb-3">
				<h3 className="h6 fw-semibold text-dark mb-0">Tarefas / Alertas</h3>
				<button type="button" className="btn btn-light btn-sm" onClick={() => navigate('/pacientes')}>
					Ver pacientes
				</button>
			</div>

			<div className="d-flex flex-column gap-2" role="list">
				{tasks.map((t) => (
					<div
						key={t.id}
						className="d-flex align-items-start justify-content-between gap-3 border rounded-3 p-3"
						style={{ background: '#f3efea', borderColor: '#ebe5dd' }}
						role="listitem"
					>
						<div className="min-w-0">
							<div className="fw-bold" style={{ color: '#2f2f2f', fontSize: 13 }}>{t.titulo}</div>
							<div className="small" style={{ color: '#7a7a7a' }}>{t.detalhe}</div>
						</div>

						<div className="flex-shrink-0">
							<span
								className="badge rounded-pill px-3 py-2"
								style={{ ...getBadgeStyle(t.severidade), fontSize: 12, fontWeight: 700 }}
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
