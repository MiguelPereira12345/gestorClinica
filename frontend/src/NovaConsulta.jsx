import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'

import ConsultaForm from './components/Consultas/ConsultaForm'
import { createConsulta } from './utils/consultasStorage'
import { appendTreatmentPlanHistory } from './utils/treatmentPlansStorage'

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
	const location = useLocation()
	const [saving, setSaving] = useState(false)
	const prefill = location.state?.prefill || null
	const fromTreatmentPlanId = location.state?.fromTreatmentPlanId || null
	const returnTo = location.state?.returnTo || null
	const initial = useMemo(() => {
		const base = defaultInitial()
		if (!prefill) return base
		return {
			...base,
			patientId: prefill.patientId || base.patientId,
			patientName: prefill.patientName || base.patientName,
			firstVisitReason: prefill.firstVisitReason || base.firstVisitReason,
		}
	}, [prefill])

	return (
		<AppLayout
			breadcrumb="Consultas > Nova"
			userName="Dra. Sofia Lima"
			actions={
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => {
						if (returnTo?.pathname) {
							navigate(returnTo.pathname, { state: returnTo.state || null })
							return
						}
						navigate('/consultas')
					}}
				>
					<ArrowLeft size={16} aria-hidden="true" />
					Voltar à lista
				</button>
			}
		>
			<div className="container-fluid py-3">
				<div className="row justify-content-center">
					<div className="col-12 col-xl-10 col-xxl-9">
						<div className="mb-3">
							<h1 className="h4 mb-1">Adicionar Consulta</h1>
							<div className="text-muted">Criação rápida conforme Figma e requisitos.</div>
						</div>

						<ConsultaForm
							initial={initial}
							submitLabel="Criar consulta"
							onCancel={() => {
								if (returnTo?.pathname) {
									navigate(returnTo.pathname, { state: returnTo.state || null })
									return
								}
								navigate('/consultas')
							}}
							onSubmit={(payload) => {
								void (async () => {
									if (saving) return
									setSaving(true)
									try {
										const treatmentPlanId = fromTreatmentPlanId ? String(fromTreatmentPlanId) : ''
										const created = await createConsulta({
											...payload,
											treatmentPlanId,
										})
										if (treatmentPlanId) {
											appendTreatmentPlanHistory(treatmentPlanId, {
												type: 'session',
												title: 'Sessão marcada',
												note: `${created.startISO?.slice(0, 16) || ''} • ${created.medicoName || ''}`.trim(),
												meta: { consultaId: created.id, startISO: created.startISO },
											})
										}
										if (returnTo?.pathname) {
											navigate(returnTo.pathname, { state: returnTo.state || null })
											return
										}
										navigate(`/consultas/${created.id}`)
									} catch (e) {
										console.error(e)
										window.alert(e?.message || 'Erro ao criar consulta')
									} finally {
										setSaving(false)
									}
								})()
							}}
						/>
					</div>
				</div>
			</div>
		</AppLayout>
	)
}

