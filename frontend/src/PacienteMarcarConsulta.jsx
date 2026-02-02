import React, { useEffect, useMemo, useState } from 'react'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import PageHeader from './components/UI/PageHeader'
import ConsultaForm from './components/Consultas/ConsultaForm'
import { apiFetch, getCurrentUser } from './utils/apiClient'

function pad2(value) {
	return String(value).padStart(2, '0')
}

function dateAndTimeFromISO(iso) {
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return { data_consulta: null, hora: null }
	const data_consulta = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
	const hora = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
	return { data_consulta, hora }
}

export default function PacienteMarcarConsulta() {
	const user = getCurrentUser()
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [okMsg, setOkMsg] = useState('')
	const [dependents, setDependents] = useState([])
	const [dependentsLoading, setDependentsLoading] = useState(false)
	const [selectedDependentId, setSelectedDependentId] = useState('')
	const [planos, setPlanos] = useState([])
	const [planosLoading, setPlanosLoading] = useState(false)
	const [selectedPlanId, setSelectedPlanId] = useState('')

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id) return
			setDependentsLoading(true)
			try {
				const res = await apiFetch(`/patients/${user.id}/dependents`)
				const rows = Array.isArray(res?.dependentes) ? res.dependentes : Array.isArray(res?.dependents) ? res.dependents : []
				if (mounted) setDependents(rows)
			} catch {
				if (mounted) setDependents([])
			} finally {
				if (mounted) setDependentsLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id])

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id) return
			setPlanosLoading(true)
			try {
				const res = await apiFetch(`/patients/${user.id}/planos`)
				const rows = Array.isArray(res?.planos) ? res.planos : []
				if (mounted) setPlanos(rows)
			} catch {
				if (mounted) setPlanos([])
			} finally {
				if (mounted) setPlanosLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id])

	const planosFiltrados = useMemo(() => {
		const depId = selectedDependentId ? Number(selectedDependentId) : null
		return (planos || []).filter((p) => {
			const planDep = p?.dependent_id == null ? null : Number(p.dependent_id)
			if (depId == null) return planDep == null
			return planDep === depId
		})
	}, [planos, selectedDependentId])

	useEffect(() => {
		if (!selectedPlanId) return
		const idNum = Number(selectedPlanId)
		const ok = planosFiltrados.some((p) => Number(p?.id_tratamento) === idNum)
		if (!ok) setSelectedPlanId('')
	}, [planosFiltrados, selectedPlanId])

	const initial = useMemo(() => {
		const now = new Date()
		const mins = now.getMinutes()
		const rounded = new Date(now)
		rounded.setMinutes(Math.ceil(mins / 15) * 15, 0, 0)
		return {
			patientId: user?.id ? String(user.id) : '',
			patientName: user?.nome || '',
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
	}, [user?.id, user?.nome])

	return (
		<PatientAppLayout breadcrumb="Portal / Marcar consulta">
			<div className="ui-page">
				<PageHeader title="Marcar consulta" subtitle="Pedido fica pendente de aprovação" />
				{error ? <div className="alert alert-danger">{error}</div> : null}
				{okMsg ? <div className="alert alert-success">{okMsg}</div> : null}

				<ConsultaForm
					initial={initial}
					submitLabel={saving ? 'A enviar…' : 'Enviar pedido'}
					lockPatient
					hidePatient
					hideDependents
					minHoursAhead={48}
					topContent={
						<div className="row g-2 align-items-end">
							<div className="col-12 col-md-6">
								<label className="form-label">Paciente</label>
								<select
									className="form-select"
									value={selectedDependentId}
									onChange={(e) => setSelectedDependentId(e.target.value)}
									disabled={dependentsLoading}
								>
									<option value="">{user?.nome || 'Paciente'}</option>
									{(dependents || []).map((d) => (
										<option key={d.id_dependente} value={String(d.id_dependente)}>
											{d.nome} (Dependente)
										</option>
									))}
								</select>
								{dependentsLoading ? <div className="form-text">A carregar dependentes…</div> : null}
								{selectedDependentId ? (
									<div className="form-text">O pedido vai ficar associado ao dependente selecionado.</div>
								) : null}
							</div>
							<div className="col-12 col-md-6">
								<label className="form-label">Tratamentos (opcional)</label>
								<select
									className="form-select"
									value={selectedPlanId}
									onChange={(e) => setSelectedPlanId(e.target.value)}
									disabled={planosLoading}
								>
									<option value="">— Sem tratamento —</option>
									{planosFiltrados.map((p) => (
										<option key={p.id_tratamento} value={String(p.id_tratamento)}>
											{p.id_tratamento} — {p.descricao ? String(p.descricao).slice(0, 40) : 'Tratamento'}
										</option>
									))}
								</select>
								{planosLoading ? <div className="form-text">A carregar tratamentos…</div> : null}
								{!planosLoading && planosFiltrados.length === 0 ? (
									<div className="form-text">Sem tratamentos para esta seleção.</div>
								) : null}
							</div>
						</div>
					}
					onCancel={() => {
						// manter na página; não há lista de consultas no portal neste fluxo
					}}
					onSubmit={(payload) => {
						void (async () => {
							if (saving) return
							if (!user?.id) return
							setError('')
							setOkMsg('')
							setSaving(true)
							try {
								const { data_consulta, hora } = dateAndTimeFromISO(payload?.startISO)
								if (!data_consulta || !hora) throw new Error('Data/hora inválida')

								await apiFetch(`/patients/${user.id}/consultas/request`, {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										data_consulta,
										hora,
										razao_consulta: payload?.firstVisitReason || null,
										id_medico: payload?.medicoId || null,
										duracao: payload?.durationMin || null,
										notas_internas: payload?.notes || null,
										id_dependente: selectedDependentId ? Number(selectedDependentId) : null,
										id_tratamento: selectedPlanId ? Number(selectedPlanId) : null,
									}),
								})

								setOkMsg('Pedido enviado. Vai ficar pendente até aprovação.')
							} catch (e2) {
								setError(e2?.message || 'Erro ao enviar pedido')
							} finally {
								setSaving(false)
							}
						})()
					}}
				/>
			</div>
		</PatientAppLayout>
	)
}
