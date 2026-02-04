import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import StatusBadge from './components/Consultas/StatusBadge'
import { apiFetch, getCurrentUser } from './utils/apiClient'
import { formatDatePT, formatTimePT } from './utils/dateTime'

function mapStatusFromApi(status) {
	const s = String(status || '').trim().toLowerCase()
	if (!s) return 'a_confirmar'
	if (s === 'pendente') return 'a_confirmar'
	if (s === 'confirmada') return 'confirmada'
	if (s === 'cancelada') return 'cancelada'
	if (s === 'remarcada') return 'remarcada'
	if (s === 'falta') return 'falta'
	return 'a_confirmar'
}

function hhmm(value) {
	if (!value) return ''
	return String(value).slice(0, 5)
}

function buildStartISO(dateOnly, timeValue) {
	if (!dateOnly || !timeValue) return null
	const d = new Date(`${String(dateOnly).slice(0, 10)}T${hhmm(timeValue)}:00`)
	if (Number.isNaN(d.getTime())) return null
	return d.toISOString()
}

export default function PacienteVerConsulta() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const { id } = useParams()

	const [loading, setLoading] = useState(true)
	const [consulta, setConsulta] = useState(null)
	const [error, setError] = useState('')
	const [dependents, setDependents] = useState([])


	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id || !id) return
			setLoading(true)
			setError('')
			try {
				const res = await apiFetch(`/patients/${user.id}/consultas/${encodeURIComponent(String(id))}`)
				if (mounted) setConsulta(res?.consulta || null)
			} catch (e) {
				if (mounted) setError(e?.message || 'Erro ao carregar consulta')
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id, id])

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id) return
			try {
				const res = await apiFetch(`/patients/${user.id}/dependents`)
				const rows = Array.isArray(res?.dependentes) ? res.dependentes : Array.isArray(res?.dependents) ? res.dependents : []
				if (mounted) setDependents(rows)
			} catch {
				if (mounted) setDependents([])
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id])

	const dependentNameById = useMemo(() => {
		const map = new Map()
		for (const d of dependents || []) {
			if (d?.id_dependente == null) continue
			map.set(String(d.id_dependente), d?.nome || null)
		}
		return map
	}, [dependents])

	const paraNome = useMemo(() => {
		if (consulta?.dependente_nome) return consulta.dependente_nome
		const depId = consulta?.id_dependente != null ? String(consulta.id_dependente) : ''
		if (depId) return dependentNameById.get(depId) || `Dependente #${depId}`
		return user?.nome || '—'
	}, [consulta?.dependente_nome, consulta?.id_dependente, dependentNameById, user?.nome])

	const startISO = useMemo(() => buildStartISO(consulta?.data_consulta, consulta?.hora), [consulta?.data_consulta, consulta?.hora])


	return (
		<PatientAppLayout breadcrumb="Portal / Consultas / Detalhes">
			<div className="ui-page">
				<div className="ui-page-header">
					<div>
						<h1 className="ui-page-title">Detalhes da consulta</h1>
						<div className="ui-page-subtitle">
							{startISO ? `${formatDatePT(startISO)} às ${formatTimePT(startISO)}` : '—'}
							{consulta?.medico_nome ? ` • ${consulta.medico_nome}` : ''}
						</div>
					</div>
					<div className="app-topbar-actions">
						<button type="button" className="btn btn-secondary" onClick={() => navigate('/portal/consultas')}>
							<ArrowLeft size={16} aria-hidden="true" />
							Voltar
						</button>
					</div>
				</div>

				{error ? <div className="alert alert-danger">{error}</div> : null}
				{loading ? <div className="form-text">A carregar…</div> : null}
				{!loading && !consulta ? <div className="form-text">Consulta não encontrada.</div> : null}

				{consulta ? (
					<div className="row g-3">
						<div className="col-12 col-lg-7">
							<section className="ui-card p-3" aria-label="Detalhes">
								<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
									<div>
										<div className="fw-bold">Detalhes</div>
										<div className="ui-meta">Informação principal</div>
									</div>
									<StatusBadge status={mapStatusFromApi(consulta.status)} />
								</div>

								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Para</div></div>
									<div className="col"><div className="fw-semibold">{paraNome}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Médico</div></div>
									<div className="col"><div className="fw-semibold">{consulta.medico_nome || '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Data</div></div>
									<div className="col"><div className="fw-semibold">{String(consulta.data_consulta || '').slice(0, 10) || '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Hora</div></div>
									<div className="col"><div className="fw-semibold">{hhmm(consulta.hora) || '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Duração</div></div>
									<div className="col"><div className="fw-semibold">{consulta.duracao ? `${consulta.duracao} min` : '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Tipo</div></div>
									<div className="col"><div className="fw-semibold">{consulta.tipo_de_marcacao || '—'}</div></div>
								</div>
								<div className="row g-2 align-items-baseline py-2 border-top">
									<div className="col-5 col-md-4"><div className="ui-meta">Motivo</div></div>
									<div className="col"><div className="fw-semibold">{consulta.razao_consulta || '—'}</div></div>
								</div>
							</section>
						</div>

						<div className="col-12 col-lg-5">
						</div>
					</div>
				) : null}
			</div>
		</PatientAppLayout>
	)
}
