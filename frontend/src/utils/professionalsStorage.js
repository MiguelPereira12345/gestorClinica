import { syncColaboradoresFromApi } from './dataSync'

const STORAGE_KEY = 'gestorClinica.colaboradores'

function safeParse(json) {
	try {
		return JSON.parse(json)
	} catch {
		return null
	}
}

function getStoredColaboradores() {
	const parsed = safeParse(localStorage.getItem(STORAGE_KEY))
	return Array.isArray(parsed) ? parsed : []
}

function isMedico(colab) {
	const tipo = String(colab?.tipo || '').trim().toLowerCase()
	if (tipo === 'medico' || tipo === 'médico') return true
	// backward compat (older cache stored only cargo label)
	const cargo = String(colab?.cargo || '').trim().toLowerCase()
	return cargo === 'médico' || cargo === 'medico'
}

export function loadMedicosForSelect() {
	const all = getStoredColaboradores()
	const medicos = all
		.filter(isMedico)
		.map((c) => ({
			id: String(c?.id || '').trim(),
			name: String(c?.name || c?.nome || '').trim(),
		}))
		.filter((m) => m.id && m.name)

	const seen = new Set()
	const unique = []
	for (const m of medicos) {
		if (seen.has(m.id)) continue
		seen.add(m.id)
		unique.push(m)
	}

	unique.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'))
	return unique
}

export async function refreshMedicosForSelect() {
	try {
		await syncColaboradoresFromApi()
	} catch {
		// ignore
	}
	return loadMedicosForSelect()
}
