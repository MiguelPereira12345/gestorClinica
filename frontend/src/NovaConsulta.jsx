import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Consultas.css'

import ConsultaForm from './components/Consultas/ConsultaForm'
import { createConsulta } from './utils/consultasStorage'

function defaultInitial() {
	const now = new Date()
	// arredondar para o próximo 15min
	const mins = now.getMinutes()
	const rounded = new Date(now)
	rounded.setMinutes(Math.ceil(mins / 15) * 15, 0, 0)
	return {
		patientId: '',
		patientName: '',
		medicoId: '',
		medicoName: '',
		specialty: 'Clínica Geral',
		startISO: rounded.toISOString(),
		durationMin: 30,
		bookingType: 'vaga',
		bookingStatus: 'a_confirmar',
		firstVisitReason: '',
		notes: '',
	}
}

export default function NovaConsulta() {
	const navigate = useNavigate()
	const initial = useMemo(() => defaultInitial(), [])

	return (
		<AppLayout
			breadcrumb="Consultas > Nova"
			userName="Dra. Sofia Lima"
			actions={
				<button type="button" className="consultas-btn" onClick={() => navigate('/consultas')}>
					<ArrowLeft className="consultas-btn-icon" aria-hidden="true" />
					Voltar à lista
				</button>
			}
		>
			<div className="consultas-page">
				<div className="consulta-detail-header">
					<div>
						<h1 className="consulta-detail-title">Adicionar Consulta</h1>
						<div className="consulta-detail-sub">Criação rápida conforme Figma e requisitos.</div>
					</div>
				</div>

				<ConsultaForm
					initial={initial}
					submitLabel="Criar consulta"
					onCancel={() => navigate('/consultas')}
					onSubmit={(payload) => {
						const created = createConsulta(payload)
						navigate(`/consultas/${created.id}`)
					}}
				/>
			</div>
		</AppLayout>
	)
}
