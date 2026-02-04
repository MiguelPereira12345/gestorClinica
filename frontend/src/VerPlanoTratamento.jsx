import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Pencil, Trash2 } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import Button from './components/UI/Button'
import StatusBadge from './components/Consultas/StatusBadge'
import { useConfirm } from './components/UI/ConfirmProvider'
import { loadPatients } from './utils/patientStorage'
import { getStoredConsultas, statusLabel } from './utils/consultasStorage'
import { parseISOToDate } from './utils/dateTime'
import { syncTreatmentPlansFromApi } from './utils/dataSync'
import {
	appendTreatmentPlanHistory,
	deleteTreatmentPlanApi,
	getTreatmentPlanById,
	planoStatusLabel,
} from './utils/treatmentPlansStorage'

function fmtDate(value) {
	if (!value) return '—'
	const d = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(d.getTime())) return String(value).slice(0, 10) || '—'
	return d.toLocaleDateString('pt-PT')
}

function mapStaffStatusToBadge(status) {
	const s = String(status || '').trim().toLowerCase()
	if (!s) return 'a_confirmar'
	if (s === 'ativo') return 'confirmada'
	if (s === 'pausado') return 'remarcada'
	if (s === 'concluido' || s === 'concluído') return 'confirmada'
	if (s === 'cancelado' || s === 'cancelada') return 'cancelada'
	return 'a_confirmar'
}


export default function VerPlanoTratamento() {
	const navigate = useNavigate()
	const confirm = useConfirm()
	const { id: patientIdParam, planId } = useParams()

	const patientId = useMemo(() => String(patientIdParam || '').trim(), [patientIdParam])
	const planIdStr = useMemo(() => String(planId || '').trim(), [planId])

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [version, setVersion] = useState(0)
	const [noteText, setNoteText] = useState('')

	const patient = useMemo(() => {
		const all = loadPatients() || []
		return all.find((p) => String(p?.id) === patientId) || null
	}, [patientId])

	const plan = useMemo(() => {
		if (!planIdStr) return null
		return getTreatmentPlanById(planIdStr)
	}, [planIdStr, version])

	useEffect(() => {
		let mounted = true
		;(async () => {
			setLoading(true)
			setError('')
			try {
				await syncTreatmentPlansFromApi()
			} catch {
				// ignore
			} finally {
				if (mounted) {
					setVersion((v) => v + 1)
					setLoading(false)
				}
			}
		})()
		return () => {
			mounted = false
		}
	}, [planIdStr])

	function formatStart(iso) {
		const d = parseISOToDate(iso)
		if (!d) return '—'
		const date = d.toISOString().slice(0, 10)
		const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
		return `${date} ${time}`
	}

	function consultasForPlan(planIdValue) {
		const all = getStoredConsultas()
		return all
			.filter((c) => String(c?.treatmentPlanId || '') === String(planIdValue))
			.slice()
			.sort((a, b) => String(b?.startISO || '').localeCompare(String(a?.startISO || '')))
	}


	function goBack() {
		navigate(`/pacientes/${encodeURIComponent(String(patientId))}/planos`, {
			state: { patientId, expandPlanId: plan?.id || '' },
		})
	}

	function onEdit() {
		if (!plan?.id) return
		navigate(`/pacientes/${encodeURIComponent(String(patientId))}/planos`, {
			state: { patientId, expandPlanId: plan.id, editPlanId: plan.id },
		})
	}


	function onDelete() {
		if (!plan?.id) return
		void (async () => {
			const ok = await confirm({
				title: 'Remover plano de tratamento',
				message: 'Deseja realmente remover este plano de tratamento?\n\nEsta ação não pode ser desfeita.',
				confirmText: 'Remover',
				confirmVariant: 'danger',
			})
			if (!ok) return
			try {
				await deleteTreatmentPlanApi(plan.id)
				await syncTreatmentPlansFromApi().catch(() => {})
				goBack()
			} catch (e) {
				console.error(e)
				window.alert(e?.message || 'Erro ao apagar o plano')
			}
		})()
	}

	function addNote() {
		const text = String(noteText || '').trim()
		if (!plan?.id) return
		if (!text) return
		appendTreatmentPlanHistory(plan.id, {
			type: 'note',
			title: 'Nota',
			note: text,
		})
		setNoteText('')
		setVersion((v) => v + 1)
	}

	const subtitle = plan ? `Tratamento #${plan.id}` : '—'

	return (
		<AppLayout breadcrumb="Planos de Tratamento" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Detalhes do tratamento"
					subtitle={subtitle}
					actions={
						<div className="d-flex gap-2 flex-wrap">
							<button type="button" className="btn btn-secondary" onClick={goBack}>
								<ArrowLeft size={16} aria-hidden="true" />
								Voltar
							</button>
							<button type="button" className="btn btn-light" onClick={onEdit} disabled={!plan} title="Editar">
								<Pencil size={16} aria-hidden="true" className="me-1" />
								Editar
							</button>
							<button type="button" className="btn btn-light" onClick={onDelete} disabled={!plan} title="Apagar">
								<Trash2 size={16} aria-hidden="true" className="me-1" />
								Eliminar
							</button>
						</div>
					}
				/>

				{error ? <div className="alert alert-danger">{error}</div> : null}
				{loading ? <div className="form-text">A carregar…</div> : null}
				{!loading && !plan ? <div className="form-text">Plano não encontrado.</div> : null}

				{plan ? (
					<div className="row g-3">
						<div className="col-12 col-lg-7">
							<section className="ui-card p-3" aria-label="Detalhes do plano">
								<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
									<div>
										<div className="fw-bold">Detalhes</div>
										<div className="ui-meta">Informação principal</div>
									</div>
									<StatusBadge status={mapStaffStatusToBadge(plan.status)} />
								</div>

								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Paciente</div></div>
									<div className="col"><div className="fw-semibold">{patient?.nome || patient?.data?.nomeCompleto || patientId || '—'}</div></div>
								</div>

								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Início</div></div>
									<div className="col"><div className="fw-semibold">{fmtDate(plan.data_inicio)}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Fim</div></div>
									<div className="col"><div className="fw-semibold">{fmtDate(plan.data_fim)}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Estado</div></div>
									<div className="col"><div className="fw-semibold">{planoStatusLabel(plan.status) || '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Nome</div></div>
									<div className="col"><div className="fw-semibold" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{plan.nome || '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Descrição</div></div>
									<div className="col"><div className="fw-semibold" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{plan.descricao || '—'}</div></div>
								</div>
							</section>
						</div>

						<div className="col-12 col-lg-5">
							<section className="ui-card p-3" aria-label="Consultas associadas ao tratamento">
								<div className="fw-bold">Consultas associadas</div>
								<div className="ui-meta">Consultas ligadas a este tratamento</div>

								{consultasForPlan(plan.id).length ? (
									<div className="mt-2 d-grid gap-2" aria-label="Lista de consultas associadas">
										{consultasForPlan(plan.id).slice(0, 16).map((c) => (
											<div key={c.id} className="p-2 border rounded-3">
												<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
													<div style={{ minWidth: 180 }}>
														<div style={{ fontWeight: 600 }}>{formatStart(c.startISO)}</div>
														<div className="ui-meta" style={{ marginTop: 2 }}>
															{c.medicoName || '—'} • {statusLabel(c.bookingStatus)}
														</div>
													</div>
													<div className="d-flex align-items-center gap-2">
														<StatusBadge status={c.bookingStatus} />
														<button
															type="button"
															className="btn btn-light btn-sm"
															onClick={() => navigate(`/consultas/${encodeURIComponent(String(c.id))}`)}
														>
															Ver
														</button>
													</div>
												</div>
										</div>
									))}
								</div>
							) : (
								<div className="form-text mt-2">Sem consultas associadas a este tratamento.</div>
							)}
						</section>

							<section className="ui-card p-3 mt-3" aria-label="Notas do tratamento">
								<div className="fw-bold">
									<BookOpen size={16} aria-hidden="true" className="me-1" />
									Notas
								</div>
								<div className="ui-meta">Notas e alterações</div>

								<div className="d-flex gap-2 mt-2">
									<input
										type="text"
										className="form-control"
										placeholder="Adicionar nota ao plano..."
										value={noteText}
										onChange={(e) => setNoteText(e.target.value)}
									/>
									<Button variant="primary" onClick={addNote}>
										Guardar
									</Button>
								</div>

								{Array.isArray(plan.history) && plan.history.length ? (
									<ul className="list-unstyled mb-0 mt-3 d-flex flex-column gap-2">
										{plan.history.slice(0, 14).map((h, idx) => (
											<li key={`${h.atISO || 't'}-${idx}`} className="border rounded-2 p-2">
												<div className="d-flex justify-content-between gap-2">
													<div className="fw-semibold" style={{ fontSize: 13 }}>{h.title || 'Atualização'}</div>
													<div className="text-muted small">{formatStart(h.atISO)}</div>
												</div>
												{h.note ? <div className="text-muted small" style={{ whiteSpace: 'pre-wrap' }}>{h.note}</div> : null}
											</li>
										))}
									</ul>
								) : (
									<div className="form-text mt-3">Sem notas.</div>
								)}
							</section>
						</div>
					</div>
				) : null}
			</div>
		</AppLayout>
	)
}
