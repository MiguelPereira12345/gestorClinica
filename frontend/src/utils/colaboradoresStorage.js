import { apiFetch } from './apiClient'
import { syncColaboradoresFromApi } from './dataSync'

const STORAGE_KEY = 'gestorClinica.colaboradores'

function cargoLabelFromKey(key) {
	const v = String(key || '').trim().toLowerCase()
	if (v === 'admin') return 'Secretário/a'
	if (v === 'medico' || v === 'médico') return 'Médico/a'
	return ''
}

function getStoredColaboradores() {
	const raw = localStorage.getItem(STORAGE_KEY)
	if (raw) {
		try {
			return JSON.parse(raw)
		} catch {
			return []
		}
	}
	return []
}

function saveColaboradores(list) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function listColaboradores({ filters = {}, page = 1, pageSize = 10 }) {
	const all = getStoredColaboradores()

	let filtered = all
	if (filters.name) {
		filtered = filtered.filter(c => c.name.toLowerCase().includes(filters.name.toLowerCase()))
	}
	{
		const roleFilter = String(filters.specialty || filters.cargo || '').trim().toLowerCase()
		if (roleFilter) {
			filtered = filtered.filter((c) => {
				const tipo = String(c?.tipo || '').trim().toLowerCase()
				const cargo = String(c?.cargo || '').trim().toLowerCase()
				return (tipo && tipo === roleFilter) || (cargo && cargo.includes(roleFilter))
			})
		}
	}
	if (filters.status) {
		filtered = filtered.filter(c => c.status === filters.status)
	}

	const total = filtered.length
	const maxPage = Math.ceil(total / pageSize)
	const start = (page - 1) * pageSize
	const items = filtered.slice(start, start + pageSize)

	return { items, page, pageSize, total, maxPage }
}

export function getColaboradorById(id) {
	const all = getStoredColaboradores()
	return all.find(c => c.id === id)
}

export function addColaborador(data) {
	const all = getStoredColaboradores()
	const newId = `COL${String(all.length + 1).padStart(3, '0')}`
	const newItem = { id: newId, ...data }
	all.push(newItem)
	saveColaboradores(all)
	return newItem
}

export function patchColaborador(id, data) {
	const all = getStoredColaboradores()
	const idx = all.findIndex(c => c.id === id)
	if (idx !== -1) {
		const next = { ...all[idx], ...data }
		if (data?.cargo) {
			const label = cargoLabelFromKey(data.cargo)
			if (label) next.cargo = label
		}
		all[idx] = next
		saveColaboradores(all)
	}
	return all[idx]
}

export function deleteColaborador(id) {
	const all = getStoredColaboradores()
	const filtered = all.filter(c => c.id !== id)
	saveColaboradores(filtered)
}

export function exportColaboradoresToCSV(items) {
	const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Cargo', 'Status']
	const rows = items.map(c => [
		c.id,
		c.name,
		c.email,
		c.phone,
		c.cargo,
		c.status,
	])

	const csv = [
		headers.join(','),
		...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
	].join('\n')

	return csv
}

export async function createColaboradorApi(payload = {}) {
	const nome = String(payload?.name || '').trim()
	const email = String(payload?.email || '').trim().toLowerCase()
	const telefone = String(payload?.phone || '').trim()
	const cargo = String(payload?.cargo || '').trim().toLowerCase()
	const omdRaw = payload?.omd !== undefined ? String(payload.omd || '').trim() : ''
	const senha = String(payload?.password || '').trim()
	if (!nome) throw new Error('Nome em falta')
	if (!email) throw new Error('Email em falta')
	if (!telefone) throw new Error('Telefone em falta')
	if (!cargo) throw new Error('Cargo em falta')
	if (cargo === 'medico' || cargo === 'médico') {
		if (!omdRaw) throw new Error('OMD em falta')
		if (!/^\d{5}$/.test(omdRaw)) throw new Error('OMD inválido (tem de ter 5 números)')
	}
	if (!senha) throw new Error('Password em falta')
	if (senha.length < 6) throw new Error('A password deve ter pelo menos 6 caracteres')

	const ativo = String(payload?.status || '').toLowerCase() !== 'inativo'

	const omd = (cargo === 'medico' || cargo === 'médico') ? omdRaw : undefined

	const res = await apiFetch('/gestores', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ nome, email, telefone, senha, tipo: cargo, ativo, omd }),
	})

	try {
		await syncColaboradoresFromApi()
	} catch {
		// ignore
	}

	return res?.gestor || null
}

export async function updateColaboradorApi(id, payload = {}) {
	if (!id) throw new Error('id em falta')
	const nome = payload?.name !== undefined ? String(payload?.name || '').trim() : undefined
	const email = payload?.email !== undefined ? String(payload?.email || '').trim().toLowerCase() : undefined
	const telefone = payload?.phone !== undefined ? String(payload?.phone || '').trim() : undefined
	const ativo = payload?.status !== undefined ? String(payload?.status || '').toLowerCase() !== 'inativo' : undefined
	const tipo = payload?.cargo !== undefined ? String(payload?.cargo || '').trim().toLowerCase() : undefined
	const senha = payload?.password ? String(payload.password).trim() : undefined
	const omdRaw = payload?.omd !== undefined ? String(payload.omd || '').trim() : undefined
	if (tipo === 'medico' || tipo === 'médico') {
		if (!omdRaw) throw new Error('OMD em falta')
		if (!/^\d{5}$/.test(omdRaw)) throw new Error('OMD inválido (tem de ter 5 números)')
	}
	const omd = omdRaw === undefined ? undefined : omdRaw

	const res = await apiFetch(`/gestores/${encodeURIComponent(String(id))}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ nome, email, telefone, ativo, tipo, senha, omd }),
	})

	try {
		await syncColaboradoresFromApi()
	} catch {
		// ignore
	}

	return res?.gestor || null
}

export async function deleteColaboradorApi(id) {
	if (!id) throw new Error('id em falta')
	await apiFetch(`/gestores/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
	try {
		await syncColaboradoresFromApi()
	} catch {
		// ignore
	}
	return true
}
