import React from 'react'

export default function ResumoConsultas({ summary }) {
	return (
		<section
			className="bg-white border rounded-3 p-3"
			style={{ borderColor: '#ebe5dd' }}
			aria-label="Resumo de Consultas de Hoje"
		>
			<div className="d-flex align-items-center justify-content-between mb-3">
				<h3 className="h6 fw-semibold text-dark mb-0">Resumo de Consultas de Hoje</h3>
			</div>
			<div className="d-grid gap-2">
				<div className="border rounded-3 p-3" style={{ background: '#f3efea', borderColor: '#ebe5dd' }}>
					<div className="small" style={{ color: '#7a7a7a' }}>Agendadas</div>
					<div className="fs-5 fw-bold" style={{ color: '#2f2f2f' }}>{summary.total}</div>
				</div>
				<div className="border rounded-3 p-3" style={{ background: '#f3efea', borderColor: '#ebe5dd' }}>
					<div className="small" style={{ color: '#7a7a7a' }}>Em andamento</div>
					<div className="fs-5 fw-bold" style={{ color: '#2f2f2f' }}>{summary.confirmed}</div>
				</div>
				<div className="border rounded-3 p-3" style={{ background: '#f3efea', borderColor: '#ebe5dd' }}>
					<div className="small" style={{ color: '#7a7a7a' }}>Concluídas</div>
					<div className="fs-5 fw-bold" style={{ color: '#2f2f2f' }}>{summary.inProgress}</div>
				</div>
			</div>
		</section>
	)
}
