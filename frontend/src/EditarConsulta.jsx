import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Consultas.css'

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
				<div className="consultas-page">
					<div className="consulta-card">
						<div className="consulta-card-title">Consulta não encontrada</div>
						<div className="consulta-card-footer">
							<button type="button" className="consultas-btn" onClick={() => navigate('/consultas')}>
								<ArrowLeft className="consultas-btn-icon" aria-hidden="true" />
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
				<button type="button" className="consultas-btn" onClick={() => navigate(`/consultas/${consulta.id}`)}>
					<ArrowLeft className="consultas-btn-icon" aria-hidden="true" />
					Voltar ao detalhe
				</button>
			}
		>
			<div className="consultas-page">
				<div className="consulta-detail-header">
					<div>
						<h1 className="consulta-detail-title">Editar Consulta</h1>
						<div className="consulta-detail-sub">{consulta.patientName} • {consulta.id}</div>
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
