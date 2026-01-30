const STORAGE_KEY = 'gestorClinica.pacientes'

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

	return {
		id: id || `P${Date.now()}`,
		nome,
		email,
		estado: estado || 'Ativo',
		createdAt: createdAt || now,
		updatedAt: now,
		data: {
			...form,
			anexosClinicos: Array.isArray(anexosClinicos) ? anexosClinicos : [],
		},
	}
}
