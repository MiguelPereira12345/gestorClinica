import React, { useMemo } from 'react'
import './App.css'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import { getPatientById } from './utils/patientStorage'

function Field({ label, value }) {
	return (
		<div className="patient-view-row">
			<div className="patient-view-label">{label}</div>
			<div className="patient-view-value">{value || '—'}</div>
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
				<div className="patients-content">
					<div className="patients-card" style={{ padding: 16 }}>
						<h2 style={{ margin: 0 }}>Paciente não encontrado</h2>
						<p style={{ marginTop: 8, marginBottom: 16, color: 'rgba(122,130,138,0.95)' }}>
							Este paciente ainda não existe no registo local.
						</p>
						<button className="patient-btn-primary" type="button" onClick={() => navigate('/pacientes')}>
							Voltar à lista
						</button>
					</div>
				</div>
			</AppLayout>
		)
	}

	return (
		<AppLayout breadcrumb={`Pacientes / ${patient.nome}`} userName="Dra. Sofia Lima">
			<div className="patients-content">
				<div className="patients-title-row">
					<div className="patients-title">
						<h1>Ficha do paciente</h1>
					</div>
					<div className="patients-title-actions">
						<button className="patient-btn-secondary" type="button" onClick={() => navigate('/pacientes')}>
							Voltar à lista
						</button>
						<button
							className="patient-btn-primary"
							type="button"
							onClick={() => navigate(`/pacientes/${patient.id}/editar`)}
						>
							Editar
						</button>
					</div>
				</div>

				<section className="patient-form-section" aria-label="Identificação pessoal">
					<div className="patient-view-title">Identificação Pessoal</div>
					<div className="patient-view-grid">
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

				<section className="patient-form-section" aria-label="Histórico médico geral">
					<div className="patient-view-title">Histórico Médico Geral</div>
					<div className="patient-view-grid">
						<Field label="Condições pré-existentes" value={data.condicoesPreExistentes} />
						<Field label="Medicamentos em uso" value={data.medicamentosEmUso} />
						<Field label="Alergias conhecidas" value={data.alergiasConhecidas} />
						<Field label="Histórico cirúrgico" value={data.historicoCirurgico} />
						<Field label="Internações/tratamentos" value={data.internacoesTratamentos} />
						<Field label="Gravidez (se aplicável)" value={data.gravidez} />
					</div>
				</section>

				<section className="patient-form-section" aria-label="Histórico dentário">
					<div className="patient-view-title">Histórico Dentário</div>
					<div className="patient-view-grid">
						<Field label="Motivo da consulta inicial" value={data.motivoConsultaInicial} />
						<Field label="Condições dentárias" value={data.condicoesDentarias} />
						<Field label="Tratamentos dentários passados" value={data.historicoTratamentosDentarios} />
						<Field label="Experiência com anestesias" value={data.experienciaAnestesias} />
						<Field label="Dor/desconforto/sensibilidade" value={data.historicoDorSensibilidade} />
					</div>
				</section>

				<section className="patient-form-section" aria-label="Hábitos e estilo de vida">
					<div className="patient-view-title">Hábitos e Estilo de Vida</div>
					<div className="patient-view-grid">
						<Field label="Higiene oral" value={data.habitosHigieneOral} />
						<Field label="Hábitos alimentares" value={data.habitosAlimentares} />
						<Field label="Tabaco" value={data.consumoTabaco} />
						<Field label="Álcool" value={data.consumoAlcool} />
						<Field label="Drogas" value={data.consumoDrogas} />
						<Field label="Bruxismo" value={data.bruxismo ? 'Sim' : 'Não'} />
						<Field label="Atividades desportivas" value={data.atividadesDesportivas} />
					</div>
				</section>

				<section className="patient-form-section" aria-label="Anexos clínicos">
					<div className="patient-view-title">Anexos clínicos</div>
					{Array.isArray(data.anexosClinicos) && data.anexosClinicos.length ? (
						<ul className="patient-form-files" aria-label="Anexos">
							{data.anexosClinicos.map((name) => (
								<li key={name}>{name}</li>
							))}
						</ul>
					) : (
						<div className="patient-form-help">Sem anexos.</div>
					)}
				</section>

				<section className="patient-form-section" aria-label="Tratamentos e resultados">
					<div className="patient-view-title">Tratamentos anteriores e resultados</div>
					<div className="patient-view-grid">
						<Field label="Histórico de tratamentos" value={data.historicoTratamentos} />
						<Field label="Resultados" value={data.resultadosTratamentos} />
						<Field label="Planos de tratamento" value={data.planosTratamento} />
					</div>
				</section>

				<section className="patient-form-section" aria-label="Observações adicionais">
					<div className="patient-view-title">Observações adicionais</div>
					<div className="patient-view-grid">
						<Field label="Notas" value={data.observacoesAdicionais} />
					</div>
				</section>
			</div>
		</AppLayout>
	)
}
