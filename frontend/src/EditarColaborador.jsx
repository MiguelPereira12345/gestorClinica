import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Colaboradores.css'

import ColaboradorForm from './components/Colaboradores/ColaboradorForm'
import { getColaboradorById, patchColaborador } from './utils/colaboradoresStorage'

export default function EditarColaborador() {
	const navigate = useNavigate()
	const { id } = useParams()

	const colaborador = useMemo(() => getColaboradorById(id), [id])

	if (!colaborador) {
		return (
			<AppLayout breadcrumb="Colaboradores > Editar" userName="Dra. Sofia Lima">
				<div className="colaboradores-page">
					<div className="colaborador-card">
						<div className="colaborador-card-title">Colaborador não encontrado</div>
						<div className="colaborador-card-footer">
							<button type="button" className="colaboradores-btn" onClick={() => navigate('/colaboradores')}>
								<ArrowLeft className="colaboradores-btn-icon" aria-hidden="true" />
								Voltar
							</button>
						</div>
					</div>
				</div>
			</AppLayout>
		)
	}

	return (
		<AppLayout
			breadcrumb="Colaboradores > Editar"
			userName="Dra. Sofia Lima"
			actions={
				<button type="button" className="colaboradores-btn" onClick={() => navigate(`/colaboradores/${colaborador.id}`)}>
					<ArrowLeft className="colaboradores-btn-icon" aria-hidden="true" />
					Voltar ao detalhe
				</button>
			}
		>
			<div className="colaboradores-page">
				<div className="colaborador-detail-header">
					<div>
						<h1 className="colaborador-detail-title">Editar Colaborador</h1>
						<div className="colaborador-detail-sub">{colaborador.name} • {colaborador.id}</div>
					</div>
				</div>

				<ColaboradorForm
					initial={colaborador}
					submitLabel="Guardar alterações"
					onCancel={() => navigate(`/colaboradores/${colaborador.id}`)}
					onSubmit={(payload) => {
						patchColaborador(colaborador.id, payload)
						navigate(`/colaboradores/${colaborador.id}`)
					}}
				/>
			</div>
		</AppLayout>
	)
}
