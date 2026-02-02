import {
	buildAppointmentRecord,
	loadAppointments,
	saveAppointments,
	removeAppointment,
	upsertAppointment,
} from './appointmentStorage'

import { addMinutesISO, parseISOToDate } from './dateTime'
import { apiFetch } from './apiClient'
import { syncConsultasFromApi, syncPatientsFromApi } from './dataSync'

function pad2(value) {
	return String(value).padStart(2, '0')
}

function toApiStatus(bookingStatus) {
	const s = String(bookingStatus || '').trim().toLowerCase()
	if (s === 'confirmada') return 'Confirmada'
	if (s === 'cancelada') return 'Cancelada'
	if (s === 'remarcada') return 'Remarcada'
	if (s === 'falta') return 'Falta'
	return 'Pendente'
}

function toApiTipoMarcacao(bookingType) {
	const t = String(bookingType || '').trim().toLowerCase()
	if (t === 'rotina' || t === 'urgente' || t === 'vaga') return t
	return 'vaga'
}

function dateAndTimeFromISO(iso) {
	const d = parseISOToDate(iso)
	if (!d) return { data_consulta: null, hora: null }
	const data_consulta = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
	const hora = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
	return { data_consulta, hora }
}

function parseNumericId(value) {
	const n = Number(String(value || '').trim())
	return Number.isFinite(n) && n > 0 ? n : null
}

export const CONSULTA_STATUS = [
	{ id: 'confirmada', label: 'Confirmada' },
	{ id: 'a_confirmar', label: 'Em espera' },
	{ id: 'cancelada', label: 'Cancelada' },
	{ id: 'remarcada', label: 'Remarcada' },
	{ id: 'falta', label: 'Falta' },
]

export const TIPO_MARCACAO = [
	{ id: 'rotina', label: 'Rotina' },
	{ id: 'urgente', label: 'Urgente' },
	{ id: 'vaga', label: 'Vaga' },
]

export const DURACOES_MIN = [30, 45, 60]

function normalizeStatus(status) {
	const s = String(status || '').trim().toLowerCase()
	if (!s) return 'a_confirmar'
	if (s === 'pendente' || s === 'por confirmar') return 'a_confirmar'
	if (s === 'confirmada') return 'confirmada'
	if (s === 'cancelada') return 'cancelada'
	if (s === 'remarcada') return 'remarcada'
	if (s === 'falta' || s === 'nao_compareceu' || s === 'não compareceu') return 'falta'
	if (CONSULTA_STATUS.some((x) => x.id === s)) return s
	return 'a_confirmar'
}

export function statusLabel(status) {
	return CONSULTA_STATUS.find((x) => x.id === normalizeStatus(status))?.label || 'Em espera'
}

export function isConsultaConfirmada(status) {
	return normalizeStatus(status) === 'confirmada'
}

export function isConsultaCancelada(status) {
	return normalizeStatus(status) === 'cancelada'
}

export function confirmationLabel(confirmed) {
	return confirmed ? 'Confirmado' : 'Pendente'
}

export function consultaEstadoLabel(status) {
	if (typeof status === 'boolean') return status ? 'Confirmado' : 'Pendente'
	if (isConsultaCancelada(status)) return 'Cancelado'
	return isConsultaConfirmada(status) ? 'Confirmado' : 'Pendente'
}

export function getStoredConsultas() {
	return loadAppointments()
}

export function hasStoredConsulta(id) {
	return getStoredConsultas().some((c) => c?.id === id)
}

export function listConsultas({
	filters = {},
	page = 1,
	pageSize = 10,
} = {}) {
	const all = getStoredConsultas()

	const qPatient = String(filters.patient || '').trim().toLowerCase()
	const qProfessional = String(filters.professional || '').trim().toLowerCase()
	const qDate = String(filters.date || '').trim() // yyyy-mm-dd
	const qStatus = String(filters.status || '').trim().toLowerCase()
	const qBookingType = String(filters.bookingType || '').trim().toLowerCase()

	let items = all
		.filter((c) => {
			if (qPatient) {
				const hay = `${c.patientName || ''} ${c.patientId || ''}`.toLowerCase()
				if (!hay.includes(qPatient)) return false
			}
			if (qProfessional) {
				const hay = `${c.medicoName || ''} ${c.medicoId || ''}`.toLowerCase()
				if (!hay.includes(qProfessional)) return false
			}
			if (qDate) {
				const d = parseISOToDate(c.startISO)
				if (!d) return false
				const iso = d.toISOString().slice(0, 10)
				if (iso !== qDate) return false
			}
			if (qStatus) {
				// Suporta filtro booleano (Confirmado/Pendente) e compatibilidade com estados antigos.
				if (qStatus === 'true' || qStatus === 'false') {
					const confirmed = isConsultaConfirmada(c.bookingStatus)
					if (qStatus === 'true' && !confirmed) return false
					if (qStatus === 'false' && confirmed) return false
				} else if (qStatus === 'cancelada') {
					if (normalizeStatus(c.bookingStatus) !== 'cancelada') return false
				} else {
					if (normalizeStatus(c.bookingStatus) !== normalizeStatus(qStatus)) return false
				}
			}
			if (qBookingType) {
				if (String(c.bookingType || '').toLowerCase() !== qBookingType) return false
			}
			return true
		})
		.sort((a, b) => {
			const aKey = String(a.startISO || '')
			const bKey = String(b.startISO || '')
			return aKey.localeCompare(bKey)
		})

	const total = items.length
	const safePageSize = Math.max(1, Number(pageSize || 10))
	const maxPage = Math.max(1, Math.ceil(total / safePageSize))
	const safePage = Math.min(Math.max(1, Number(page || 1)), maxPage)
	const start = (safePage - 1) * safePageSize
	items = items.slice(start, start + safePageSize)

	return { items, total, page: safePage, pageSize: safePageSize, maxPage }
}

export function getConsultaById(id) {
	if (!id) return null
	return getStoredConsultas().find((c) => c?.id === id) || null
}

export function ensureConsultaStored(id) {
	return getStoredConsultas().find((c) => c?.id === id) || null
}

export async function createConsulta(payload) {
	const durationMin = Number(payload?.durationMin || 30)
	const startISO = payload?.startISO
	const endISO = payload?.endISO || addMinutesISO(startISO, durationMin)

	const pacienteIdNum = parseNumericId(payload?.patientId)
	if (!pacienteIdNum) {
		throw new Error('Seleciona um paciente (responsável) existente na base de dados.')
	}

	const { data_consulta, hora } = dateAndTimeFromISO(startISO)
	if (!data_consulta || !hora) {
		throw new Error('Data/hora inválida.')
	}

	const id_medico = parseNumericId(payload?.medicoId)

	const apiBody = {
		id_medico,
		duracao: durationMin,
		tipo_de_marcacao: toApiTipoMarcacao(payload?.bookingType),
		status: toApiStatus(payload?.bookingStatus),
		data_consulta,
		id: pacienteIdNum,
		hora,
		razao_consulta: (payload?.firstVisitReason || '').trim() || null,
		notas_internas: (payload?.notes || '').trim() || null,
	}

	const planIdNum = parseNumericId(payload?.treatmentPlanId)
	if (planIdNum) {
		apiBody.id_tratamento = planIdNum
	}

	const createdRes = await apiFetch('/consultas', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(apiBody),
	})

	const createdId = createdRes?.consulta?.id_consulta
	const createdIdStr = createdId != null ? String(createdId) : ''
	// Atualiza caches locais com dados reais
	try {
		await syncPatientsFromApi()
		await syncConsultasFromApi()
	} catch {
		// ignore
	}

	if (createdId != null) {
		const stored = getStoredConsultas().find((c) => String(c?.id) === String(createdId))
		if (stored) return stored
	}

	const record = buildAppointmentRecord({
		patientId: payload?.patientId || '',
		patientName: payload?.patientName || '',
		dependentName: payload?.dependentName || '',
		treatmentPlanId: payload?.treatmentPlanId || '',
		notes: payload?.notes || '',
		specialty: payload?.specialty || '',
		medicoId: Number(payload?.medicoId || 0) || 0,
		medicoName: payload?.medicoName || '',
		bookingType: payload?.bookingType || 'vaga',
		bookingStatus: normalizeStatus(payload?.bookingStatus || 'a_confirmar'),
		firstVisitReason: payload?.firstVisitReason || '',
		isReschedule: !!payload?.isReschedule,
		isNoShow: !!payload?.isNoShow,
		durationMin,
		date: new Date(startISO || Date.now()),
		startHHMM: '00:00',
	})

	// sobrescrever start/end para evitar dependência do HH:MM dummy
	const finalRecord = {
		...record,
		id: createdIdStr || record.id,
		startISO,
		endISO,
		attachments: payload?.attachments || [],
		billing: payload?.billing || null,
		history: payload?.history || [],
	}

	upsertAppointment(finalRecord)
	return finalRecord
}

export function patchConsulta(id, patch = {}) {
	const existing = ensureConsultaStored(id)
	if (!existing) return null

	const next = {
		...existing,
		...patch,
		bookingStatus: patch.bookingStatus !== undefined ? normalizeStatus(patch.bookingStatus) : existing.bookingStatus,
	}

	if (patch.startISO && (patch.durationMin || next.durationMin) && !patch.endISO) {
		next.endISO = addMinutesISO(patch.startISO, patch.durationMin || next.durationMin)
	}

	upsertAppointment(next)

	// Propagar para API apenas os campos suportados pelo backend (sem anexos/billing/history).
	void (async () => {
		try {
			const startISO = patch.startISO || next.startISO
			const { data_consulta, hora } = dateAndTimeFromISO(startISO)
			const idNum = parseNumericId(next.patientId)
			if (!data_consulta || !hora || !idNum) return
			const body = {
				id_medico: parseNumericId(next.medicoId),
				duracao: Number(next.durationMin || 30),
				tipo_de_marcacao: toApiTipoMarcacao(next.bookingType),
				status: toApiStatus(next.bookingStatus),
				data_consulta,
				id: idNum,
				id_tratamento: parseNumericId(next.treatmentPlanId) || null,
				hora,
				razao_consulta: (next.firstVisitReason || '').trim() || null,
				notas_internas: (next.notes || '').trim() || null,
			}
			await apiFetch(`/consultas/${encodeURIComponent(String(id))}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
		} catch (e) {
			console.error('Falha ao sincronizar consulta com API:', e)
		}
	})()

	return next
}

export function appendHistory(id, entry) {
	const existing = ensureConsultaStored(id)
	if (!existing) return null
	const history = Array.isArray(existing.history) ? existing.history : []
	const nextEntry = {
		atISO: new Date().toISOString(),
		action: entry?.action || 'Atualização',
		note: entry?.note || '',
	}
	return patchConsulta(id, { history: [nextEntry, ...history] })
}

export function exportConsultasToCSV(items) {
	const header = ['ID', 'Paciente', 'Profissional', 'Especialidade', 'Data', 'Hora', 'Duração', 'Tipo', 'Estado']
	const rows = items.map((c) => {
		const d = parseISOToDate(c.startISO)
		const date = d ? d.toISOString().slice(0, 10) : ''
		const time = d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''
		return [
			c.id,
			c.patientName,
			c.medicoName,
			c.specialty,
			date,
			time,
			String(c.durationMin || ''),
			String(c.bookingType || ''),
			statusLabel(c.bookingStatus),
		]
	})

	const csv = [header, ...rows]
		.map((r) => r.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
		.join('\n')

	return `\uFEFF${csv}`
}

export function clearAllStoredConsultas() {
	saveAppointments([])
}

export async function deleteConsultaApi(id) {
	if (!id) throw new Error('id em falta')
	await apiFetch(`/consultas/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
	// Atualiza cache local imediatamente e depois sincroniza
	try {
		removeAppointment(String(id))
	} catch {
		// ignore
	}
	try {
		await syncConsultasFromApi()
	} catch {
		// ignore
	}
	return true
}
