import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import PageHeader from './components/UI/PageHeader'
import { apiFetch, getCurrentUser } from './utils/apiClient'

export default function PacientePlanos() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const [loading, setLoading] = useState(true)
	const [planos, setPlanos] = useState([])
	const [error, setError] = useState('')

	const planosPaciente = useMemo(() => (planos || []).filter((p) => !p?.dependent_id), [planos])
	const planosDependentes = useMemo(() => (planos || []).filter((p) => !!p?.dependent_id), [planos])

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id) return
			setLoading(true)
			setError('')
			try {
				const res = await apiFetch(`/patients/${user.id}/planos`)
				const rows = Array.isArray(res?.planos) ? res.planos : []
				if (mounted) setPlanos(rows)
			} catch (e) {
				if (mounted) setError(e?.message || 'Erro ao carregar tratamentos')
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id])

	return (
		<PatientAppLayout breadcrumb="Portal / Tratamentos">
			<div className="ui-page">
				<PageHeader title="Tratamentos" subtitle="Planos de tratamento para si e dependentes" />
				{error ? <div className="alert alert-danger">{error}</div> : null}

				<section className="ui-card p-3" aria-label="Tratamentos">
					<div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
						<div className="d-flex gap-2 flex-wrap">
							<div className="fw-bold">Meus tratamentos</div>
						</div>
						{loading ? <div className="form-text" style={{ margin: 0 }}>A carregar…</div> : null}
					</div>

					{!loading && planosPaciente.length === 0 ? <div className="form-text mt-2">Sem tratamentos.</div> : null}

					{planosPaciente.length > 0 ? (
						<div className="mt-3 ui-table-wrap">
							<table className="table ui-table" aria-label="Tratamentos do paciente">
								<thead>
									<tr>
										<th>ID</th>
										<th>Início</th>
										<th>Fim</th>
										<th>Nome</th>
										<th>Estado</th>
										<th className="ui-actions-col">Ações</th>
									</tr>
								</thead>
								<tbody>
									{planosPaciente.map((p) => (
										<tr key={p.id_tratamento}>
											<td style={{ fontWeight: 700 }}>{p.id_tratamento}</td>
											<td>{p.data_inicio || '—'}</td>
											<td>{p.data_fim || '—'}</td>
											<td style={{ maxWidth: 520, whiteSpace: 'pre-wrap' }}>{p.nome || p.descricao || '—'}</td>
											<td>{p.status || '—'}</td>
											<td className="ui-actions-col">
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => navigate(`/portal/planos/${encodeURIComponent(String(p.id_tratamento))}`)}
												>
													<Eye size={14} aria-hidden="true" />
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

				<section className="ui-card p-3 mt-3" aria-label="Tratamentos dos dependentes">
					<div className="fw-bold">Tratamentos dos dependentes</div>
					<div className="ui-meta">Planos de tratamento para os seus dependentes</div>

					{loading ? <div className="form-text mt-2">A carregar…</div> : null}
					{!loading && planosDependentes.length === 0 ? <div className="form-text mt-2">Sem tratamentos de dependentes.</div> : null}

					{planosDependentes.length > 0 ? (
						<div className="mt-3 ui-table-wrap">
							<table className="table ui-table" aria-label="Tratamentos dos dependentes">
								<thead>
									<tr>
										<th>ID</th>
										<th>Dependente</th>
										<th>Início</th>
										<th>Fim</th>
										<th>Nome</th>
										<th>Estado</th>
										<th className="ui-actions-col">Ações</th>
									</tr>
								</thead>
								<tbody>
									{planosDependentes.map((p) => (
										<tr key={p.id_tratamento}>
											<td style={{ fontWeight: 700 }}>{p.id_tratamento}</td>
											<td>{p.dependente_nome || '—'}</td>
											<td>{p.data_inicio || '—'}</td>
											<td>{p.data_fim || '—'}</td>
											<td style={{ maxWidth: 520, whiteSpace: 'pre-wrap' }}>{p.nome || p.descricao || '—'}</td>
											<td>{p.status || '—'}</td>
											<td className="ui-actions-col">
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => navigate(`/portal/planos/${encodeURIComponent(String(p.id_tratamento))}`)}
												>
													<Eye size={14} aria-hidden="true" />
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
