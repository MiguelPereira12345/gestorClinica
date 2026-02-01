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
