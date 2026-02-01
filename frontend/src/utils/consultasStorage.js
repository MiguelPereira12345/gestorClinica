import {
	buildAppointmentRecord,
	loadAppointments,
	saveAppointments,
	upsertAppointment,
} from './appointmentStorage'

import { addMinutesISO, parseISOToDate } from './dateTime'

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

const DEMO_CONSULTAS = [
	{
		id: 'C-DEMO-001',
		patientId: 'P001',
		patientName: 'Maria Gonzalez',
		medicoId: 3,
		medicoName: 'Dr. Alex Morgan',
		specialty: 'Clínica Geral',
		bookingType: 'rotina',
		bookingStatus: 'confirmada',
		durationMin: 30,
		startISO: new Date('2025-11-12T10:30:00').toISOString(),
		endISO: new Date('2025-11-12T11:00:00').toISOString(),
		firstVisitReason: 'Consulta de rotina anual',
		notes: 'Trazer resultados de análises anteriores.',
		attachments: [
			{ id: 'A1', filename: 'Pedido_Analises.pdf', mimeType: 'application/pdf', addedAtISO: '2025-11-05T10:00:00.000Z' },
			{ id: 'A2', filename: 'Exame.png', mimeType: 'image/png', addedAtISO: '2025-11-01T09:00:00.000Z' },
		],
		billing: {
			service: 'Consulta Clínica Geral',
			amount: 45,
			payer: 'Particular',
			state: 'Pendente',
		},
	},
	{
		id: 'C-DEMO-002',
		patientId: 'P010',
		patientName: 'João Pereira',
		medicoId: 1,
		medicoName: 'Dra. Sofia Lima',
		specialty: 'Dermatologia',
		bookingType: 'vaga',
		bookingStatus: 'a_confirmar',
		durationMin: 30,
		startISO: new Date('2025-11-12T14:00:00').toISOString(),
		endISO: new Date('2025-11-12T14:30:00').toISOString(),
		firstVisitReason: '',
		notes: '',
	},
	{
		id: 'C-DEMO-003',
		patientId: 'P011',
		patientName: 'Ana Sousa',
		medicoId: 2,
		medicoName: 'Dr. Miguel Rocha',
		specialty: 'Ortopedia',
		bookingType: 'rotina',
		bookingStatus: 'confirmada',
		durationMin: 45,
		startISO: new Date('2025-11-13T09:15:00').toISOString(),
		endISO: new Date('2025-11-13T10:00:00').toISOString(),
		firstVisitReason: '',
		notes: '',
	},
	{
		id: 'C-DEMO-004',
		patientId: 'P012',
		patientName: 'Rui Carvalho',
		medicoId: 2,
		medicoName: 'Dra. Beatriz Nunes',
		specialty: 'Cardiologia',
		bookingType: 'urgente',
		bookingStatus: 'cancelada',
		durationMin: 30,
		startISO: new Date('2025-11-13T11:00:00').toISOString(),
		endISO: new Date('2025-11-13T11:30:00').toISOString(),
		firstVisitReason: '',
		notes: '',
	},
	{
		id: 'C-DEMO-005',
		patientId: 'P013',
		patientName: 'Carla Mendes',
		medicoId: 3,
		medicoName: 'Dr. Alex Morgan',
		specialty: 'Clínica Geral',
		bookingType: 'vaga',
		bookingStatus: 'remarcada',
		durationMin: 60,
		startISO: new Date('2025-11-14T16:45:00').toISOString(),
		endISO: new Date('2025-11-14T17:45:00').toISOString(),
		firstVisitReason: '',
		notes: '',
	},
]

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
	const stored = getStoredConsultas()
	const demo = DEMO_CONSULTAS.filter((d) => !stored.some((s) => s?.id === d.id))
	const all = [...stored, ...demo]

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
	const stored = getStoredConsultas().find((c) => c?.id === id)
	if (stored) return stored
	return DEMO_CONSULTAS.find((d) => d.id === id) || null
}

export function ensureConsultaStored(id) {
	const existing = getStoredConsultas().find((c) => c?.id === id)
	if (existing) return existing
	const demo = DEMO_CONSULTAS.find((d) => d.id === id)
	if (!demo) return null
	upsertAppointment({ ...demo, createdAt: new Date().toISOString() })
	return getStoredConsultas().find((c) => c?.id === id) || null
}

export function createConsulta(payload) {
	const durationMin = Number(payload?.durationMin || 30)
	const startISO = payload?.startISO
	const endISO = payload?.endISO || addMinutesISO(startISO, durationMin)

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
