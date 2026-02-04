import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import InfoField from './components/UI/InfoField'
import { getDependentsOf, getEffectivePhone, getPatientById, loadPatients } from './utils/patientStorage'
import { downloadClinicalFile, listClinicalFiles, openClinicalFileInNewTab } from './utils/clinicalFilesApi'
import { formatDatePT } from './utils/dateTime'

export default function VerPaciente() {
	const navigate = useNavigate()
	const { id } = useParams()

	const patient = useMemo(() => (id ? getPatientById(id) : null), [id])
	const allPatients = useMemo(() => loadPatients(), [])
	const data = patient?.data || {}
	const responsavelId = patient?.responsavelId || data?.responsavelId || null
	const responsavel = useMemo(() => (responsavelId ? allPatients.find((p) => p?.id === responsavelId) : null), [responsavelId, allPatients])
	const dependentes = useMemo(() => (patient ? getDependentsOf(patient.id, allPatients) : []), [patient, allPatients])
	const effectivePhone = useMemo(() => (patient ? getEffectivePhone(patient, allPatients) : ''), [patient, allPatients])

	const [clinicalFiles, setClinicalFiles] = useState([])
	const [filesLoading, setFilesLoading] = useState(false)
	const [filesError, setFilesError] = useState('')

	useEffect(() => {
		let mounted = true
		if (!patient?.id) return
		setFilesError('')
		setFilesLoading(true)
		;(async () => {
			try {
				const rows = await listClinicalFiles(patient.id)
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
	}, [patient?.id])

	if (!patient) {
		return (
			<AppLayout breadcrumb="Utentes / Ver" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<h2 className="m-0" style={{ fontSize: 18, fontWeight: 800 }}>
							Utente não encontrado
						</h2>
						<p className="mt-2 mb-3" style={{ color: 'rgba(122,130,138,0.95)' }}>
							Este utente ainda não existe no registo local.
						</p>
						<button className="btn btn-primary" type="button" onClick={() => navigate('/pacientes')}>
							Voltar à lista
						</button>
					</div>
				</div>
			</AppLayout>
		)
	}

	return (
		<AppLayout breadcrumb={`Utentes / ${patient.nome}`} userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Ficha do utente"
					subtitle={`${patient.nome} • ${patient.id}`}
					actions={
						<>
							<button className="btn btn-secondary" type="button" onClick={() => navigate('/pacientes')}>
								Voltar à lista
							</button>
							<button className="btn btn-light" type="button" onClick={() => navigate(`/pacientes/${patient.id}/planos`)}>
								Planos
							</button>
							<button className="btn btn-primary" type="button" onClick={() => navigate(`/pacientes/${patient.id}/editar`)}>
								Editar
							</button>
						</>
					}
				/>

				{responsavelId ? (
					<section className="ui-card p-3 mb-3" aria-label="Responsável">
						<h2 className="m-0 mb-2" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
							Responsável
						</h2>
						<div className="d-flex flex-wrap gap-2 align-items-center">
							<div className="form-text" style={{ margin: 0 }}>
								{responsavel ? (
									<>
										{responsavel.nome} • {(responsavel.telefone || responsavel?.data?.contactoTelefone) || '—'}
									</>
								) : (
									<>ID: {responsavelId}</>
								)}
							</div>
							{responsavel ? (
								<button className="btn btn-light btn-sm" type="button" onClick={() => navigate(`/pacientes/${responsavel.id}`)}>
									Abrir ficha do responsável
								</button>
							) : null}
						</div>
					</section>
				) : null}

				<section className="ui-card p-3 mb-3" aria-label="Identificação pessoal">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Identificação Pessoal
					</h2>
					<div className="row g-3">
						<InfoField label="Nome completo" value={data.nomeCompleto || patient.nome} />
						<InfoField label="Data de nascimento" value={data.dataNascimento} />
						<InfoField label="Sexo" value={data.sexo} />
						<InfoField label="Endereço" value={data.endereco} />
						<InfoField
							label={responsavelId ? 'Contacto (telefone) — efetivo' : 'Contacto (telefone)'}
							value={effectivePhone || data.contactoTelefone}
						/>
						<InfoField label="Contacto (email)" value={data.contactoEmail || patient.email} />
						<InfoField label="Nº de utente" value={data.numeroUtente} />
						<InfoField label="NIF" value={data.nif} />
						<InfoField label="Subsistemas de saúde" value={data.subsistemasSaude} />
						<InfoField label="Estado civil" value={data.estadoCivil} />
						<InfoField label="Profissão" value={data.profissao} />
					</div>
				</section>

				{!responsavelId ? (
					<section className="ui-card p-3 mb-3" aria-label="Dependentes">
						<div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
							<h2 className="m-0" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
								Dependentes ({dependentes.length})
							</h2>
							<button className="btn btn-primary btn-sm" type="button" onClick={() => navigate(`/pacientes/${patient.id}/dependente/novo`)}>
								+ Dependente
							</button>
						</div>
						{dependentes.length ? (
							<div className="mt-3 ui-table-wrap">
								<table className="table ui-table">
									<thead>
										<tr>
											<th>Nome</th>
											<th>Telefone</th>
											<th>Estado</th>
											<th className="ui-actions-col">Ações</th>
										</tr>
									</thead>
									<tbody>
										{dependentes.map((d) => (
											<tr key={d.id}>
												<td style={{ fontWeight: 700 }}>{d.nome}</td>
												<td>{getEffectivePhone(d, allPatients) || '—'}</td>
												<td>{d.estado || 'Ativo'}</td>
												<td className="ui-actions-col">
													<button className="btn btn-light btn-sm" type="button" onClick={() => navigate(`/pacientes/${d.id}`)}>
														Abrir
													</button>
													<button className="btn btn-light btn-sm ms-2" type="button" onClick={() => navigate(`/pacientes/${d.id}/planos`)}>
														Planos
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="form-text mt-2">Sem dependentes associados.</div>
						)}
					</section>
				) : null}

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
											<td style={{ fontWeight: 700 }}>{f.file_name || `Anexo ${f.id_file}`}</td>
											<td>{f.mime_type || '—'}</td>
											<td>{typeof f.size_bytes === 'number' ? `${Math.round(f.size_bytes / 1024)} KB` : '—'}</td>
											<td>{formatDatePT(f.created_at) || '—'}</td>
											<td className="ui-actions-col">
												<div className="ui-actions">
													<button
														type="button"
														className="btn btn-light btn-sm"
														onClick={() => openClinicalFileInNewTab(f.id_file)}
													>
														Ver
													</button>
													<button
														type="button"
														className="btn btn-light btn-sm"
														onClick={() => downloadClinicalFile(f.id_file)}
													>
														Baixar
													</button>
												</div>
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				) : Array.isArray(data.anexosClinicos) && data.anexosClinicos.length ? (
					<div>
						<div className="form-text mb-2">Anexos antigos (apenas nomes; sem ficheiro associado no servidor).</div>
						<ul className="list-group" aria-label="Anexos (legacy)">
							{data.anexosClinicos.map((name) => (
								<li className="list-group-item py-2" key={name}>
									{name}
								</li>
							))}
						</ul>
					</div>
				) : (
					<div className="form-text">Sem anexos.</div>
				)}
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Histórico médico geral">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Histórico Médico Geral
					</h2>
					<div className="row g-3">
						<InfoField label="Condições pré-existentes" value={data.condicoesPreExistentes} />
						<InfoField label="Medicamentos em uso" value={data.medicamentosEmUso} />
						<InfoField label="Alergias conhecidas" value={data.alergiasConhecidas} />
						<InfoField label="Histórico cirúrgico" value={data.historicoCirurgico} />
						<InfoField label="Internações/tratamentos" value={data.internacoesTratamentos} />
						<InfoField label="Gravidez (se aplicável)" value={data.gravidez} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Histórico dentário">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Histórico Dentário
					</h2>
					<div className="row g-3">
						<InfoField label="Motivo da consulta inicial" value={data.motivoConsultaInicial} />
						<InfoField label="Condições dentárias" value={data.condicoesDentarias} />
						<InfoField label="Tratamentos dentários passados" value={data.historicoTratamentosDentarios} />
						<InfoField label="Experiência com anestesias" value={data.experienciaAnestesias} />
						<InfoField label="Dor/desconforto/sensibilidade" value={data.historicoDorSensibilidade} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Hábitos e estilo de vida">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Hábitos e Estilo de Vida
					</h2>
					<div className="row g-3">
						<InfoField label="Higiene oral" value={data.habitosHigieneOral} />
						<InfoField label="Hábitos alimentares" value={data.habitosAlimentares} />
						<InfoField label="Tabaco" value={data.consumoTabaco} />
						<InfoField label="Álcool" value={data.consumoAlcool} />
						<InfoField label="Drogas" value={data.consumoDrogas} />
						<InfoField label="Bruxismo" value={data.bruxismo ? 'Sim' : 'Não'} />
						<InfoField label="Atividades desportivas" value={data.atividadesDesportivas} />
					</div>
				</section>


				<section className="ui-card p-3 mb-3" aria-label="Tratamentos e resultados">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Tratamentos anteriores e resultados
					</h2>
					<div className="row g-3">
						<InfoField label="Histórico de tratamentos" value={data.historicoTratamentos} />
						<InfoField label="Resultados" value={data.resultadosTratamentos} />
						<InfoField label="Planos de tratamento" value={data.planosTratamento} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Observações adicionais">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Observações adicionais
					</h2>
					<div className="row g-3">
						<InfoField label="Notas" value={data.observacoesAdicionais} />
					</div>
				</section>
			</div>
		</AppLayout>
	)
}
