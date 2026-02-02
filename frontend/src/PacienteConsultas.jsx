import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import PageHeader from './components/UI/PageHeader'
import StatusBadge from './components/Consultas/StatusBadge'
import { apiFetch, getCurrentUser } from './utils/apiClient'

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

export default function PacienteConsultas() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const [loading, setLoading] = useState(true)
	const [consultas, setConsultas] = useState([])
	const [dependents, setDependents] = useState([])
	const [error, setError] = useState('')
	const [tab, setTab] = useState('proximas') // proximas | historico | canceladas

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id) return
			setLoading(true)
			setError('')
			try {
				const res = await apiFetch(`/patients/${user.id}/consultas`)
				const rows = Array.isArray(res?.consultas) ? res.consultas : []
				if (mounted) setConsultas(rows)
			} catch (e) {
				if (mounted) setError(e?.message || 'Erro ao carregar consultas')
			} finally {
				if (mounted) setLoading(false)
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

	const { proximas, historico, canceladas } = useMemo(() => {
		const now = Date.now()
		const withWhen = (consultas || [])
			.map((c) => {
				const when = c?.data_consulta && c?.hora ? new Date(`${c.data_consulta}T${hhmm(c.hora)}:00`) : null
				return { ...c, _when: when, _ms: when ? when.getTime() : 0 }
			})
			.filter((c) => c._when && c._ms)

		const isCancelled = (c) => String(c?.status || '').trim().toLowerCase() === 'cancelada'

		const upcoming = withWhen
			.filter((c) => c._ms >= now && !isCancelled(c))
			.sort((a, b) => a._ms - b._ms)

		const past = withWhen
			.filter((c) => c._ms < now && !isCancelled(c))
			.sort((a, b) => b._ms - a._ms)

		const cancelled = withWhen
			.filter((c) => isCancelled(c))
			.sort((a, b) => b._ms - a._ms)

		return { proximas: upcoming, historico: past, canceladas: cancelled }
	}, [consultas])

	const rows = tab === 'historico' ? historico : tab === 'canceladas' ? canceladas : proximas
	const isDependentConsulta = (c) => c?.id_dependente != null || Boolean(c?.dependente_nome)
	const myRows = useMemo(() => rows.filter((c) => !isDependentConsulta(c)), [rows])
	const dependentRows = useMemo(() => rows.filter((c) => isDependentConsulta(c)), [rows])
	const dependentLabel = (c) => {
		if (c?.dependente_nome) return c.dependente_nome
		const idDep = c?.id_dependente != null ? String(c.id_dependente) : ''
		if (!idDep) return null
		return dependentNameById.get(idDep) || `Dependente #${idDep}`
	}

	return (
		<PatientAppLayout breadcrumb="Portal / Consultas">
			<div className="ui-page">
				<PageHeader
					title="Consultas"
					subtitle="Agendadas e histórico"
					actions={
						<button className="btn btn-primary" type="button" onClick={() => navigate('/portal/marcar-consulta')}>
							Marcar consulta
						</button>
					}
				/>

				{error ? <div className="alert alert-danger">{error}</div> : null}

				<section className="ui-card p-3" aria-label="Consultas">
					<div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
						<div className="d-flex gap-2 flex-wrap">
							<button
								type="button"
								className={`btn btn-sm ${tab === 'proximas' ? 'btn-primary' : 'btn-light'}`}
								onClick={() => setTab('proximas')}
							>
								Próximas
							</button>
							<button
								type="button"
								className={`btn btn-sm ${tab === 'historico' ? 'btn-primary' : 'btn-light'}`}
								onClick={() => setTab('historico')}
							>
								Histórico
							</button>
							<button
								type="button"
								className={`btn btn-sm ${tab === 'canceladas' ? 'btn-primary' : 'btn-light'}`}
								onClick={() => setTab('canceladas')}
							>
								Canceladas
							</button>
						</div>
						{loading ? <div className="form-text" style={{ margin: 0 }}>A carregar…</div> : null}
					</div>

					{!loading && myRows.length === 0 ? <div className="form-text mt-2">Sem consultas.</div> : null}

					{myRows.length ? (
						<div className="mt-3 ui-table-wrap">
							<table className="table ui-table" aria-label="Consultas">
								<thead>
									<tr>
										<th>Data</th>
										<th>Hora</th>
										<th>Médico</th>
										<th>Motivo</th>
										<th>Estado</th>
										<th className="ui-actions-col">Ações</th>
									</tr>
								</thead>
								<tbody>
									{myRows.map((c) => (
										<tr key={c.id_consulta}>
											<td style={{ fontWeight: 700 }}>{c.data_consulta}</td>
											<td>{hhmm(c.hora) || '—'}</td>
											<td>{c.medico_nome || '—'}</td>
											<td style={{ maxWidth: 360 }}>
												<div style={{ fontWeight: 700, color: 'rgba(30,42,53,0.92)' }}>{c.razao_consulta || '—'}</div>
												{c.tipo_de_marcacao ? <div className="ui-meta mt-1">Tipo: {c.tipo_de_marcacao}</div> : null}
											</td>
											<td>
												<StatusBadge status={mapStatusFromApi(c.status)} />
											</td>
											<td className="ui-actions-col">
												<button className="btn btn-light btn-sm" type="button" onClick={() => navigate(`/portal/consultas/${c.id_consulta}`)}>
													Ver
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : null}
				</section>

				<section className="ui-card p-3 mt-3" aria-label="Consultas dos dependentes">
					<div className="fw-bold">Consultas dos dependentes</div>
					<div className="ui-meta">Consultas associadas aos teus dependentes</div>

					{!loading && dependentRows.length === 0 ? <div className="form-text mt-2">Sem consultas de dependentes.</div> : null}

					{dependentRows.length ? (
						<div className="mt-3 ui-table-wrap">
							<table className="table ui-table" aria-label="Consultas dos dependentes">
								<thead>
									<tr>
										<th>Data</th>
										<th>Hora</th>
										<th>Dependente</th>
										<th>Médico</th>
										<th>Motivo</th>
										<th>Estado</th>
										<th className="ui-actions-col">Ações</th>
									</tr>
								</thead>
								<tbody>
									{dependentRows.map((c) => (
										<tr key={c.id_consulta}>
											<td style={{ fontWeight: 700 }}>{c.data_consulta}</td>
											<td>{hhmm(c.hora) || '—'}</td>
											<td style={{ fontWeight: 700 }}>{dependentLabel(c) || '—'}</td>
											<td>{c.medico_nome || '—'}</td>
											<td style={{ maxWidth: 360 }}>
												<div style={{ fontWeight: 700, color: 'rgba(30,42,53,0.92)' }}>{c.razao_consulta || '—'}</div>
												{c.tipo_de_marcacao ? <div className="ui-meta mt-1">Tipo: {c.tipo_de_marcacao}</div> : null}
											</td>
											<td>
												<StatusBadge status={mapStatusFromApi(c.status)} />
											</td>
											<td className="ui-actions-col">
												<button className="btn btn-light btn-sm" type="button" onClick={() => navigate(`/portal/consultas/${c.id_consulta}`)}>
													Ver
												</button>
											</td>
									</tr>
									))}
								</tbody>
							</table>
						</div>
					) : null}
				</section>
			</div>
		</PatientAppLayout>
	)
}
