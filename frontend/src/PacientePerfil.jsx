import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientAppLayout from './components/Layout/PatientAppLayout'
import PageHeader from './components/UI/PageHeader'
import InfoField from './components/UI/InfoField'
import { apiFetch, getCurrentUser } from './utils/apiClient'
import { downloadClinicalFile, listClinicalFiles, openClinicalFileInNewTab } from './utils/clinicalFilesApi'
import { formatDatePT } from './utils/dateTime'

function safeDateOnly(value) {
	if (!value) return ''
	return String(value).slice(0, 10)
}

export default function PacientePerfil() {
	const navigate = useNavigate()
	const user = getCurrentUser()
	const [loading, setLoading] = useState(true)
	const [perfil, setPerfil] = useState(null)
	const [error, setError] = useState('')

	const [dependentesLoading, setDependentesLoading] = useState(false)
	const [dependentesError, setDependentesError] = useState('')
	const [dependentes, setDependentes] = useState([])

	const [clinicalFiles, setClinicalFiles] = useState([])
	const [filesLoading, setFilesLoading] = useState(false)
	const [filesError, setFilesError] = useState('')

	const display = useMemo(() => {
		const p = perfil
		return {
			id: p?.id != null ? String(p.id) : '',
			nome: p?.nome || '',
			dataNascimento: safeDateOnly(p?.data_nascimento),
			sexo: p?.sexo || '',
			endereco: p?.endereco || '',
			telefone: p?.telefone || '',
			email: p?.email || '',
			numeroUtente: p?.numero_utente || '',
			nif: p?.nif || '',
			// estes campos não existem na API atual; mantêm-se para paridade visual
			subsistemasSaude: '',
			estadoCivil: '',
			profissao: '',
			condicoesPreExistentes: '',
			medicamentosEmUso: '',
			alergiasConhecidas: '',
			historicoCirurgico: '',
			internacoesTratamentos: '',
			gravidez: '',
			motivoConsultaInicial: '',
			condicoesDentarias: '',
			historicoTratamentosDentarios: '',
			experienciaAnestesias: '',
			historicoDorSensibilidade: '',
			habitosHigieneOral: '',
			habitosAlimentares: '',
			consumoTabaco: '',
			consumoAlcool: '',
			consumoDrogas: '',
			bruxismo: false,
			atividadesDesportivas: '',
		}
	}, [perfil])

	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!user?.id) return
			setLoading(true)
			setError('')
			try {
				const res = await apiFetch(`/patients/${user.id}`)
				if (mounted) setPerfil(res?.paciente || null)
			} catch (e) {
				if (mounted) setError(e?.message || 'Erro ao carregar perfil')
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
			setDependentesLoading(true)
			setDependentesError('')
			try {
				const res = await apiFetch(`/patients/${user.id}/dependents`)
				const rows = Array.isArray(res?.dependentes) ? res.dependentes : []
				if (mounted) setDependentes(rows)
			} catch (e) {
				if (mounted) {
					setDependentes([])
					setDependentesError(e?.message || 'Erro ao carregar dependentes')
				}
			} finally {
				if (mounted) setDependentesLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [user?.id])

	useEffect(() => {
		let mounted = true
		if (!user?.id) return
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
		<PatientAppLayout breadcrumb="Portal / Perfil">
			<div className="ui-page">
				<PageHeader
					title="Perfil"
					subtitle={display?.nome ? `${display.nome} • ${display.id || user?.id || ''}` : 'Os seus dados'}
					actions={
						<>
							<button className="btn btn-light" type="button" onClick={() => navigate('/portal/dependentes')}>
								Dependentes
							</button>
							<button className="btn btn-primary" type="button" onClick={() => navigate('/portal/planos')}>
								Planos
							</button>
						</>
					}
				/>
				{error ? <div className="alert alert-danger">{error}</div> : null}
				{loading ? <div className="form-text">A carregar…</div> : null}
				{!loading && !perfil ? <div className="form-text">Sem dados.</div> : null}

				{perfil ? (
					<>
						<section className="ui-card p-3 mb-3" aria-label="Identificação pessoal">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Identificação Pessoal
							</h2>
							<div className="row g-3">
								<InfoField label="Nome completo" value={display.nome} />
								<InfoField label="Data de nascimento" value={display.dataNascimento} />
								<InfoField label="Sexo" value={display.sexo} />
								<InfoField label="Endereço" value={display.endereco} />
								<InfoField label="Contacto (telefone)" value={display.telefone} />
								<InfoField label="Contacto (email)" value={display.email} />
								<InfoField label="Nº de utente" value={display.numeroUtente} />
								<InfoField label="NIF" value={display.nif} />
								<InfoField label="Subsistemas de saúde" value={display.subsistemasSaude} />
								<InfoField label="Estado civil" value={display.estadoCivil} />
								<InfoField label="Profissão" value={display.profissao} />
							</div>
						</section>

						<section className="ui-card p-3 mb-3" aria-label="Dependentes">
							<div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
								<h2 className="m-0" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
									Dependentes ({dependentes.length})
								</h2>
								<button className="btn btn-light btn-sm" type="button" onClick={() => navigate('/portal/dependentes')}>
									Ver lista
								</button>
							</div>
							{dependentesError ? <div className="alert alert-warning mt-2 mb-0">{dependentesError}</div> : null}
							{dependentesLoading ? <div className="form-text mt-2">A carregar dependentes…</div> : null}
							{!dependentesLoading && dependentes.length === 0 ? <div className="form-text mt-2">Sem dependentes associados.</div> : null}
							{!dependentesLoading && dependentes.length ? (
								<div className="mt-3 ui-table-wrap">
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
													<td>{safeDateOnly(d.data_nascimento) || '—'}</td>
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

						<section className="ui-card p-3 mb-3" aria-label="Histórico médico geral">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Histórico Médico Geral
							</h2>
							<div className="row g-3">
								<InfoField label="Condições pré-existentes" value={display.condicoesPreExistentes} />
								<InfoField label="Medicamentos em uso" value={display.medicamentosEmUso} />
								<InfoField label="Alergias conhecidas" value={display.alergiasConhecidas} />
								<InfoField label="Histórico cirúrgico" value={display.historicoCirurgico} />
								<InfoField label="Internações/tratamentos" value={display.internacoesTratamentos} />
								<InfoField label="Gravidez (se aplicável)" value={display.gravidez} />
							</div>
						</section>

						<section className="ui-card p-3 mb-3" aria-label="Histórico dentário">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Histórico Dentário
							</h2>
							<div className="row g-3">
								<InfoField label="Motivo da consulta inicial" value={display.motivoConsultaInicial} />
								<InfoField label="Condições dentárias" value={display.condicoesDentarias} />
								<InfoField label="Tratamentos dentários passados" value={display.historicoTratamentosDentarios} />
								<InfoField label="Experiência com anestesias" value={display.experienciaAnestesias} />
								<InfoField label="Dor/desconforto/sensibilidade" value={display.historicoDorSensibilidade} />
							</div>
						</section>

						<section className="ui-card p-3 mb-3" aria-label="Hábitos e estilo de vida">
							<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Hábitos e Estilo de Vida
							</h2>
							<div className="row g-3">
								<InfoField label="Higiene oral" value={display.habitosHigieneOral} />
								<InfoField label="Hábitos alimentares" value={display.habitosAlimentares} />
								<InfoField label="Tabaco" value={display.consumoTabaco} />
								<InfoField label="Álcool" value={display.consumoAlcool} />
								<InfoField label="Drogas" value={display.consumoDrogas} />
								<InfoField label="Bruxismo" value={display.bruxismo ? 'Sim' : 'Não'} />
								<InfoField label="Atividades desportivas" value={display.atividadesDesportivas} />
							</div>
						</section>

						<section className="ui-card p-3 mb-3" aria-label="Anexos clínicos">
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
														<button
															className="btn btn-light btn-sm"
															type="button"
															onClick={() => openClinicalFileInNewTab(f.id_file)}
														>
															Abrir
														</button>
														<button
															className="btn btn-light btn-sm ms-2"
															type="button"
															onClick={() => downloadClinicalFile(f.id_file)}
														>
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
					</>
				) : null}
			</div>
		</PatientAppLayout>
	)
}
