import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import StatusBadge from './components/Consultas/StatusBadge'
import { apiFetch, getCurrentUser } from './utils/apiClient'
import { downloadClinicalFile, listConsultaFiles, openClinicalFileInNewTab } from './utils/clinicalFilesApi'
import { formatDatePT, formatTimePT } from './utils/dateTime'
import { downloadPresenceDeclarationByConsulta } from './utils/declarationsApi'

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

function buildStartDate(dateOnly, timeValue) {
	if (!dateOnly || !timeValue) return null
	const d = new Date(`${String(dateOnly).slice(0, 10)}T${hhmm(timeValue)}:00`)
	if (Number.isNaN(d.getTime())) return null
	return d
}

export default function PacienteVerConsulta() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const { id } = useParams()

	const [loading, setLoading] = useState(true)
	const [consulta, setConsulta] = useState(null)
	const [error, setError] = useState('')
	const [dependents, setDependents] = useState([])

	const [consultaFiles, setConsultaFiles] = useState([])
	const [filesLoading, setFilesLoading] = useState(false)
	const [filesError, setFilesError] = useState('')

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
	const startDate = useMemo(() => buildStartDate(consulta?.data_consulta, consulta?.hora), [consulta?.data_consulta, consulta?.hora])
	const canDownloadPresenceDeclaration = useMemo(() => {
		if (!startDate) return false
		return Date.now() >= startDate.getTime()
	}, [startDate])

	const [declLoading, setDeclLoading] = useState(false)
	const [declError, setDeclError] = useState('')

	useEffect(() => {
		let mounted = true
		if (!consulta?.id_consulta) return
		setFilesError('')
		setFilesLoading(true)
		;(async () => {
			try {
				const rows = await listConsultaFiles(consulta.id_consulta)
				if (mounted) setConsultaFiles(rows)
			} catch (e) {
				if (mounted) {
					setConsultaFiles([])
					setFilesError(e?.message || 'Erro ao carregar anexos')
				}
			} finally {
				if (mounted) setFilesLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [consulta?.id_consulta])

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
							<section className="ui-card p-3" aria-label="Anexos">
								<div className="fw-bold mb-1">Anexos</div>
								<div className="ui-meta">Ficheiros associados à consulta</div>

								{filesLoading ? <div className="form-text mt-2">A carregar anexos…</div> : null}
								{filesError ? (
									<div className="alert alert-warning mt-2 mb-0" role="alert">
										{filesError}
									</div>
								) : null}

								{!filesLoading && !filesError && consultaFiles.length === 0 ? (
									<div className="form-text mt-2">Sem anexos.</div>
								) : null}

								{consultaFiles.length ? (
									<div className="mt-2 ui-table-wrap">
										<table className="table ui-table" aria-label="Anexos">
											<thead>
												<tr>
													<th>Ficheiro</th>
													<th className="ui-actions-col">Ações</th>
												</tr>
											</thead>
											<tbody>
												{consultaFiles.map((f) => (
													<tr key={f.id_file}>
														<td style={{ fontWeight: 700 }}>{f.file_name}</td>
														<td className="ui-actions-col">
															<button className="btn btn-light btn-sm" type="button" onClick={() => openClinicalFileInNewTab(f.id_file)}>
																Abrir
															</button>
															<button className="btn btn-light btn-sm ms-2" type="button" onClick={() => downloadClinicalFile(f.id_file)}>
																Download
															</button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : null}
							</section>

							<section className="ui-card p-3 mt-3" aria-label="Declaração de presença">
								<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
									<div>
										<div className="fw-bold">Declaração de Presença</div>
										<div className="ui-meta">Disponível após a hora da consulta</div>
									</div>
									<button
										type="button"
										className="btn btn-primary btn-sm"
										disabled={!canDownloadPresenceDeclaration || declLoading}
										onClick={async () => {
											if (!consulta?.id_consulta) return
											setDeclError('')
											setDeclLoading(true)
											try {
												await downloadPresenceDeclarationByConsulta(consulta.id_consulta)
											} catch (e) {
												setDeclError(e?.message || 'Não foi possível descarregar a declaração')
											} finally {
											setDeclLoading(false)
										}
									}}
									>
										<Download size={16} aria-hidden="true" />
										{declLoading ? 'A preparar…' : 'Download'}
									</button>
								</div>

								{declError ? (
									<div className="alert alert-warning mt-2 mb-0" role="alert">
										{declError}
									</div>
								) : null}

								{!canDownloadPresenceDeclaration ? (
									<div className="form-text mt-2">A declaração fica disponível após a consulta.</div>
								) : null}
							</section>
						</div>
					</div>
				) : null}
			</div>
		</PatientAppLayout>
	)
}
