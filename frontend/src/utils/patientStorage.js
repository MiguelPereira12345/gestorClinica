import { apiFetch } from './apiClient'

const STORAGE_KEY = 'gestorClinica.pacientes'

function normalizePhone(value) {
	if (!value) return ''
	return String(value)
		.trim()
		.replace(/[^0-9+]/g, '')
}

function phoneDigits(value) {
	return normalizePhone(value).replace(/\D/g, '')
}

function safeParse(json) {
	try {
		return JSON.parse(json)
	} catch {
		return null
	}
}

export function isDependentPatientId(id) {
	return typeof id === 'string' && /^D\d+$/.test(id)
}

export function dependentNumericId(id) {
	if (!isDependentPatientId(id)) return null
	return Number(String(id).slice(1))
}

function normalizeEmail(value) {
	return String(value || '').trim().toLowerCase()
}

function buildPacienteApiPayloadFromForm(form) {
	const nome = String(form?.nomeCompleto || '').trim()
	const telefone = String(form?.contactoTelefone || '').trim()
	const email = normalizeEmail(form?.contactoEmail)
	const senha = String(form?.password || '').trim()

	if (!nome) throw new Error('Nome completo em falta')
	if (!telefone) throw new Error('Telefone em falta')
	if (!email) throw new Error('Email em falta')
	if (!senha) throw new Error('Password em falta')

	return {
		nome,
		email,
		telefone,
		senha,
		sexo: form?.sexo || null,
		endereco: form?.endereco || null,
		nif: form?.nif || null,
		data_nascimento: form?.dataNascimento || null,
		numero_utente: form?.numeroUtente || null,
	}
}

function buildDependenteApiPayloadFromForm(form, responsavelId) {
	const nome = String(form?.nomeCompleto || '').trim()
	const data_nascimento = String(form?.dataNascimento || '').trim()
	const id = Number(responsavelId)
	if (!nome) throw new Error('Nome completo do dependente em falta')
	if (!data_nascimento) throw new Error('Data de nascimento do dependente em falta')
	if (!Number.isFinite(id) || !id) throw new Error('Responsável inválido')
	return {
		nome,
		data_nascimento,
		sexo: form?.sexo || null,
		nif: form?.nif || null,
		numero_utente: form?.numeroUtente || null,
		ativo: true,
		id,
	}
}

export async function createPacienteApi({ form } = {}) {
	const payload = buildPacienteApiPayloadFromForm(form)
	const data = await apiFetch('/utilizadores', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	return data?.utilizador || null
}

export async function updatePacienteApi({ id, form } = {}) {
	const payload = buildPacienteApiPayloadFromForm(form)
	const data = await apiFetch(`/utilizadores/${encodeURIComponent(String(id))}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	return data?.utilizador || data?.user || data?.data || null
}

export async function deletePacienteApi(id) {
	await apiFetch(`/utilizadores/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
	return true
}

export async function createDependenteApi({ form, responsavelId } = {}) {
	const payload = buildDependenteApiPayloadFromForm(form, responsavelId)
	const data = await apiFetch('/dependentes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	return data?.dependente || null
}

export async function updateDependenteApi({ dependentId, form } = {}) {
	const depIdNum = dependentNumericId(String(dependentId))
	if (!depIdNum) throw new Error('Dependente inválido')

	const payload = {
		nome: String(form?.nomeCompleto || '').trim(),
		data_nascimento: String(form?.dataNascimento || '').trim(),
		sexo: form?.sexo || null,
		nif: form?.nif || null,
		numero_utente: form?.numeroUtente || null,
		ativo: true,
	}

	if (!payload.nome) throw new Error('Nome completo do dependente em falta')
	if (!payload.data_nascimento) throw new Error('Data de nascimento do dependente em falta')

	const data = await apiFetch(`/dependentes/${depIdNum}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	return data?.dependente || null
}

export async function deleteDependenteApi(dependentId) {
	const depIdNum = dependentNumericId(String(dependentId))
	if (!depIdNum) throw new Error('Dependente inválido')
	await apiFetch(`/dependentes/${depIdNum}`, { method: 'DELETE' })
	return true
}

export function loadPatients() {
	const raw = localStorage.getItem(STORAGE_KEY)
	const parsed = safeParse(raw)
	return Array.isArray(parsed) ? parsed : []
}

export function savePatients(patients) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(patients))
}

export function getPatientById(id) {
	return loadPatients().find((p) => p?.id === id) || null
}

export function getEffectivePhone(patient, allPatients = null) {
	if (!patient) return ''
	const own = patient?.telefone || patient?.data?.contactoTelefone || ''
	if (own && String(own).trim()) return String(own).trim()
	const responsavelId = patient?.responsavelId || patient?.data?.responsavelId
	if (!responsavelId) return ''
	const list = Array.isArray(allPatients) ? allPatients : loadPatients()
	const responsavel = list.find((p) => p?.id === responsavelId)
	const inherited = responsavel?.telefone || responsavel?.data?.contactoTelefone || ''
	return inherited ? String(inherited).trim() : ''
}

export function getDependentsOf(responsavelId, allPatients = null) {
	const list = Array.isArray(allPatients) ? allPatients : loadPatients()
	return list.filter((p) => (p?.responsavelId || p?.data?.responsavelId) === responsavelId)
}

export function matchesNameOrPhone(patient, query, allPatients = null) {
	const q = String(query || '').trim()
	if (!q) return true
	const qLower = q.toLowerCase()

	const nome = String(patient?.nome || '').toLowerCase()
	if (nome.includes(qLower)) return true

	const qDigits = phoneDigits(q)
	if (!qDigits) return false
	const effective = getEffectivePhone(patient, allPatients)
	const effectiveDigits = phoneDigits(effective)
	return effectiveDigits.includes(qDigits)
}

export function upsertPatient(patient) {
	const patients = loadPatients()
	const idx = patients.findIndex((p) => p?.id === patient?.id)
	if (idx >= 0) {
		patients[idx] = patient
	} else {
		patients.unshift(patient)
	}
	savePatients(patients)
	return patient
}

export function updatePatient(id, updater) {
	const patients = loadPatients()
	const idx = patients.findIndex((p) => p?.id === id)
	if (idx < 0) return null

	const updated = updater(patients[idx])
	patients[idx] = updated
	savePatients(patients)
	return updated
}

export function removePatient(id) {
	const patients = loadPatients()
	const next = patients.filter((p) => p?.id !== id)
	savePatients(next)
	return next.length !== patients.length
}

export function createEmptyPatientForm() {
	return {
		// (a) Identificação Pessoal
		nomeCompleto: '',
		dataNascimento: '',
		sexo: '',
		endereco: '',
		contactoTelefone: '',
		contactoEmail: '',
		password: '',
		confirmPassword: '',
		responsavelId: '',
		numeroUtente: '',
		nif: '',
		subsistemasSaude: '',
		estadoCivil: '',
		profissao: '',

		// (b) Histórico Médico Geral
		condicoesPreExistentes: '',
		medicamentosEmUso: '',
		alergiasConhecidas: '',
		historicoCirurgico: '',
		internacoesTratamentos: '',
		gravidez: '',

		// (c) Histórico Dentário
		motivoConsultaInicial: '',
		condicoesDentarias: '',
		historicoTratamentosDentarios: '',
		experienciaAnestesias: '',
		historicoDorSensibilidade: '',

		// (d) Hábitos e Estilo de Vida
		habitosHigieneOral: '',
		habitosAlimentares: '',
		consumoTabaco: '',
		consumoAlcool: '',
		consumoDrogas: '',
		bruxismo: false,
		atividadesDesportivas: '',

		// (f) Tratamentos Anteriores e Resultados
		historicoTratamentos: '',
		resultadosTratamentos: '',
		planosTratamento: '',

		// (g) Observações Adicionais
		observacoesAdicionais: '',
	}
}

export function patientToForm(patient) {
	const base = createEmptyPatientForm()
	const data = patient?.data || {}
	return {
		...base,
		...data,
		// manter compatibilidade com o que guardamos na criação
		nomeCompleto: data.nomeCompleto || patient?.nome || base.nomeCompleto,
		contactoEmail: data.contactoEmail || patient?.email || base.contactoEmail,
		contactoTelefone: data.contactoTelefone || patient?.telefone || base.contactoTelefone,
		responsavelId: data.responsavelId || patient?.responsavelId || base.responsavelId,
	}
}

export function buildPatientRecordFromForm({
	id,
	createdAt,
	estado,
	form,
	anexosClinicos,
}) {
	const now = new Date().toISOString()
	const nome = (form?.nomeCompleto || '').trim()
	const email = (form?.contactoEmail || '').trim()
	const telefone = (form?.contactoTelefone || '').trim()
	const responsavelId = (form?.responsavelId || '').trim()

	return {
		id: id || `P${Date.now()}`,
		nome,
		telefone: telefone || '',
		email: email || '',
		responsavelId: responsavelId || null,
		estado: estado || 'Ativo',
		createdAt: createdAt || now,
		updatedAt: now,
		data: {
			...form,
			responsavelId: responsavelId || null,
			anexosClinicos: Array.isArray(anexosClinicos) ? anexosClinicos : [],
		},
	}
}
