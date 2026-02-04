import React, { useEffect, useState } from 'react'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import PageHeader from './components/UI/PageHeader'
import { getCurrentUser } from './utils/apiClient'
import { downloadClinicalFile, listClinicalFiles, openClinicalFileInNewTab } from './utils/clinicalFilesApi'
import { formatDatePT } from './utils/dateTime'

export default function PacienteDocsDeclaracoes() {
	const user = getCurrentUser()
	const [clinicalFiles, setClinicalFiles] = useState([])
	const [filesLoading, setFilesLoading] = useState(false)
	const [filesError, setFilesError] = useState('')

	useEffect(() => {
		let mounted = true
		if (!user?.id) {
			setClinicalFiles([])
			setFilesLoading(false)
			setFilesError('Sessão inválida. Volte a autenticar-se.')
			return () => {
				mounted = false
			}
		}

		setFilesError('')
		setFilesLoading(true)
		;(async () => {
			try {
				const rows = await listClinicalFiles(user.id)
				if (mounted) setClinicalFiles(rows)
			} catch (e) {
				if (mounted) {
					setClinicalFiles([])
					setFilesError(e?.message || 'Erro ao carregar anexos')
				}
			} finally {
				if (mounted) setFilesLoading(false)
			}
		})()

		return () => {
			mounted = false
		}
	}, [user?.id])

	return (
		<PatientAppLayout breadcrumb="Portal / Docs/Declarações">
			<div className="ui-page">
				<PageHeader title="Docs/Declarações" subtitle="Atalho para os seus anexos clínicos" />

				<section className="ui-card p-3" aria-label="Anexos clínicos">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Anexos clínicos
					</h2>

					{filesLoading ? (
						<div className="form-text">A carregar anexos…</div>
					) : filesError ? (
						<div className="alert alert-warning mb-0" role="alert">
							{filesError}
						</div>
					) : clinicalFiles.length ? (
						<div className="ui-table-wrap">
							<table className="table ui-table" aria-label="Anexos">
								<thead>
									<tr>
										<th>Ficheiro</th>
										<th>Tipo</th>
										<th>Tamanho</th>
										<th>Data</th>
										<th className="ui-actions-col">Ações</th>
									</tr>
								</thead>
								<tbody>
									{clinicalFiles.map((f) => (
										<tr key={f.id_file}>
											<td style={{ fontWeight: 700 }}>{f.file_name}</td>
											<td>{f.kind || '—'}</td>
											<td>{f.size_bytes != null ? `${Math.round(Number(f.size_bytes) / 1024)} KB` : '—'}</td>
											<td>{formatDatePT(f.created_at) || '—'}</td>
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
					) : (
						<div className="form-text">Sem anexos associados.</div>
					)}
				</section>
			</div>
		</PatientAppLayout>
	)
}
