import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye } from 'lucide-react'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import StatusBadge from './components/Consultas/StatusBadge'
import PageHeader from './components/UI/PageHeader'
import { getCurrentUser } from './utils/apiClient'
import { getPatientPlan } from './utils/patientPlansApi'

function mapStatusFromApi(status) {
	const s = String(status || '').trim().toLowerCase()
	if (!s) return 'a_confirmar'
	if (s === 'ativo') return 'confirmada'
	if (s === 'concluido' || s === 'concluído') return 'confirmada'
	if (s === 'suspenso') return 'remarcada'
	if (s === 'cancelado' || s === 'cancelada') return 'cancelada'
	return 'a_confirmar'
}

function fmtDate(value) {
	if (!value) return '—'
	const d = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(d.getTime())) return String(value).slice(0, 10) || '—'
	return d.toLocaleDateString('pt-PT')
}

function fmtDateTimeFromApi(dateOnly, timeHHMM) {
	if (!dateOnly || !timeHHMM) return '—'
	const d = new Date(`${String(dateOnly).slice(0, 10)}T${String(timeHHMM).slice(0, 5)}:00`)
	if (Number.isNaN(d.getTime())) return `${String(dateOnly).slice(0, 10)} ${String(timeHHMM).slice(0, 5)}`
	return d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}

export default function PacienteVerPlano() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const { id } = useParams()

	const planId = useMemo(() => Number(String(id || '').trim()), [id])

	const [loading, setLoading] = useState(true)
	const [plano, setPlano] = useState(null)
	const [error, setError] = useState('')

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id || !planId) return
			setLoading(true)
			setError('')
			try {
				const p = await getPatientPlan({ patientId: user.id, planId })
				if (mounted) setPlano(p)
			} catch (e) {
				if (mounted) setError(e?.message || 'Erro ao carregar plano')
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id, planId])

	return (
		<PatientAppLayout breadcrumb="Portal / Tratamentos / Detalhes">
			<div className="ui-page">
				<PageHeader
					title="Detalhes do tratamento"
					subtitle={plano ? `Tratamento #${plano.id_tratamento}` : '—'}
					actions={
						<button type="button" className="btn btn-secondary" onClick={() => navigate('/portal/planos')}>
							<ArrowLeft size={16} aria-hidden="true" />
							Voltar
						</button>
					}
				/>

				{error ? <div className="alert alert-danger">{error}</div> : null}
				{loading ? <div className="form-text">A carregar…</div> : null}
				{!loading && !plano ? <div className="form-text">Plano não encontrado.</div> : null}

				{plano ? (
					<div className="row g-3">
						<div className="col-12 col-lg-7">
							<section className="ui-card p-3" aria-label="Detalhes do plano">
								<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
									<div>
										<div className="fw-bold">Detalhes</div>
										<div className="ui-meta">Informação principal</div>
									</div>
									<StatusBadge status={mapStatusFromApi(plano.status)} />
								</div>

								{plano.dependente_nome || plano.dependent_id ? (
									<div className="row g-2 align-items-baseline py-2 border-top">
										<div className="col-5 col-md-4"><div className="ui-meta">Para</div></div>
										<div className="col"><div className="fw-semibold">{plano.dependente_nome || 'Dependente'}</div></div>
									</div>
								) : (
									<div className="row g-2 align-items-baseline py-2 border-top">
										<div className="col-5 col-md-4"><div className="ui-meta">Para</div></div>
										<div className="col"><div className="fw-semibold">Paciente</div></div>
									</div>
								)}

								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Início</div></div>
									<div className="col"><div className="fw-semibold">{fmtDate(plano.data_inicio)}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Fim</div></div>
									<div className="col"><div className="fw-semibold">{fmtDate(plano.data_fim)}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Estado</div></div>
									<div className="col"><div className="fw-semibold">{plano.status || '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Descrição</div></div>
									<div className="col"><div className="fw-semibold" style={{ whiteSpace: 'pre-wrap' }}>{plano.descricao || '—'}</div></div>
								</div>
							</section>
						</div>

						<div className="col-12 col-lg-5">
							<section className="ui-card p-3" aria-label="Consultas associadas ao tratamento">
								<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
									<div>
										<div className="fw-bold">Consultas associadas</div>
										<div className="ui-meta">Consultas ligadas a este tratamento</div>
									</div>
								</div>

								{Array.isArray(plano.consultas) && plano.consultas.length > 0 ? (
									<div className="mt-2 d-grid gap-2" aria-label="Lista de consultas associadas">
										{plano.consultas.map((c) => (
											<div key={c.id_consulta} className="p-2 border rounded-3">
												<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
													<div style={{ minWidth: 180 }}>
														<div style={{ fontWeight: 600 }}>{fmtDateTimeFromApi(c.data_consulta, c.hora)}</div>
														<div className="ui-meta" style={{ marginTop: 2 }}>{c.medico_nome || '—'}</div>
													</div>
													<div className="d-flex align-items-center gap-2">
														<StatusBadge status={mapStatusFromApi(c.status)} />
														<button
															type="button"
															className="btn btn-light btn-sm"
															onClick={() => navigate(`/portal/consultas/${encodeURIComponent(String(c.id_consulta))}`)}
														>
															<Eye size={14} aria-hidden="true" />
															Ver
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
							) : (
								<div className="form-text">Sem consultas associadas a este tratamento.</div>
							)}
						</section>
						</div>
					</div>
				) : null}
			</div>
		</PatientAppLayout>
	)
}
