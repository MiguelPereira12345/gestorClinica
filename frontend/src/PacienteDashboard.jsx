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

export default function PacienteDashboard() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const [loading, setLoading] = useState(true)
	const [consultas, setConsultas] = useState([])
	const [error, setError] = useState('')

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

	const next = useMemo(() => {
		const now = Date.now()
		return (consultas || [])
			.map((c) => {
				const when = c?.data_consulta && c?.hora ? new Date(`${c.data_consulta}T${hhmm(c.hora)}:00`) : null
				return { ...c, _when: when, _ms: when ? when.getTime() : 0 }
			})
			.filter((c) => c._when && c._ms >= now)
			.filter((c) => String(c?.status || '').trim().toLowerCase() !== 'cancelada')
			.sort((a, b) => a._ms - b._ms)
			.slice(0, 5)
	}, [consultas])

	return (
		<PatientAppLayout breadcrumb="Portal / Início">
			<div className="ui-page">
				<PageHeader
					title="Portal do utente"
					subtitle="Consultas e pedidos"
					actions={
						<button className="btn btn-light" type="button" onClick={() => navigate('/portal/consultas')}>
							Ver todas
						</button>
					}
				/>

				{error ? <div className="alert alert-danger">{error}</div> : null}

				<section className="ui-card p-3" aria-label="Próximas consultas">
					<div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
						<h2 className="m-0" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
							Próximas consultas
						</h2>
						{loading ? <div className="form-text" style={{ margin: 0 }}>A carregar…</div> : null}
					</div>
					{!loading && next.length === 0 ? (
						<div className="form-text mt-2">Sem consultas agendadas.</div>
					) : null}
					{next.length ? (
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
									{next.map((c) => (
										<tr key={c.id_consulta}>
											<td style={{ fontWeight: 700 }}>{c.data_consulta}</td>
											<td>{hhmm(c.hora) || '—'}</td>
											<td>{c.medico_nome || '—'}</td>
											<td style={{ maxWidth: 360 }}>{c.razao_consulta || '—'}</td>
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
