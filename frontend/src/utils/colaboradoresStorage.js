const STORAGE_KEY = 'gestorClinica.colaboradores'

const MOCK_COLABORADORES = [
	{
		id: 'COL001',
		name: 'Dr. João Silva',
		email: 'joao.silva@clinica.com',
		phone: '(11) 99999-0001',
		cargo: 'Médico',
		status: 'ativo',
	},
	{
		id: 'COL002',
		name: 'Dra. Maria Santos',
		email: 'maria.santos@clinica.com',
		phone: '(11) 99999-0002',
		cargo: 'Admin',
		status: 'ativo',
	},
	{
		id: 'COL003',
		name: 'Enf. Pedro Costa',
		email: 'pedro.costa@clinica.com',
		phone: '(11) 99999-0003',
		cargo: 'Recepcionista',
		status: 'ativo',
	},
	{
		id: 'COL004',
		name: 'Dr. Carlos Mendes',
		email: 'carlos.mendes@clinica.com',
		phone: '(11) 99999-0004',
		cargo: 'Médico',
		status: 'inativo',
	},
]

function getStoredColaboradores() {
	const raw = localStorage.getItem(STORAGE_KEY)
	if (raw) {
		try {
			return JSON.parse(raw)
		} catch {
			return MOCK_COLABORADORES
		}
	}
	return MOCK_COLABORADORES
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
	if (filters.cargo) {
		filtered = filtered.filter(c => c.cargo.toLowerCase().includes(filters.cargo.toLowerCase()))
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
		all[idx] = { ...all[idx], ...data }
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
