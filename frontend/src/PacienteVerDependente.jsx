import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import InfoField from './components/UI/InfoField'
import { apiFetch, getCurrentUser } from './utils/apiClient'
import { downloadClinicalFile, listDependentFiles, openClinicalFileInNewTab } from './utils/clinicalFilesApi'

function safeDateOnly(value) {
	if (!value) return ''
	return String(value).slice(0, 10)
}

export default function PacienteVerDependente() {
	const user = getCurrentUser()
	const navigate = useNavigate()
	const { id } = useParams()

	const [loading, setLoading] = useState(true)
	const [dependente, setDependente] = useState(null)
	const [error, setError] = useState('')

	const [filesLoading, setFilesLoading] = useState(false)
	const [filesError, setFilesError] = useState('')
	const [files, setFiles] = useState([])

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id || !id) return
			setLoading(true)
			setError('')
			try {
				const res = await apiFetch(`/patients/${user.id}/dependents/${encodeURIComponent(String(id))}`)
				if (mounted) setDependente(res?.dependente || null)
			} catch (e) {
				if (mounted) setError(e?.message || 'Erro ao carregar dependente')
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
		if (!id) return
		setFilesLoading(true)
		setFilesError('')
		;(async () => {
			try {
				const rows = await listDependentFiles(id)
				if (mounted) setFiles(rows)
			} catch (e) {
				if (mounted) {
					setFiles([])
					setFilesError(e?.message || 'Erro ao carregar anexos')
				}
			} finally {
				if (mounted) setFilesLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [id])

	const subtitle = useMemo(() => {
		if (!dependente) return ''
		const born = safeDateOnly(dependente.data_nascimento)
		return born ? `Data de nascimento: ${born}` : ''
	}, [dependente])

	return (
		<PatientAppLayout breadcrumb="Portal / Dependentes / Detalhes">
			<div className="ui-page">
				<div className="ui-page-header">
					<div>
						<h1 className="ui-page-title">Detalhes do dependente</h1>
						<div className="ui-page-subtitle">{dependente?.nome || subtitle || '—'}</div>
					</div>
					<div className="app-topbar-actions">
						<button type="button" className="btn btn-secondary" onClick={() => navigate('/portal/dependentes')}>
							<ArrowLeft size={16} aria-hidden="true" />
							Voltar
						</button>
					</div>
				</div>

				{error ? <div className="alert alert-danger">{error}</div> : null}
				{loading ? <div className="form-text">A carregar…</div> : null}
				{!loading && !dependente ? <div className="form-text">Dependente não encontrado.</div> : null}

				{dependente ? (
					<>
						<section className="ui-card p-3 mb-3" aria-label="Identificação do dependente">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Identificação
							</h2>
							<div className="row g-3">
								<InfoField label="Nome completo" value={dependente.nome} />
								<InfoField label="Data de nascimento" value={safeDateOnly(dependente.data_nascimento)} />
								<InfoField label="Sexo" value={dependente.sexo} />
								<InfoField label="Nº de utente" value={dependente.numero_utente} />
								<InfoField label="NIF" value={dependente.nif} />
							</div>
						</section>

						<section className="ui-card p-3 mb-3" aria-label="Histórico médico geral do dependente">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Histórico Médico Geral
							</h2>
							<div className="row g-3">
								<InfoField label="Condições pré-existentes" value={dependente.condicoes_pre_existentes} />
								<InfoField label="Medicamentos em uso" value={dependente.medicamentos_em_uso} />
								<InfoField label="Alergias conhecidas" value={dependente.alergias_conhecidas} />
								<InfoField label="Histórico cirúrgico" value={dependente.historico_cirurgico} />
								<InfoField label="Internações/tratamentos" value={dependente.internacoes_tratamentos} />
								<InfoField label="Gravidez (se aplicável)" value={dependente.gravidez} />
							</div>
						</section>

						<section className="ui-card p-3 mb-3" aria-label="Histórico dentário do dependente">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Histórico Dentário
							</h2>
							<div className="row g-3">
								<InfoField label="Motivo da consulta inicial" value={dependente.motivo_consulta_inicial} />
								<InfoField label="Condições dentárias" value={dependente.condicoes_dentarias} />
								<InfoField label="Tratamentos dentários passados" value={dependente.tratamentos_dentarios_passados} />
								<InfoField label="Experiência com anestesias" value={dependente.experiencia_anestesias} />
								<InfoField label="Dor/desconforto/sensibilidade" value={dependente.historico_dor_sensibilidade} />
							</div>
						</section>

						<section className="ui-card p-3" aria-label="Hábitos e estilo de vida do dependente">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Hábitos e Estilo de Vida
							</h2>
							<div className="row g-3">
								<InfoField label="Higiene oral" value={dependente.habitos_higiene_oral} />
								<InfoField label="Hábitos alimentares" value={dependente.habitos_alimentares} />
								<InfoField label="Tabaco" value={dependente.consumo_tabaco} />
								<InfoField label="Álcool" value={dependente.consumo_alcool} />
								<InfoField label="Drogas" value={dependente.consumo_drogas} />
								<InfoField label="Observações" value={dependente.observacoes} />
							</div>
						</section>

						<section className="ui-card p-3 mt-3" aria-label="Anexos clínicos do dependente">
							<div className="fw-bold mb-1">Anexos clínicos</div>
							<div className="ui-meta">Ficheiros associados a este dependente</div>

							{filesLoading ? <div className="form-text mt-2">A carregar anexos…</div> : null}
							{filesError ? (
								<div className="alert alert-warning mt-2 mb-0" role="alert">
									{filesError}
								</div>
							) : null}

							{!filesLoading && !filesError && files.length === 0 ? <div className="form-text mt-2">Sem anexos.</div> : null}

							{files.length ? (
								<div className="mt-2 ui-table-wrap">
									<table className="table ui-table" aria-label="Anexos">
										<thead>
											<tr>
												<th>Ficheiro</th>
												<th className="ui-actions-col">Ações</th>
											</tr>
										</thead>
										<tbody>
											{files.map((f) => (
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
					</>
				) : null}
			</div>
		</PatientAppLayout>
	)
}
