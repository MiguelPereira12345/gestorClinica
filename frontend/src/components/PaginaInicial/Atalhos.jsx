import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Atalhos() {
	const navigate = useNavigate()

	return (
		<section
			className="bg-white border rounded-3 p-3"
			style={{ borderColor: '#ebe5dd' }}
			aria-label="Atalhos"
		>
			<div className="d-flex align-items-center justify-content-between mb-3">
				<h3 className="h6 fw-semibold text-dark mb-0">Atalhos</h3>
			</div>
			<div className="row g-2">
				<div className="col-12 col-md-6">
					<button
						type="button"
						className="btn btn-light w-100 text-start"
						style={{ background: '#f7f6f4', borderColor: '#d8d5d1', color: '#2f2f2f' }}
						onClick={() => navigate('/agenda')}
					>
						Novo agendamento
					</button>
				</div>
				<div className="col-12 col-md-6">
					<button
						type="button"
						className="btn btn-light w-100 text-start"
						style={{ background: '#f7f6f4', borderColor: '#d8d5d1', color: '#2f2f2f' }}
						onClick={() => navigate('/pacientes/novo')}
					>
						Novo paciente
					</button>
				</div>
				<div className="col-12 col-md-6">
					<button
						type="button"
						className="btn btn-light w-100 text-start"
						style={{ background: '#f7f6f4', borderColor: '#d8d5d1', color: '#2f2f2f' }}
						onClick={() => navigate('/pacientes')}
					>
						Pesquisar pacientes
					</button>
				</div>
				<div className="col-12 col-md-6">
					<button
						type="button"
						className="btn btn-light w-100 text-start"
						style={{ background: '#f7f6f4', borderColor: '#d8d5d1', color: '#2f2f2f' }}
						onClick={() => navigate('/notificacoes')}
					>
						Notificações
					</button>
				</div>
			</div>
		</section>
	)
}
