import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import PageHeader from './components/UI/PageHeader'
import { apiFetch, getCurrentUser } from './utils/apiClient'

export default function PacienteDependentes() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const [loading, setLoading] = useState(true)
	const [dependentes, setDependentes] = useState([])
	const [error, setError] = useState('')

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id) return
			setLoading(true)
			setError('')
			try {
				const res = await apiFetch(`/patients/${user.id}/dependents`)
				const rows = Array.isArray(res?.dependentes) ? res.dependentes : []
				if (mounted) setDependentes(rows)
			} catch (e) {
				if (mounted) setError(e?.message || 'Erro ao carregar dependentes')
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id])

	return (
		<PatientAppLayout breadcrumb="Portal / Dependentes">
			<div className="ui-page">
				<PageHeader title="Dependentes" subtitle="Os seus dependentes associados" />
				{error ? <div className="alert alert-danger">{error}</div> : null}
				<section className="ui-card p-3" aria-label="Dependentes">
					{loading ? <div className="form-text">A carregar…</div> : null}
					{!loading && dependentes.length === 0 ? <div className="form-text">Sem dependentes.</div> : null}
					{dependentes.length > 0 ? (
						<div className="mt-2 ui-table-wrap">
							<table className="table ui-table" aria-label="Dependentes">
								<thead>
									<tr>
										<th>Nome</th>
										<th>Data nascimento</th>
										<th>Sexo</th>
										<th className="ui-actions-col">Ações</th>
									</tr>
								</thead>
								<tbody>
									{dependentes.map((d) => (
										<tr key={d.id_dependente}>
											<td style={{ fontWeight: 700 }}>{d.nome}</td>
											<td>{String(d.data_nascimento || '').slice(0, 10) || '—'}</td>
											<td>{d.sexo || '—'}</td>
											<td className="ui-actions-col">
												<button className="btn btn-light btn-sm" type="button" onClick={() => navigate(`/portal/dependentes/${d.id_dependente}`)}>
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
