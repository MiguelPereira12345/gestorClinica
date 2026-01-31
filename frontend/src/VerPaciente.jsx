import React, { useMemo } from 'react'
import './App.css'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import { getPatientById } from './utils/patientStorage'

function Field({ label, value }) {
	return (
		<div className="col-12 col-lg-6">
			<div
				className="border rounded-2 p-3 h-100"
				style={{ background: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(30, 42, 53, 0.08)' }}
			>
				<div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(122, 130, 138, 0.95)', marginBottom: 6 }}>{label}</div>
				<div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(30, 42, 53, 0.92)', whiteSpace: 'pre-wrap' }}>
					{value || '—'}
				</div>
			</div>
		</div>
	)
}

export default function VerPaciente() {
	const navigate = useNavigate()
	const { id } = useParams()

	const patient = useMemo(() => (id ? getPatientById(id) : null), [id])
	const data = patient?.data || {}

	if (!patient) {
		return (
			<AppLayout breadcrumb="Pacientes / Ver" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<h2 className="m-0" style={{ fontSize: 18, fontWeight: 800 }}>
							Paciente não encontrado
						</h2>
						<p className="mt-2 mb-3" style={{ color: 'rgba(122,130,138,0.95)' }}>
							Este paciente ainda não existe no registo local.
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
		<AppLayout breadcrumb={`Pacientes / ${patient.nome}`} userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Ficha do paciente"
					subtitle={`${patient.nome} • ${patient.id}`}
					actions={
						<>
							<button className="btn btn-secondary" type="button" onClick={() => navigate('/pacientes')}>
								Voltar à lista
							</button>
							<button className="btn btn-primary" type="button" onClick={() => navigate(`/pacientes/${patient.id}/editar`)}>
								Editar
							</button>
						</>
					}
				/>

				<section className="ui-card p-3 mb-3" aria-label="Identificação pessoal">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Identificação Pessoal
					</h2>
					<div className="row g-3">
						<Field label="Nome completo" value={data.nomeCompleto || patient.nome} />
						<Field label="Data de nascimento" value={data.dataNascimento} />
						<Field label="Sexo" value={data.sexo} />
						<Field label="Endereço" value={data.endereco} />
						<Field label="Contacto (telefone)" value={data.contactoTelefone} />
						<Field label="Contacto (email)" value={data.contactoEmail || patient.email} />
						<Field label="Nº de utente" value={data.numeroUtente} />
						<Field label="NIF" value={data.nif} />
						<Field label="Subsistemas de saúde" value={data.subsistemasSaude} />
						<Field label="Estado civil" value={data.estadoCivil} />
						<Field label="Profissão" value={data.profissao} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Histórico médico geral">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Histórico Médico Geral
					</h2>
					<div className="row g-3">
						<Field label="Condições pré-existentes" value={data.condicoesPreExistentes} />
						<Field label="Medicamentos em uso" value={data.medicamentosEmUso} />
						<Field label="Alergias conhecidas" value={data.alergiasConhecidas} />
						<Field label="Histórico cirúrgico" value={data.historicoCirurgico} />
						<Field label="Internações/tratamentos" value={data.internacoesTratamentos} />
						<Field label="Gravidez (se aplicável)" value={data.gravidez} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Histórico dentário">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Histórico Dentário
					</h2>
					<div className="row g-3">
						<Field label="Motivo da consulta inicial" value={data.motivoConsultaInicial} />
						<Field label="Condições dentárias" value={data.condicoesDentarias} />
						<Field label="Tratamentos dentários passados" value={data.historicoTratamentosDentarios} />
						<Field label="Experiência com anestesias" value={data.experienciaAnestesias} />
						<Field label="Dor/desconforto/sensibilidade" value={data.historicoDorSensibilidade} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Hábitos e estilo de vida">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Hábitos e Estilo de Vida
					</h2>
					<div className="row g-3">
						<Field label="Higiene oral" value={data.habitosHigieneOral} />
						<Field label="Hábitos alimentares" value={data.habitosAlimentares} />
						<Field label="Tabaco" value={data.consumoTabaco} />
						<Field label="Álcool" value={data.consumoAlcool} />
						<Field label="Drogas" value={data.consumoDrogas} />
						<Field label="Bruxismo" value={data.bruxismo ? 'Sim' : 'Não'} />
						<Field label="Atividades desportivas" value={data.atividadesDesportivas} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Anexos clínicos">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Anexos clínicos
					</h2>
					{Array.isArray(data.anexosClinicos) && data.anexosClinicos.length ? (
						<ul className="list-group" aria-label="Anexos">
							{data.anexosClinicos.map((name) => (
								<li className="list-group-item py-2" key={name}>
									{name}
								</li>
							))}
						</ul>
					) : (
						<div className="form-text">Sem anexos.</div>
					)}
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Tratamentos e resultados">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Tratamentos anteriores e resultados
					</h2>
					<div className="row g-3">
						<Field label="Histórico de tratamentos" value={data.historicoTratamentos} />
						<Field label="Resultados" value={data.resultadosTratamentos} />
						<Field label="Planos de tratamento" value={data.planosTratamento} />
					</div>
				</section>

				<section className="ui-card p-3 mb-3" aria-label="Observações adicionais">
					<h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 900, color: 'rgba(30, 42, 53, 0.92)' }}>
						Observações adicionais
					</h2>
					<div className="row g-3">
						<Field label="Notas" value={data.observacoesAdicionais} />
					</div>
				</section>
			</div>
		</AppLayout>
	)
}
