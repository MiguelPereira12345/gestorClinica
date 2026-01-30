import React, { useMemo, useState } from 'react'
import './App.css'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import {
	buildPatientRecordFromForm,
	getPatientById,
	patientToForm,
	updatePatient,
} from './utils/patientStorage'

export default function EditarPaciente() {
	const navigate = useNavigate()
	const { id } = useParams()
	const patient = useMemo(() => (id ? getPatientById(id) : null), [id])

	const [saving, setSaving] = useState(false)
	const [files, setFiles] = useState(() => {
		const initial = patient?.data?.anexosClinicos
		return Array.isArray(initial) ? initial.map((n) => ({ name: n })) : []
	})
	const [form, setForm] = useState(() => patientToForm(patient))

	function updateField(name, value) {
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	function onPickFiles(event) {
		const list = Array.from(event.target.files || [])
		setFiles((prev) => {
			const existing = new Set(prev.map((f) => f.name))
			const merged = [...prev]
			for (const f of list) {
				if (!existing.has(f.name)) merged.push(f)
			}
			return merged
		})
	}

	function onSubmit(e) {
		e.preventDefault()
		if (saving) return
		if (!patient || !id) return

		const nome = form.nomeCompleto.trim()
		if (!nome) {
			alert('Por favor, preenche o Nome completo.')
			return
		}

		setSaving(true)
		try {
			const anexosClinicos = files.map((f) => f.name)
			const next = buildPatientRecordFromForm({
				id: patient.id,
				createdAt: patient.createdAt,
				estado: patient.estado,
				form,
				anexosClinicos,
			})

			updatePatient(patient.id, () => next)
			navigate(`/pacientes/${patient.id}`)
		} finally {
			setSaving(false)
		}
	}

	if (!patient) {
		return (
			<AppLayout breadcrumb="Pacientes / Editar" userName="Dra. Sofia Lima">
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
		<AppLayout breadcrumb={`Pacientes / ${patient.nome} / Editar`} userName="Dra. Sofia Lima">
			<div className="patients-content">
				<div className="patients-title-row">
					<div className="patients-title">
						<h1>Editar paciente</h1>
					</div>
					<div className="patients-title-actions">
						<button className="patient-btn-secondary" type="button" onClick={() => navigate(`/pacientes/${patient.id}`)}>
							Cancelar
						</button>
						<button
							type="submit"
							form="edit-patient-form"
							className="patient-btn-primary"
							disabled={saving}
						>
							{saving ? 'A guardar…' : 'Guardar'}
						</button>
					</div>
				</div>

				<form id="edit-patient-form" className="patient-form" onSubmit={onSubmit}>
					<details className="patient-form-section" open>
						<summary>Registo dos Pacientes — Identificação Pessoal</summary>
						<div className="patient-form-grid">
							<label className="patient-form-field">
								<span>Nome completo *</span>
								<input type="text" value={form.nomeCompleto} onChange={(e) => updateField('nomeCompleto', e.target.value)} required />
							</label>

							<label className="patient-form-field">
								<span>Data de nascimento</span>
								<input type="date" value={form.dataNascimento} onChange={(e) => updateField('dataNascimento', e.target.value)} />
							</label>

							<label className="patient-form-field">
								<span>Sexo</span>
								<select value={form.sexo} onChange={(e) => updateField('sexo', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Feminino">Feminino</option>
									<option value="Masculino">Masculino</option>
									<option value="Outro">Outro</option>
									<option value="Prefere não dizer">Prefere não dizer</option>
								</select>
							</label>

							<label className="patient-form-field patient-form-field-wide">
								<span>Endereço</span>
								<input type="text" value={form.endereco} onChange={(e) => updateField('endereco', e.target.value)} />
							</label>

							<label className="patient-form-field">
								<span>Contacto (telefone)</span>
								<input type="tel" value={form.contactoTelefone} onChange={(e) => updateField('contactoTelefone', e.target.value)} />
							</label>

							<label className="patient-form-field">
								<span>Contacto (email)</span>
								<input type="email" value={form.contactoEmail} onChange={(e) => updateField('contactoEmail', e.target.value)} />
							</label>

							<label className="patient-form-field">
								<span>Nº de utente (se aplicável)</span>
								<input type="text" value={form.numeroUtente} onChange={(e) => updateField('numeroUtente', e.target.value)} />
							</label>

							<label className="patient-form-field">
								<span>NIF</span>
								<input type="text" value={form.nif} onChange={(e) => updateField('nif', e.target.value)} />
							</label>

							<label className="patient-form-field patient-form-field-wide">
								<span>Subsistemas de saúde</span>
								<input type="text" value={form.subsistemasSaude} onChange={(e) => updateField('subsistemasSaude', e.target.value)} />
							</label>

							<label className="patient-form-field">
								<span>Estado civil</span>
								<select value={form.estadoCivil} onChange={(e) => updateField('estadoCivil', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Solteiro(a)">Solteiro(a)</option>
									<option value="Casado(a)">Casado(a)</option>
									<option value="União de facto">União de facto</option>
									<option value="Divorciado(a)">Divorciado(a)</option>
									<option value="Viúvo(a)">Viúvo(a)</option>
								</select>
							</label>

							<label className="patient-form-field">
								<span>Profissão</span>
								<input type="text" value={form.profissao} onChange={(e) => updateField('profissao', e.target.value)} />
							</label>
						</div>
					</details>

					<details className="patient-form-section">
						<summary>Histórico Médico Geral</summary>
						<div className="patient-form-grid">
							<label className="patient-form-field patient-form-field-wide">
								<span>Condições de saúde pré-existentes</span>
								<textarea rows={3} value={form.condicoesPreExistentes} onChange={(e) => updateField('condicoesPreExistentes', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Medicamentos em uso</span>
								<textarea rows={3} value={form.medicamentosEmUso} onChange={(e) => updateField('medicamentosEmUso', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Alergias conhecidas</span>
								<textarea rows={3} value={form.alergiasConhecidas} onChange={(e) => updateField('alergiasConhecidas', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Histórico cirúrgico relevante</span>
								<textarea rows={3} value={form.historicoCirurgico} onChange={(e) => updateField('historicoCirurgico', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Internações ou tratamentos importantes</span>
								<textarea rows={3} value={form.internacoesTratamentos} onChange={(e) => updateField('internacoesTratamentos', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Gravidez (quando aplicável)</span>
								<textarea rows={2} value={form.gravidez} onChange={(e) => updateField('gravidez', e.target.value)} />
							</label>
						</div>
					</details>

					<details className="patient-form-section">
						<summary>Histórico Dentário</summary>
						<div className="patient-form-grid">
							<label className="patient-form-field patient-form-field-wide">
								<span>Motivo da consulta inicial</span>
								<textarea rows={2} value={form.motivoConsultaInicial} onChange={(e) => updateField('motivoConsultaInicial', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Condições dentárias pré-existentes</span>
								<textarea rows={3} value={form.condicoesDentarias} onChange={(e) => updateField('condicoesDentarias', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Tratamentos dentários passados</span>
								<textarea rows={3} value={form.historicoTratamentosDentarios} onChange={(e) => updateField('historicoTratamentosDentarios', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Experiência com anestesias</span>
								<textarea rows={2} value={form.experienciaAnestesias} onChange={(e) => updateField('experienciaAnestesias', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Dor/desconforto/sensibilidade</span>
								<textarea rows={2} value={form.historicoDorSensibilidade} onChange={(e) => updateField('historicoDorSensibilidade', e.target.value)} />
							</label>
						</div>
					</details>

					<details className="patient-form-section">
						<summary>Hábitos e Estilo de Vida</summary>
						<div className="patient-form-grid">
							<label className="patient-form-field patient-form-field-wide">
								<span>Hábitos de higiene oral</span>
								<textarea rows={3} value={form.habitosHigieneOral} onChange={(e) => updateField('habitosHigieneOral', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Hábitos alimentares</span>
								<textarea rows={3} value={form.habitosAlimentares} onChange={(e) => updateField('habitosAlimentares', e.target.value)} />
							</label>

							<label className="patient-form-field">
								<span>Tabaco</span>
								<select value={form.consumoTabaco} onChange={(e) => updateField('consumoTabaco', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Não">Não</option>
									<option value="Ocasional">Ocasional</option>
									<option value="Regular">Regular</option>
								</select>
							</label>
							<label className="patient-form-field">
								<span>Álcool</span>
								<select value={form.consumoAlcool} onChange={(e) => updateField('consumoAlcool', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Não">Não</option>
									<option value="Ocasional">Ocasional</option>
									<option value="Regular">Regular</option>
								</select>
							</label>
							<label className="patient-form-field">
								<span>Drogas</span>
								<select value={form.consumoDrogas} onChange={(e) => updateField('consumoDrogas', e.target.value)}>
									<option value="">Selecionar…</option>
									<option value="Não">Não</option>
									<option value="Ocasional">Ocasional</option>
									<option value="Regular">Regular</option>
								</select>
							</label>

							<label className="patient-form-field patient-form-checkbox">
								<input type="checkbox" checked={!!form.bruxismo} onChange={(e) => updateField('bruxismo', e.target.checked)} />
								<span>Bruxismo (aperto/ranger)</span>
							</label>

							<label className="patient-form-field patient-form-field-wide">
								<span>Atividades desportivas</span>
								<textarea rows={2} value={form.atividadesDesportivas} onChange={(e) => updateField('atividadesDesportivas', e.target.value)} />
							</label>
						</div>
					</details>

					<details className="patient-form-section">
						<summary>Anexar exames clínicos</summary>
						<div className="patient-form-grid">
							<label className="patient-form-field patient-form-field-wide">
								<span>Ficheiros</span>
								<input type="file" multiple onChange={onPickFiles} />
								{files.length ? (
									<ul className="patient-form-files" aria-label="Ficheiros selecionados">
										{files.map((f) => (
											<li key={f.name}>{f.name}</li>
										))}
									</ul>
								) : (
									<div className="patient-form-help">Ainda não selecionaste ficheiros.</div>
								)}
							</label>
						</div>
					</details>

					<details className="patient-form-section">
						<summary>Tratamentos anteriores e resultados</summary>
						<div className="patient-form-grid">
							<label className="patient-form-field patient-form-field-wide">
								<span>Histórico de tratamentos</span>
								<textarea rows={3} value={form.historicoTratamentos} onChange={(e) => updateField('historicoTratamentos', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Resultados de tratamentos anteriores</span>
								<textarea rows={3} value={form.resultadosTratamentos} onChange={(e) => updateField('resultadosTratamentos', e.target.value)} />
							</label>
							<label className="patient-form-field patient-form-field-wide">
								<span>Planos de tratamento</span>
								<textarea rows={3} value={form.planosTratamento} onChange={(e) => updateField('planosTratamento', e.target.value)} />
							</label>
						</div>
					</details>

					<details className="patient-form-section">
						<summary>Observações adicionais</summary>
						<div className="patient-form-grid">
							<label className="patient-form-field patient-form-field-wide">
								<span>Notas</span>
								<textarea rows={4} value={form.observacoesAdicionais} onChange={(e) => updateField('observacoesAdicionais', e.target.value)} />
							</label>
						</div>
					</details>
				</form>
			</div>
		</AppLayout>
	)
}
