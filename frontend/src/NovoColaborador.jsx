import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Colaboradores.css'

import ColaboradorForm from './components/Colaboradores/ColaboradorForm'
import { addColaborador } from './utils/colaboradoresStorage'

export default function NovoColaborador() {
	const navigate = useNavigate()

	return (
		<AppLayout
			breadcrumb="Colaboradores > Novo"
			userName="Dra. Sofia Lima"
			actions={
				<button type="button" className="colaboradores-btn" onClick={() => navigate('/colaboradores')}>
					<ArrowLeft className="colaboradores-btn-icon" aria-hidden="true" />
					Voltar
				</button>
			}
		>
			<div className="colaboradores-page">
				<div className="colaborador-detail-header">
					<div>
						<h1 className="colaborador-detail-title">Novo Colaborador</h1>
						<div className="colaborador-detail-sub">Adicione um novo colaborador à clínica</div>
					</div>
				</div>

				<ColaboradorForm
					submitLabel="Criar Colaborador"
					onCancel={() => navigate('/colaboradores')}
					onSubmit={(payload) => {
						const newColaborador = addColaborador(payload)
						navigate(`/colaboradores/${newColaborador.id}`)
					}}
				/>
			</div>
		</AppLayout>
	)
}
