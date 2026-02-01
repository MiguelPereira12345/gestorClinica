import React, { useMemo, useState } from 'react'
import './App.css'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import {
	buildPatientRecordFromForm,
	createEmptyPatientForm,
	getPatientById,
	upsertPatient,
} from './utils/patientStorage'

export default function AdicionarDependente() {
	const navigate = useNavigate()
	const { id: responsavelId } = useParams()

	const responsavel = useMemo(() => (responsavelId ? getPatientById(responsavelId) : null), [responsavelId])
	const responsavelTelefone = useMemo(
		() => (responsavel?.telefone || responsavel?.data?.contactoTelefone || '').trim(),
		[responsavel]
	)

	const [files, setFiles] = useState([])
	const [saving, setSaving] = useState(false)
	const [form, setForm] = useState(() => {
		const base = createEmptyPatientForm()
		base.responsavelId = responsavelId || ''
		if (!base.contactoTelefone && responsavelTelefone) {
			base.contactoTelefone = responsavelTelefone
		}
		return base
	})

	const fileNames = useMemo(() => files.map((f) => f.name), [files])

	function updateField(name, value) {
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	function onPickFiles(event) {
		const list = Array.from(event.target.files || [])
		setFiles(list)
	}

	function onSubmit(e) {
		e.preventDefault()
		if (saving) return

		const nome = form.nomeCompleto.trim()
		if (!nome) {
			alert('Por favor, preenche o Nome completo do dependente.')
			return
		}

		const telefone = form.contactoTelefone.trim()
		if (!telefone) {
			alert('Por favor, preenche o Contacto (telefone).')
			return
		}

		setSaving(true)
		try {
			const next = buildPatientRecordFromForm({
				form: {
					...form,
					responsavelId: responsavelId || '',
				},
				anexosClinicos: fileNames,
			})
			upsertPatient(next)
			navigate(`/pacientes/${next.id}`)
		} finally {
			setSaving(false)
		}
	}

	if (!responsavelId || !responsavel) {
		return (
			<AppLayout breadcrumb="Pacientes / Dependente" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<h2 className="m-0" style={{ fontSize: 18, fontWeight: 800 }}>
							Responsável não encontrado
						</h2>
						<p className="mt-2 mb-3" style={{ color: 'rgba(122,130,138,0.95)' }}>
							Abre um paciente existente e usa “+ Dependente”.
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
		<AppLayout breadcrumb={`Pacientes / ${responsavel.nome} / Adicionar dependente`} userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Adicionar dependente"
					subtitle={`Responsável: ${responsavel.nome}${responsavelTelefone ? ` • ${responsavelTelefone}` : ''}`}
					actions={
						<>
							<button type="button" className="btn btn-secondary" onClick={() => navigate('/pacientes')}>
								Cancelar
							</button>
							<button type="submit" form="add-dependent-form" className="btn btn-primary" disabled={saving}>
								{saving ? 'A guardar…' : 'Guardar'}
							</button>
						</>
					}
				/>

				<form id="add-dependent-form" className="d-grid gap-3" onSubmit={onSubmit}>
					<details className="ui-card p-3 patient-details" open>
						<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
							Registo dos Pacientes — Identificação Pessoal
						</summary>
						<div className="row g-3 mt-2">
							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Nome completo *
								</label>
								<input className="form-control" type="text" value={form.nomeCompleto} onChange={(e) => updateField('nomeCompleto', e.target.value)} required />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Data de nascimento
								</label>
								<input className="form-control" type="date" value={form.dataNascimento} onChange={(e) => updateField('dataNascimento', e.target.value)} />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Sexo
								</label>
								<select className="form-select" value={form.sexo} onChange={(e) => updateField('sexo', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Feminino">Feminino</option>
									<option value="Masculino">Masculino</option>
									<option value="Outro">Outro</option>
									<option value="Prefere não dizer">Prefere não dizer</option>
								</select>
							</div>

							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Endereço
								</label>
								<input className="form-control" type="text" value={form.endereco} onChange={(e) => updateField('endereco', e.target.value)} placeholder="Rua, nº, localidade" />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Contacto (telefone) *
								</label>
								<input className="form-control" type="tel" value={form.contactoTelefone} onChange={(e) => updateField('contactoTelefone', e.target.value)} placeholder="Ex: 912 345 678" required />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Contacto (email)
								</label>
								<input className="form-control" type="email" value={form.contactoEmail} onChange={(e) => updateField('contactoEmail', e.target.value)} placeholder="nome@exemplo.com" />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Nº de utente (se aplicável)
								</label>
								<input className="form-control" type="text" value={form.numeroUtente} onChange={(e) => updateField('numeroUtente', e.target.value)} />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									NIF
								</label>
								<input className="form-control" type="text" value={form.nif} onChange={(e) => updateField('nif', e.target.value)} />
							</div>

							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Subsistemas de saúde
								</label>
								<input className="form-control" type="text" value={form.subsistemasSaude} onChange={(e) => updateField('subsistemasSaude', e.target.value)} placeholder="Ex: ADSE, SAMS…" />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Estado civil
								</label>
								<select className="form-select" value={form.estadoCivil} onChange={(e) => updateField('estadoCivil', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Solteiro(a)">Solteiro(a)</option>
									<option value="Casado(a)">Casado(a)</option>
									<option value="União de facto">União de facto</option>
									<option value="Divorciado(a)">Divorciado(a)</option>
									<option value="Viúvo(a)">Viúvo(a)</option>
								</select>
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Profissão
								</label>
								<input className="form-control" type="text" value={form.profissao} onChange={(e) => updateField('profissao', e.target.value)} />
							</div>
						</div>
					</details>

					<details className="ui-card p-3 patient-details">
						<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
							Histórico Médico Geral
						</summary>
						<div className="row g-3 mt-2">
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Condições de saúde pré-existentes
								</label>
								<textarea className="form-control" rows={3} value={form.condicoesPreExistentes} onChange={(e) => updateField('condicoesPreExistentes', e.target.value)} placeholder="Ex: diabetes, hipertensão, doenças cardíacas…" />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Medicamentos em uso
								</label>
								<textarea className="form-control" rows={3} value={form.medicamentosEmUso} onChange={(e) => updateField('medicamentosEmUso', e.target.value)} placeholder="Prescritos e não prescritos" />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Alergias conhecidas
								</label>
								<textarea className="form-control" rows={3} value={form.alergiasConhecidas} onChange={(e) => updateField('alergiasConhecidas', e.target.value)} placeholder="Medicamentos, alimentos, químicos…" />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Histórico cirúrgico relevante
								</label>
								<textarea className="form-control" rows={3} value={form.historicoCirurgico} onChange={(e) => updateField('historicoCirurgico', e.target.value)} />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Internações ou tratamentos médicos importantes
								</label>
								<textarea className="form-control" rows={3} value={form.internacoesTratamentos} onChange={(e) => updateField('internacoesTratamentos', e.target.value)} />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Gravidez (quando aplicável)
								</label>
								<textarea className="form-control" rows={2} value={form.gravidez} onChange={(e) => updateField('gravidez', e.target.value)} placeholder="Indicar se aplicável" />
							</div>
						</div>
					</details>

					<details className="ui-card p-3 patient-details">
						<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
							Histórico Dentário
						</summary>
						<div className="row g-3 mt-2">
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Motivo da consulta inicial
								</label>
								<textarea className="form-control" rows={2} value={form.motivoConsultaInicial} onChange={(e) => updateField('motivoConsultaInicial', e.target.value)} />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Condições dentárias pré-existentes
								</label>
								<textarea className="form-control" rows={3} value={form.condicoesDentarias} onChange={(e) => updateField('condicoesDentarias', e.target.value)} placeholder="Ex: cáries, problemas periodontais…" />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Histórico de tratamentos dentários passados
								</label>
								<textarea className="form-control" rows={3} value={form.historicoTratamentosDentarios} onChange={(e) => updateField('historicoTratamentosDentarios', e.target.value)} placeholder="Ex: implantes, ortodontia, próteses…" />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Experiência com anestesias (locais/gerais)
								</label>
								<textarea className="form-control" rows={2} value={form.experienciaAnestesias} onChange={(e) => updateField('experienciaAnestesias', e.target.value)} />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Histórico de dor/desconforto/sensibilidade
								</label>
								<textarea className="form-control" rows={2} value={form.historicoDorSensibilidade} onChange={(e) => updateField('historicoDorSensibilidade', e.target.value)} />
							</div>
						</div>
					</details>

					<details className="ui-card p-3 patient-details">
						<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
							Hábitos e Estilo de Vida
						</summary>
						<div className="row g-3 mt-2">
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Hábitos de higiene oral
								</label>
								<textarea className="form-control" rows={3} value={form.habitosHigieneOral} onChange={(e) => updateField('habitosHigieneOral', e.target.value)} placeholder="Frequência e tipo de escovagem, fio dentário…" />
							</div>

							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Hábitos alimentares
								</label>
								<textarea className="form-control" rows={3} value={form.habitosAlimentares} onChange={(e) => updateField('habitosAlimentares', e.target.value)} placeholder="Ingestão frequente de açúcar, bebidas ácidas…" />
							</div>

							<div className="col-12 col-md-4">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Consumo de tabaco
								</label>
								<select className="form-select" value={form.consumoTabaco} onChange={(e) => updateField('consumoTabaco', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Não">Não</option>
									<option value="Ocasional">Ocasional</option>
									<option value="Regular">Regular</option>
								</select>
							</div>

							<div className="col-12 col-md-4">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Consumo de álcool
								</label>
								<select className="form-select" value={form.consumoAlcool} onChange={(e) => updateField('consumoAlcool', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Não">Não</option>
									<option value="Ocasional">Ocasional</option>
									<option value="Regular">Regular</option>
								</select>
							</div>

							<div className="col-12 col-md-4">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Consumo de drogas
								</label>
								<select className="form-select" value={form.consumoDrogas} onChange={(e) => updateField('consumoDrogas', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Não">Não</option>
									<option value="Ocasional">Ocasional</option>
									<option value="Regular">Regular</option>
								</select>
							</div>

							<div className="col-12">
								<div className="form-check">
									<input className="form-check-input" type="checkbox" checked={form.bruxismo} onChange={(e) => updateField('bruxismo', e.target.checked)} id="add-dependent-bruxismo" />
									<label className="form-check-label" htmlFor="add-dependent-bruxismo" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
										Bruxismo (aperto/ranger)
									</label>
								</div>
							</div>

							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Atividades desportivas
								</label>
								<textarea className="form-control" rows={2} value={form.atividadesDesportivas} onChange={(e) => updateField('atividadesDesportivas', e.target.value)} placeholder="Especialmente com risco para a saúde dentária" />
							</div>
						</div>
					</details>

					<details className="ui-card p-3 patient-details">
						<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
							Anexar exames clínicos
						</summary>
						<div className="row g-3 mt-2">
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Ficheiros
								</label>
								<input className="form-control" type="file" multiple onChange={onPickFiles} />
								{fileNames.length ? (
									<ul className="list-group mt-2" aria-label="Ficheiros selecionados">
										{fileNames.map((name) => (
											<li className="list-group-item py-2" key={name}>
												{name}
											</li>
										))}
									</ul>
								) : (
									<div className="form-text">Ainda não selecionaste ficheiros.</div>
								)}
							</div>
						</div>
					</details>

					<details className="ui-card p-3 patient-details">
						<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
							Tratamentos anteriores e resultados
						</summary>
						<div className="row g-3 mt-2">
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Histórico de tratamentos (Clinimolelos e/ou outras)
								</label>
								<textarea className="form-control" rows={3} value={form.historicoTratamentos} onChange={(e) => updateField('historicoTratamentos', e.target.value)} />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Resultados de tratamentos anteriores
								</label>
								<textarea className="form-control" rows={3} value={form.resultadosTratamentos} onChange={(e) => updateField('resultadosTratamentos', e.target.value)} placeholder="Satisfação, sucesso, complicações…" />
							</div>
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Planos de tratamento recomendados e realizados
								</label>
								<textarea className="form-control" rows={3} value={form.planosTratamento} onChange={(e) => updateField('planosTratamento', e.target.value)} />
							</div>
						</div>
					</details>

					<details className="ui-card p-3 patient-details">
						<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
							Observações adicionais
						</summary>
						<div className="row g-3 mt-2">
							<div className="col-12">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Notas
								</label>
								<textarea className="form-control" rows={4} value={form.observacoesAdicionais} onChange={(e) => updateField('observacoesAdicionais', e.target.value)} placeholder="Ex: ansiedade, medos específicos, necessidades especiais…" />
							</div>
						</div>
					</details>
				</form>
			</div>
		</AppLayout>
	)
}
