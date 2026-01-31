import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'

import ColaboradorForm from './components/Colaboradores/ColaboradorForm'
import { getColaboradorById, patchColaborador } from './utils/colaboradoresStorage'

export default function EditarColaborador() {
	const navigate = useNavigate()
	const { id } = useParams()

	const colaborador = useMemo(() => getColaboradorById(id), [id])

	if (!colaborador) {
		return (
			<AppLayout breadcrumb="Colaboradores > Editar" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<div className="fw-bold">Colaborador não encontrado</div>
						<div className="mt-3">
							<button type="button" className="btn btn-secondary" onClick={() => navigate('/colaboradores')}>
								<ArrowLeft size={16} aria-hidden="true" />
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
				<button type="button" className="btn btn-secondary" onClick={() => navigate(`/colaboradores/${colaborador.id}`)}>
					<ArrowLeft size={16} aria-hidden="true" />
					Voltar ao detalhe
				</button>
			}
		>
			<div className="ui-page">
				<PageHeader title="Editar colaborador" subtitle={`${colaborador.name} • ${colaborador.id}`} />

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
