import { apiFetch } from './apiClient'
import { syncTreatmentPlansFromApi } from './dataSync'

const STORAGE_KEY = 'gestorClinica.planosTratamento'

function safeParse(json) {
	try {
		return JSON.parse(json)
	} catch {
		return null
	}
}

function nowISO() {
	return new Date().toISOString()
}

export const PLANO_STATUS = [
	{ id: 'ativo', label: 'Ativo' },
	{ id: 'pausado', label: 'Pausado' },
	{ id: 'concluido', label: 'Concluído' },
	{ id: 'cancelado', label: 'Cancelado' },
]

function normalizeStatus(status) {
	const s = String(status || '').trim().toLowerCase()
	if (!s) return 'ativo'
	if (PLANO_STATUS.some((x) => x.id === s)) return s
	return 'ativo'
}

export function planoStatusLabel(status) {
	return PLANO_STATUS.find((x) => x.id === normalizeStatus(status))?.label || 'Ativo'
}

export function loadTreatmentPlans() {
	const raw = localStorage.getItem(STORAGE_KEY)
	const parsed = safeParse(raw)
	return Array.isArray(parsed) ? parsed : []
}

export function saveTreatmentPlans(items) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function listTreatmentPlans({ patientId } = {}) {
	const all = loadTreatmentPlans()
	const pid = String(patientId || '').trim()
	const filtered = pid ? all.filter((p) => String(p?.patientId || '') === pid) : all
	return filtered
		.slice()
		.sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
}

export function getTreatmentPlanById(id) {
	if (!id) return null
	return loadTreatmentPlans().find((p) => String(p?.id || '') === String(id)) || null
}

export function createTreatmentPlan({
	patientId,
	patientName = '',
	data_inicio = '',
	data_fim = '',
	descricao = '',
	status = 'ativo',
} = {}) {
	const pid = String(patientId || '').trim()
	if (!pid) throw new Error('patientId em falta')

	const createdAt = nowISO()
	const plan = {
		id: `T${Date.now()}`,
		patientId: pid,
		patientName: String(patientName || '').trim(),
		data_inicio: data_inicio || '',
		data_fim: data_fim || '',
		descricao: String(descricao || '').trim(),
		status: normalizeStatus(status),
		history: [
			{
				atISO: createdAt,
				type: 'created',
				title: 'Plano criado',
				note: '',
			},
		],
		createdAt,
		updatedAt: createdAt,
	}

	const all = loadTreatmentPlans()
	saveTreatmentPlans([plan, ...all])
	return plan
}

export function updateTreatmentPlan(id, patch = {}) {
	const all = loadTreatmentPlans()
	const idx = all.findIndex((p) => String(p?.id || '') === String(id))
	if (idx < 0) return null

	const prev = all[idx]
	const prevStatus = normalizeStatus(prev?.status)
	const nextStatus = patch.status !== undefined ? normalizeStatus(patch.status) : prevStatus
	const statusChanged = prevStatus !== nextStatus
	const prevHistory = Array.isArray(prev?.history) ? prev.history : []
	const next = {
		...prev,
		...patch,
		status: nextStatus,
		history: patch.history !== undefined ? patch.history : prevHistory,
		updatedAt: nowISO(),
	}

	if (statusChanged) {
		next.history = [
			{
				atISO: nowISO(),
				type: 'status',
				title: 'Estado atualizado',
				note: `${planoStatusLabel(prevStatus)} → ${planoStatusLabel(nextStatus)}`,
			},
			...next.history,
		]
	}

	all[idx] = next
	saveTreatmentPlans(all)
	return next
}

export function appendTreatmentPlanHistory(planId, entry = {}) {
	const plan = getTreatmentPlanById(planId)
	if (!plan) return null
	const history = Array.isArray(plan.history) ? plan.history : []
	const nextEntry = {
		atISO: entry.atISO || nowISO(),
		type: entry.type || 'note',
		title: entry.title || 'Nota',
		note: entry.note || '',
		meta: entry.meta || null,
	}
	return updateTreatmentPlan(planId, { history: [nextEntry, ...history] })
}

export function removeTreatmentPlan(id) {
	const all = loadTreatmentPlans()
	const next = all.filter((p) => String(p?.id || '') !== String(id))
	saveTreatmentPlans(next)
	return next.length !== all.length
}

function normalizeApiStatus(value) {
	const s = String(value || '').trim().toLowerCase()
	return s || 'ativo'
}

export async function createTreatmentPlanApi({
	patientId,
	data_inicio = '',
	data_fim = '',
	descricao = '',
	status = 'ativo',
} = {}) {
	const pid = Number(String(patientId || '').trim())
	if (!Number.isFinite(pid) || !pid) throw new Error('patientId inválido')
	if (!String(descricao || '').trim()) throw new Error('Descrição em falta')

	const res = await apiFetch('/plano/plano', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id: pid,
			data_inicio: data_inicio || null,
			data_fim: data_fim || null,
			descricao: String(descricao || '').trim(),
			status: normalizeApiStatus(status),
		}),
	})

	try {
		await syncTreatmentPlansFromApi()
	} catch {
		// ignore
	}

	return res?.plano || null
}

export async function updateTreatmentPlanApi(id, patch = {}) {
	if (!id) throw new Error('id em falta')
	const body = {
		id: patch.patientId ? Number(String(patch.patientId).trim()) : undefined,
		data_inicio: patch.data_inicio !== undefined ? patch.data_inicio : undefined,
		data_fim: patch.data_fim !== undefined ? patch.data_fim : undefined,
		descricao: patch.descricao !== undefined ? String(patch.descricao || '').trim() : undefined,
		status: patch.status !== undefined ? normalizeApiStatus(patch.status) : undefined,
	}
	const res = await apiFetch(`/plano/${encodeURIComponent(String(id))}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})

	try {
		await syncTreatmentPlansFromApi()
	} catch {
		// ignore
	}

	return res?.plano || null
}

export async function deleteTreatmentPlanApi(id) {
	if (!id) throw new Error('id em falta')
	await apiFetch(`/plano/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
	try {
		await syncTreatmentPlansFromApi()
	} catch {
		// ignore
	}
	return true
}
