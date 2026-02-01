import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'

import ConsultaForm from './components/Consultas/ConsultaForm'
import { appendHistory, ensureConsultaStored, getConsultaById, patchConsulta } from './utils/consultasStorage'

export default function EditarConsulta() {
	const navigate = useNavigate()
	const { id } = useParams()

	useMemo(() => {
		ensureConsultaStored(id)
	}, [id])

	const consulta = useMemo(() => getConsultaById(id), [id])

	if (!consulta) {
		return (
			<AppLayout breadcrumb="Consultas > Editar" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<div className="fw-bold">Consulta não encontrada</div>
						<div className="d-flex justify-content-start mt-3">
							<button type="button" className="btn btn-secondary" onClick={() => navigate('/consultas')}>
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
			breadcrumb="Consultas > Editar"
			userName="Dra. Sofia Lima"
			actions={
					<button type="button" className="btn btn-secondary" onClick={() => navigate(`/consultas/${consulta.id}`)}>
					<ArrowLeft size={16} aria-hidden="true" />
					Voltar ao detalhe
				</button>
			}
		>
			<div className="ui-page">
				<div className="ui-page-header">
					<div>
						<h1 className="ui-page-title">Editar Consulta</h1>
						<div className="ui-page-subtitle">{(consulta.dependentName || consulta.patientName) || 'Consulta'} • {consulta.id}</div>
					</div>
				</div>

				<ConsultaForm
					initial={consulta}
					submitLabel="Guardar alterações"
					onCancel={() => navigate(`/consultas/${consulta.id}`)}
					onSubmit={(payload) => {
						patchConsulta(consulta.id, payload)
						appendHistory(consulta.id, { action: 'Edição', note: 'Consulta atualizada no backoffice.' })
						navigate(`/consultas/${consulta.id}`)
					}}
				/>
			</div>
		</AppLayout>
	)
}

