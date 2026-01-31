import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Atalhos() {
	const navigate = useNavigate()

	return (
		<section className="dashboard-card" aria-label="Atalhos">
			<div className="dashboard-card-header">
				<h3 className="dashboard-card-title">Atalhos</h3>
			</div>
			<div className="dashboard-shortcuts">
				<button type="button" className="dashboard-shortcut" onClick={() => navigate('/agenda')}>
					Novo agendamento
				</button>
				<button type="button" className="dashboard-shortcut" onClick={() => navigate('/registar')}>
					Novo paciente
				</button>
				<button type="button" className="dashboard-shortcut" onClick={() => navigate('/pacientes')}>
					Pesquisar pacientes
				</button>
				<button type="button" className="dashboard-shortcut" onClick={() => navigate('/editar-detalhes')}>
					Abrir ficha
				</button>
			</div>
		</section>
	)
}
