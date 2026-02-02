import { apiFetch, getAuthToken } from './apiClient'
import { loadAppointments, saveAppointments } from './appointmentStorage'
import { savePatients, loadPatients } from './patientStorage'
import { saveTreatmentPlans, loadTreatmentPlans } from './treatmentPlansStorage'

const MIGRATION_KEY = 'gestorClinica.apiCache.v2'
const LAST_SYNC_WARNINGS_KEY = 'gestorClinica.lastSyncWarnings'

function recordSyncWarning(entry) {
	try {
		const prevRaw = localStorage.getItem(LAST_SYNC_WARNINGS_KEY)
		const prevParsed = prevRaw ? JSON.parse(prevRaw) : null
		const prev = Array.isArray(prevParsed) ? prevParsed : []
		const next = [entry, ...prev].slice(0, 5)
		localStorage.setItem(LAST_SYNC_WARNINGS_KEY, JSON.stringify(next))
	} catch {
		// ignore
	}
}

function ensureMigratedOnce() {
	const done = localStorage.getItem(MIGRATION_KEY)
	if (done) return
	// Limpa caches antigas (incluíam DEMO/MOCK/local apenas)
	localStorage.removeItem('gestorClinica.consultas')
	localStorage.removeItem('gestorClinica.pacientes')
	localStorage.removeItem('gestorClinica.planosTratamento')
	localStorage.removeItem('gestorClinica.colaboradores')
	localStorage.setItem(MIGRATION_KEY, new Date().toISOString())
}

function mapStatusFromApi(status) {
	const s = String(status || '').trim().toLowerCase()
	if (!s) return 'a_confirmar'
	if (s === 'pendente') return 'a_confirmar'
	if (s === 'confirmada') return 'confirmada'
	if (s === 'cancelada') return 'cancelada'
	if (s === 'remarcada') return 'remarcada'
	if (s === 'falta') return 'falta'
	return 'a_confirmar'
}

function mapBookingTypeFromApi(tipo) {
	const t = String(tipo || '').trim().toLowerCase()
	if (t === 'rotina' || t === 'urgente' || t === 'vaga') return t
	return 'vaga'
}

function hhmmFromTime(t) {
	if (!t) return '00:00'
	const s = String(t).trim()
	// suporta: 'HH:MM', 'HH:MM:SS', 'HH:MM:SS+00', etc.
	const m = s.match(/^(\d{2}:\d{2})/)
	if (m) return m[1]
	// fallback defensivo
	return s.slice(0, 5)
}

function normalizeDateOnly(dateOnly) {
	if (!dateOnly) return null
	// Sequelize DATEONLY costuma vir como 'YYYY-MM-DD'; outras fontes podem vir Date ou ISO string
	if (dateOnly instanceof Date) {
		if (Number.isNaN(dateOnly.getTime())) return null
		return dateOnly.toISOString().slice(0, 10)
	}
	const s = String(dateOnly).trim()
	if (!s) return null
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
	if (s.includes('T') && s.length >= 10) return s.slice(0, 10)
	// suporta 'DD/MM/YYYY'
	const dmY = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
	if (dmY) {
		const [, dd, mm, yyyy] = dmY
		return `${yyyy}-${mm}-${dd}`
	}
	// último recurso
	try {
		const d = new Date(s)
		if (Number.isNaN(d.getTime())) return null
		return d.toISOString().slice(0, 10)
	} catch {
		return null
	}
}

function buildStartISO(dateOnly, time) {
	const datePart = normalizeDateOnly(dateOnly)
	if (!datePart) return null
	const hhmm = hhmmFromTime(time)
	const d = new Date(`${datePart}T${hhmm}:00`)
	if (Number.isNaN(d.getTime())) return null
	return d.toISOString()
}

function addMinutesISO(iso, minutes) {
	if (!iso) return null
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return null
	return new Date(d.getTime() + Number(minutes || 0) * 60000).toISOString()
}

function patientsMapById() {
	const m = new Map()
	for (const p of loadPatients()) {
		if (!p?.id) continue
		m.set(String(p.id), p)
	}
	return m
}

function colaboradoresMapById() {
	const m = new Map()
	try {
		const raw = localStorage.getItem('gestorClinica.colaboradores')
		const parsed = raw ? JSON.parse(raw) : []
		const list = Array.isArray(parsed) ? parsed : []
		for (const c of list) {
			const id = String(c?.id || '').trim()
			if (!id) continue
			m.set(id, c)
		}
	} catch {
		// ignore
	}
	return m
}

export async function syncPatientsFromApi() {
	const token = getAuthToken()
	if (!token) return { count: 0 }

	const existing = loadPatients()
	const existingById = new Map(existing.map((p) => [String(p?.id || ''), p]).filter((x) => x[0]))

	const data = await apiFetch('/utilizadores')
	const users = Array.isArray(data?.utilizadores) ? data.utilizadores : []

	const patients = users.map((u) => {
		const id = String(u.id)
		const prev = existingById.get(id)
		const prevData = prev?.data && typeof prev.data === 'object' ? prev.data : {}
		return {
			...(prev || {}),
			id,
			nome: u.nome,
			telefone: u.telefone || '',
			email: u.email || '',
			responsavelId: null,
			estado: u.ativo ? 'Ativo' : 'Inativo',
			createdAt: prev?.createdAt || u.data_inscricao || new Date().toISOString(),
			updatedAt: u.data_inscricao || prev?.updatedAt || new Date().toISOString(),
			data: {
				...prevData,
				contactoTelefone: u.telefone || prevData.contactoTelefone || '',
				contactoEmail: u.email || prevData.contactoEmail || '',
				nomeCompleto: u.nome || prevData.nomeCompleto || '',
			},
		}
	})

	// Dependentes
	const depRes = await apiFetch('/dependentes').catch(() => null)
	const dependentes = Array.isArray(depRes?.dependentes) ? depRes.dependentes : []
	const depsAsPatients = dependentes.map((d) => {
		const id = `D${d.id_dependente}`
		const prev = existingById.get(id)
		const prevData = prev?.data && typeof prev.data === 'object' ? prev.data : {}
		return {
			...(prev || {}),
			id,
			nome: d.nome,
			telefone: '',
			email: '',
			responsavelId: d.id ? String(d.id) : null,
			estado: d.ativo ? 'Ativo' : 'Inativo',
			createdAt: prev?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			data: {
				...prevData,
				responsavelId: d.id ? String(d.id) : null,
				dataNascimento: d.data_nascimento || prevData.dataNascimento || '',
			},
		}
	})

	const merged = [...patients, ...depsAsPatients]
	savePatients(merged)
	return { count: merged.length }
}

export async function syncConsultasFromApi() {
	const token = getAuthToken()
	if (!token) return { count: 0 }

	const existing = loadAppointments()
	const existingById = new Map(existing.map((c) => [String(c?.id || ''), c]).filter((x) => x[0]))

	const data = await apiFetch('/consultas')
	const consultas = Array.isArray(data?.consultas) ? data.consultas : []
	const pMap = patientsMapById()
	const cMap = colaboradoresMapById()
	const invalidDateItems = []

	const mapped = consultas.map((c) => {
		const id = String(c.id_consulta)
		const prev = existingById.get(id)
		const startISO = buildStartISO(c.data_consulta, c.hora) || prev?.startISO || null
		const durationMin = Number(c.duracao || 30)
		const endISO = addMinutesISO(startISO, durationMin) || prev?.endISO || null
		if (!startISO || !endISO) {
			invalidDateItems.push({
				id_consulta: c.id_consulta,
				data_consulta: c.data_consulta,
				hora: c.hora,
				id_medico: c.id_medico,
			})
		}
		const patientId = c.id != null ? String(c.id) : ''
		const patientName = pMap.get(patientId)?.nome || ''
		const medicoIdStr = c.id_medico != null ? String(c.id_medico) : ''
		const medico = medicoIdStr ? cMap.get(medicoIdStr) : null
		const medicoName = String(c.medico_nome || c.medicoName || prev?.medicoName || medico?.name || '').trim()
		const specialty = String(c.especialidade || c.specialty || prev?.specialty || 'Clínica Geral').trim() || 'Clínica Geral'

		return {
			...(prev || {}),
			id,
			patientId,
			patientName,
			dependentName: '',
			treatmentPlanId: c.id_tratamento != null ? String(c.id_tratamento) : (prev?.treatmentPlanId || ''),
			notes: (c.notas_internas != null ? String(c.notas_internas) : '') || prev?.notes || '',
			specialty,
			medicoId: Number(c.id_medico || 0) || 0,
			medicoName,
			bookingType: mapBookingTypeFromApi(c.tipo_de_marcacao),
			bookingStatus: mapStatusFromApi(c.status),
			firstVisitReason: (c.razao_consulta != null ? String(c.razao_consulta) : '') || prev?.firstVisitReason || '',
			durationMin,
			startISO,
			endISO,
			createdAt: prev?.createdAt || new Date().toISOString(),
		}
	})

	// evita guardar items sem data válida (não renderizam e podem quebrar filtros)
	const safe = mapped.filter((a) => a?.id && a?.startISO && a?.endISO)
	if (invalidDateItems.length > 0) {
		const entry = {
			kind: 'syncConsultasFromApi.invalidDate',
			at: new Date().toISOString(),
			received: consultas.length,
			saved: safe.length,
			ignored: invalidDateItems.length,
			samples: invalidDateItems.slice(0, 10),
		}
		recordSyncWarning(entry)
		// Log discreto: apenas quando há problema
		console.warn(
			`[gestorClinica] syncConsultasFromApi: ignorou ${entry.ignored}/${entry.received} consultas por data/hora inválida. Vê localStorage '${LAST_SYNC_WARNINGS_KEY}'.`,
			entry.samples,
		)
	}
	saveAppointments(safe)
	return { count: safe.length }
}

export async function syncTreatmentPlansFromApi() {
	const token = getAuthToken()
	if (!token) return { count: 0 }

	const existing = loadTreatmentPlans()
	const existingById = new Map(existing.map((p) => [String(p?.id || ''), p]).filter((x) => x[0]))

	const data = await apiFetch('/plano')
	const planos = Array.isArray(data?.planos) ? data.planos : []
	const pMap = patientsMapById()

	const mapped = planos.map((p) => {
		const id = String(p.id_tratamento)
		const prev = existingById.get(id)
		const pid = p.id != null ? String(p.id) : ''
		const depId = p.dependent_id != null ? String(p.dependent_id) : ''
		return {
			...(prev || {}),
			id,
			patientId: pid,
			patientName: pMap.get(pid)?.nome || '',
			dependentId: depId,
			dependentName: depId ? pMap.get(depId)?.nome || '' : '',
			data_inicio: p.data_inicio ? String(p.data_inicio).slice(0, 10) : '',
			data_fim: p.data_fim ? String(p.data_fim).slice(0, 10) : '',
			descricao: p.descricao || '',
			status: String(p.status || 'ativo').toLowerCase(),
			history: Array.isArray(prev?.history) ? prev.history : [],
			createdAt: prev?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
	})

	saveTreatmentPlans(mapped)
	return { count: mapped.length }
}

export async function syncColaboradoresFromApi() {
	const token = getAuthToken()
	if (!token) return { count: 0 }

	const data = await apiFetch('/gestores')
	const gestores = Array.isArray(data?.gestores) ? data.gestores : []
	const cargoLabel = (tipo) => {
		const v = String(tipo || '').trim().toLowerCase()
		if (v === 'admin') return 'Admin'
		if (v === 'medico' || v === 'médico') return 'Médico'
		if (v === 'secretaria' || v === 'recepcionista') return 'Secretaria'
		return 'Colaborador'
	}
	const mapped = gestores.map((g) => ({
		id: String(g.id),
		name: g.nome,
		email: g.email,
		phone: g.telefone || '',
		tipo: String(g.tipo || '').trim().toLowerCase(),
		cargo: cargoLabel(g.tipo),
		status: g.ativo ? 'ativo' : 'inativo',
	}))
	localStorage.setItem('gestorClinica.colaboradores', JSON.stringify(mapped))
	return { count: mapped.length }
}

export async function syncAllFromApi() {
	ensureMigratedOnce()
	const token = getAuthToken()
	if (!token) return { ok: false, reason: 'no-token' }

	// ordem: pacientes -> consultas/plano -> colaboradores
	await syncPatientsFromApi().catch(() => {})
	await syncColaboradoresFromApi().catch(() => {})
	await Promise.allSettled([syncConsultasFromApi(), syncTreatmentPlansFromApi()])
	return { ok: true }
}
