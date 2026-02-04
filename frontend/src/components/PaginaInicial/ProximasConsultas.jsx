import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProximasConsultas({ appointments }) {
	const navigate = useNavigate()

	const getStatusStyle = (status) => {
		if (status === 'Confirmada') {
			return {
				background: 'rgba(33, 150, 83, 0.10)',
				border: '1px solid rgba(33, 150, 83, 0.25)',
				color: '#0f6b2e',
			}
		}

		if (status === 'Em atraso') {
			return {
				background: 'rgba(184, 148, 49, 0.12)',
				border: '1px solid rgba(184, 148, 49, 0.28)',
				color: '#6b4d00',
			}
		}

		return {
			background: 'rgba(30, 42, 53, 0.06)',
			border: '1px solid rgba(30, 42, 53, 0.12)',
			color: '#44515d',
		}
	}

	return (
		<section
			className="bg-white border rounded-3 p-3"
			style={{ borderColor: '#ebe5dd' }}
			aria-label="Próximas Consultas"
		>
			<div className="d-flex align-items-center justify-content-between gap-2 mb-3">
				<h3 className="h6 fw-semibold text-dark mb-0">Próximas Consultas</h3>
				<button type="button" className="btn btn-light btn-sm" onClick={() => navigate('/agenda')}>
					<span className="me-2" aria-hidden="true">🗓</span>
					Ver agenda
				</button>
			</div>

			<div className="d-flex flex-column gap-2" role="list">
				{appointments.slice(0, 6).map((a) => (
					<div
						key={a.id}
						className="d-flex align-items-start justify-content-between gap-3 border rounded-3 p-3"
						style={{ background: '#f3efea', borderColor: '#ebe5dd' }}
						role="listitem"
					>
						<div className="min-w-0">
							<div className="fw-bold" style={{ color: '#2f2f2f', fontSize: 13 }}>{a.utente}</div>
							<div className="small" style={{ color: '#7a7a7a' }}>
								{a.inicio}–{a.fim} • {a.medico} • {a.tipo}
							</div>
						</div>

						<div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
							<span
								className="badge rounded-pill px-3 py-2"
								style={{ ...getStatusStyle(a.estado), fontSize: 12, fontWeight: 700 }}
							>
								{a.estado}
							</span>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
