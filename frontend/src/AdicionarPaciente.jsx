import React, { useMemo, useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import { buildPatientRecordFromForm, createEmptyPatientForm, upsertPatient, createPacienteApi } from './utils/patientStorage'
import { syncPatientsFromApi } from './utils/dataSync'
import { uploadClinicalFile } from './utils/clinicalFilesApi'
import { isValidName, isValidNif, isValidNumeroUtente, isValidPhone, sanitizeDigits, sanitizeName, sanitizePhone } from './utils/validation'

export default function AdicionarPaciente() {
	const navigate = useNavigate()
	const [files, setFiles] = useState([])
	const [saving, setSaving] = useState(false)

	const [form, setForm] = useState(() => createEmptyPatientForm())

	const fileNames = useMemo(() => files.map((f) => f.name), [files])

	function updateField(name, value) {
		if (name === 'nomeCompleto') {
			setForm((prev) => ({ ...prev, [name]: sanitizeName(value) }))
			return
		}
		if (name === 'contactoTelefone') {
			setForm((prev) => ({ ...prev, [name]: sanitizePhone(value) }))
			return
		}
		if (name === 'numeroUtente') {
			setForm((prev) => ({ ...prev, [name]: sanitizeDigits(value, { maxDigits: 9 }) }))
			return
		}
		if (name === 'nif') {
			setForm((prev) => ({ ...prev, [name]: sanitizeDigits(value, { maxDigits: 9 }) }))
			return
		}
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	function onPickFiles(event) {
		const list = Array.from(event.target.files || [])
		setFiles(list)
	}

	async function onSubmit(e) {
		e.preventDefault()
		if (saving) return

		const nome = sanitizeName(form.nomeCompleto).trim()
		updateField('nomeCompleto', nome)
		if (!isValidName(nome)) {
			alert('Por favor, preenche o Nome completo.')
			return
		}

		const telefone = sanitizePhone(form.contactoTelefone).trim()
		updateField('contactoTelefone', telefone)
		if (!isValidPhone(telefone)) {
			alert('Por favor, preenche o Contacto (telefone).')
			return
		}

		const numeroUtente = sanitizeDigits(form.numeroUtente, { maxDigits: 9 })
		updateField('numeroUtente', numeroUtente)
		if (!isValidNumeroUtente(numeroUtente)) {
			alert('Nº de utente inválido (máx. 9 dígitos).')
			return
		}

		const nif = sanitizeDigits(form.nif, { maxDigits: 9 })
		updateField('nif', nif)
		if (!isValidNif(nif)) {
			alert('NIF inválido (obrigatório e com 9 dígitos).')
			return
		}

		const email = String(form.contactoEmail || '').trim()
		if (!email) {
			alert('Por favor, preenche o Contacto (email).')
			return
		}

		const password = String(form.password || '').trim()
		if (!password) {
			alert('Por favor, preenche a Password.')
			return
		}
		if (password.length < 6) {
			alert('A password deve ter pelo menos 6 caracteres.')
			return
		}
		if (String(form.confirmPassword || '') !== password) {
			alert('As passwords não coincidem.')
			return
		}

		setSaving(true)
		try {
			const created = await createPacienteApi({ form })
			const createdId = created?.id != null ? String(created.id) : ''
			if (!createdId) throw new Error('Resposta inválida do servidor ao criar utente')

			// Upload de anexos clínicos (se existirem). Nota: requer permissões no backend.
			if (files.length) {
				await Promise.allSettled(
					files.map((file) => uploadClinicalFile({ patientId: createdId, file, kind: 'anexo_clinico' }))
				)
			}

			const patient = buildPatientRecordFromForm({
				id: createdId,
				createdAt: created?.data_inscricao || undefined,
				estado: created?.ativo === false ? 'Inativo' : 'Ativo',
				form,
				anexosClinicos: fileNames,
			})
			upsertPatient(patient)

			try {
				await syncPatientsFromApi()
			} catch {
				// ignore
			}

			navigate(`/pacientes/${createdId}`)
		} catch (e) {
			console.error(e)
			alert(e?.message || 'Erro ao criar utente')
		} finally {
			setSaving(false)
		}
	}

	return (
		<AppLayout breadcrumb="Utentes / Adicionar" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Adicionar utente"
					actions={
						<>
							<button type="button" className="btn btn-secondary" onClick={() => navigate('/pacientes')}>
								Cancelar
							</button>
							<button type="submit" form="add-patient-form" className="btn btn-primary" disabled={saving}>
								{saving ? 'A guardar…' : 'Guardar'}
							</button>
						</>
					}
				/>

				<form id="add-patient-form" className="d-grid gap-3" onSubmit={onSubmit}>
					<details className="ui-card p-3 patient-details" open>
						<summary
							className="fw-bold"
							style={{ color: 'rgba(30, 42, 53, 0.92)' }}
						>
							Registo dos Utentes — Identificação Pessoal
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
								<input className="form-control" type="tel" value={form.contactoTelefone} onChange={(e) => updateField('contactoTelefone', e.target.value)} placeholder="Ex: 912345678" required />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Contacto (email)
								</label>
								<input className="form-control" type="email" value={form.contactoEmail} onChange={(e) => updateField('contactoEmail', e.target.value)} placeholder="nome@exemplo.com" />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Password *
								</label>
								<input className="form-control" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} autoComplete="new-password" required />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Confirmar password *
								</label>
								<input className="form-control" type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} autoComplete="new-password" required />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									Nº de utente (se aplicável)
								</label>
								<input className="form-control" type="text" inputMode="numeric" value={form.numeroUtente} onChange={(e) => updateField('numeroUtente', e.target.value)} maxLength={9} />
							</div>

							<div className="col-12 col-md-6">
								<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
									NIF *
								</label>
								<input className="form-control" type="text" inputMode="numeric" value={form.nif} onChange={(e) => updateField('nif', e.target.value)} maxLength={9} required />
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
									<input className="form-check-input" type="checkbox" checked={form.bruxismo} onChange={(e) => updateField('bruxismo', e.target.checked)} id="add-patient-bruxismo" />
									<label className="form-check-label" htmlFor="add-patient-bruxismo" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
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
