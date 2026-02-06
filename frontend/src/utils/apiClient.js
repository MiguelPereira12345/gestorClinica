import axios from 'axios'

function resolveApiBaseUrl() {
	const fromEnv = import.meta.env.VITE_API_URL
	if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim()

	// Sem VITE_API_URL, usa sempre same-origin.
	// - Produção (Render): funciona se o backend servir o frontend no mesmo domínio.
	// - Dev (Vite): funciona com proxy (ver vite.config.js) e evita CORS.
	if (typeof window !== 'undefined' && window.location) {
		return window.location.origin
	}

	// fallback (SSR/testes)
	return ''
}

const API_BASE_URL = resolveApiBaseUrl()

export function isApiUrlLikelyMisconfigured() {
	const fromEnv = import.meta.env.VITE_API_URL
	if (fromEnv && String(fromEnv).trim()) return false
	if (typeof window === 'undefined' || !window.location) return false
	const host = String(window.location.hostname || '').trim().toLowerCase()
	// Em produção, se não houver VITE_API_URL, é provável estar mal configurado
	// (a menos que o backend esteja a servir o frontend no mesmo domínio).
	return host !== 'localhost' && host !== '127.0.0.1'
}

function safeParse(json) {
	try {
		return JSON.parse(json)
	} catch {
		return null
	}
}

export function getApiBaseUrl() {
	return API_BASE_URL
}

export function getAuthSession() {
	const raw = localStorage.getItem('auth_user')
	return raw ? safeParse(raw) : null
}

export function getCurrentUser() {
	const session = getAuthSession()
	return session?.user || null
}

export function getCurrentUserRole() {
	return String(getCurrentUser()?.tipo || '').trim().toLowerCase()
}

export function isMedicoUser() {
	const role = getCurrentUserRole()
	return role === 'medico' || role === 'médico'
}

export function setAuthSession(session) {
	if (!session) {
		localStorage.removeItem('auth_user')
		return
	}
	localStorage.setItem('auth_user', JSON.stringify(session))
}

export function getAuthToken() {
	const session = getAuthSession()
	return session?.token || session?.accessToken || null
}

export function getRefreshToken() {
	const session = getAuthSession()
	return session?.refreshToken || null
}

const api = axios.create({
	baseURL: API_BASE_URL,
	// evita pendurar o UI em ligações mortas
	timeout: 60_000,
})

// Cliente separado para refresh (evita loops de interceptors)
const refreshClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 60_000,
})

function normalizeHeaders(headers) {
	if (!headers) return {}
	// suporta object literal e Headers-like
	if (typeof headers.get === 'function') {
		const out = {}
		// não dá para enumerar facilmente; retorna vazio e deixa o caller passar object
		return out
	}
	return { ...headers }
}

function shouldParseJsonBody(headers, body) {
	if (body == null) return false
	if (typeof body !== 'string') return false
	const ct = String(headers?.['Content-Type'] || headers?.['content-type'] || '').toLowerCase()
	return ct.includes('application/json')
}

function tryParseJsonBody(body) {
	try {
		return JSON.parse(body)
	} catch {
		return body
	}
}

function toHeadersLike(axiosHeaders) {
	const h = axiosHeaders || {}
	return {
		get(name) {
			const key = String(name || '').toLowerCase()
			return h[key] ?? h[name] ?? null
		},
	}
}

async function tryRefreshToken() {
	const refreshToken = getRefreshToken()
	if (!refreshToken) return null

	let data = null
	try {
		const res = await refreshClient.post('/auth/refresh', { refreshToken }, {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		})
		data = res?.data || null
	} catch {
		return null
	}

	if (!data?.token) return null

	// Atualiza sessão guardada
	const prev = getAuthSession() || {}
	setAuthSession({
		...prev,
		...data,
		// normaliza para o que apiFetch espera
		token: data.token,
		refreshToken: data.refreshToken || prev.refreshToken,
		user: data.user || prev.user,
	})

	return data.token
}

api.interceptors.request.use((config) => {
	const token = getAuthToken()
	if (token) {
		config.headers = config.headers || {}
		if (!config.headers.Authorization && !config.headers.authorization) {
			config.headers.Authorization = `Bearer ${token}`
		}
	}
	config.headers = config.headers || {}
	if (!config.headers.Accept && !config.headers.accept) {
		config.headers.Accept = 'application/json'
	}
	return config
})

api.interceptors.response.use(
	(res) => res,
	async (error) => {
		const status = error?.response?.status
		const config = error?.config
		const url = String(config?.url || '')
		const isAuthPath = url.includes('/auth/refresh') || url.includes('/auth/admin/login') || url.includes('/auth/paciente/login')

		if (!config || isAuthPath) throw error
		if (config._retry) throw error
		if (status !== 401 && status !== 403) throw error

		const newToken = await tryRefreshToken().catch(() => null)
		if (!newToken) throw error

		config._retry = true
		config.headers = config.headers || {}
		config.headers.Authorization = `Bearer ${newToken}`
		return api(config)
	}
)

export async function apiFetch(path, options = {}) {
	const url = path.startsWith('http') ? path : `${path.startsWith('/') ? '' : '/'}${path}`
	const method = String(options.method || 'GET').trim().toLowerCase()
	const headers = normalizeHeaders(options.headers)

	let data = options.body
	if (shouldParseJsonBody(headers, data)) {
		data = tryParseJsonBody(data)
	}

	// Se for FormData, não forçar content-type
	if (typeof FormData !== 'undefined' && data instanceof FormData) {
		delete headers['Content-Type']
		delete headers['content-type']
	}

	try {
		const res = await api.request({
			url,
			method,
			headers,
			data,
			// Mantém compatibilidade com chamadas antigas que enviavam credentials, etc.
			withCredentials: Boolean(options.credentials === 'include'),
		})
		return res?.data ?? null
	} catch (e) {
		const status = e?.response?.status
		const payload = e?.response?.data ?? null
		const err = new Error(payload?.message || e?.message || (status ? `API error ${status}` : 'API error'))
		err.status = status
		err.data = payload
		throw err
	}
}

export async function apiFetchBlob(path, options = {}) {
	const url = path.startsWith('http') ? path : `${path.startsWith('/') ? '' : '/'}${path}`
	const method = String(options.method || 'GET').trim().toLowerCase()
	const headers = normalizeHeaders(options.headers)

	let data = options.body
	if (shouldParseJsonBody(headers, data)) {
		data = tryParseJsonBody(data)
	}

	if (typeof FormData !== 'undefined' && data instanceof FormData) {
		delete headers['Content-Type']
		delete headers['content-type']
	}

	try {
		const res = await api.request({
			url,
			method,
			headers,
			data,
			responseType: 'blob',
			withCredentials: Boolean(options.credentials === 'include'),
		})
		return { blob: res?.data, headers: toHeadersLike(res?.headers) }
	} catch (e) {
		const status = e?.response?.status
		const payload = e?.response?.data ?? null
		const err = new Error(payload?.message || e?.message || (status ? `API error ${status}` : 'API error'))
		err.status = status
		err.data = payload
		throw err
	}
}
