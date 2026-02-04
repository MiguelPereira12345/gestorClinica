import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import UtenteActionButtons from './components/Utentes/UtenteActionButtons'

import StatusBadge from './components/Consultas/StatusBadge'

import { ensureConsultaStored, getConsultaById, patchConsulta } from './utils/consultasStorage'
import { formatDatePT, formatTimePT } from './utils/dateTime'
import { syncConsultasFromApi } from './utils/dataSync'

function formatMoneyEUR(amount) {
	const n = Number(amount)
	if (Number.isNaN(n)) return '—'
	return n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

export default function VerConsultaPage() {
	const navigate = useNavigate()
	const { id } = useParams()
	const [rev, setRev] = useState(0)

	useMemo(() => {
		ensureConsultaStored(id)
	}, [id])

	const consulta = useMemo(() => getConsultaById(id), [id, rev])

	useEffect(() => {
		let mounted = true
		if (!id) return
		if (consulta) return
		void (async () => {
			try {
				await syncConsultasFromApi()
			} catch {
				// ignore
			} finally {
				if (mounted) setRev((v) => v + 1)
			}
		})()
		return () => {
			mounted = false
		}
	}, [consulta, id])

	if (!consulta) {
		return (
			<AppLayout breadcrumb="Consultas > Detalhes" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<div className="fw-bold">Consulta não encontrada</div>
						<div className="ui-meta mt-1">Verifica o link ou volta à lista.</div>
						<div className="d-flex justify-content-start mt-3">
							<button type="button" className="btn btn-secondary" onClick={() => navigate('/consultas')}>
								<ArrowLeft size={16} aria-hidden="true" />
								Voltar à lista
							</button>
						</div>
					</div>
				</div>
			</AppLayout>
		)
	}

	const subtitle = `${formatDatePT(consulta.startISO)} às ${formatTimePT(consulta.startISO)} • ${consulta.specialty || '—'} • ${consulta.medicoName || '—'}`
	const billing = consulta.billing || null

	return (
		<AppLayout
			breadcrumb="Consultas > Detalhes"
			userName="Dra. Sofia Lima"
			actions={
				<>
					<button type="button" className="btn btn-secondary" onClick={() => navigate('/consultas')}>
						<ArrowLeft size={16} aria-hidden="true" />
						Voltar à lista
					</button>
					<button type="button" className="btn btn-primary app-action-primary" onClick={() => navigate(`/consultas/${consulta.id}/editar`)}>
						Editar Consulta
					</button>
				</>
			}
		>
			<div className="ui-page">
				<div className="ui-page-header">
					<div>
						<h1 className="ui-page-title">{(consulta.dependentName || consulta.patientName) || 'Consulta'}</h1>
						<div className="ui-page-subtitle">{subtitle}</div>
					</div>
				</div>

				<div className="row g-3">
					<div className="col-12 col-lg-7">
						<section className="ui-card p-3" aria-label="Detalhes da Consulta">
							<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
								<div>
									<div className="fw-bold">Detalhes da Consulta</div>
									<div className="ui-meta">Informação principal e estado</div>
								</div>
								<StatusBadge status={consulta.bookingStatus} />
							</div>

							<div className="row g-2 align-items-baseline py-2 border-top">
											<div className="col-5 col-md-4"><div className="ui-meta">Utente</div></div>
								<div className="col">
									<div className="fw-semibold">{consulta.dependentName || consulta.patientName || '—'}</div>
									{consulta.dependentName && consulta.patientName ? (
										<div className="text-muted small">Responsável: {consulta.patientName}</div>
									) : null}
								</div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Profissional</div></div>
								<div className="col"><div className="fw-semibold">{consulta.medicoName || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Especialidade</div></div>
								<div className="col"><div className="fw-semibold">{consulta.specialty || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Data</div></div>
								<div className="col"><div className="fw-semibold">{formatDatePT(consulta.startISO) || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Hora</div></div>
								<div className="col"><div className="fw-semibold">{formatTimePT(consulta.startISO) || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Duração</div></div>
								<div className="col"><div className="fw-semibold">{consulta.durationMin ? `${consulta.durationMin} min` : '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Tipo</div></div>
								<div className="col"><div className="fw-semibold">{consulta.bookingType || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Motivo</div></div>
								<div className="col"><div className="fw-semibold">{consulta.firstVisitReason || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Notas internas</div></div>
								<div className="col"><div className="fw-semibold">{consulta.notes || '—'}</div></div>
							</div>
						</section>
					</div>

					<div className="col-12 col-lg-5">
						<section className="ui-card p-3" aria-label="Atalhos e anexos">
							<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
								<div>
										<div className="fw-bold">Atalhos</div>
										<div className="ui-meta">Ações rápidas</div>
								</div>
							</div>
							<div className="pt-2 border-top">
								<UtenteActionButtons
									patient={{ id: consulta.patientId || '' }}
									ensurePatientExists={() => Boolean(consulta.patientId)}
									showDependent={false}
								/>
							</div>

						</section>
					</div>
				</div>

			</div>
		</AppLayout>
	)
}

