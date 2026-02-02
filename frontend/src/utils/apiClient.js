const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

async function rawJsonFetch(url, options) {
	const res = await fetch(url, options)
	const data = await res.json().catch(() => null)
	return { res, data }
}

async function tryRefreshToken() {
	const refreshToken = getRefreshToken()
	if (!refreshToken) return null

	const url = `${API_BASE_URL}/auth/refresh`
	const { res, data } = await rawJsonFetch(url, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ refreshToken }),
	})

	if (!res.ok || !data?.token) return null

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

export async function apiFetch(path, options = {}) {
	const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
	const token = getAuthToken()

	const headers = {
		Accept: 'application/json',
		...(options.headers || {}),
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	let res = await fetch(url, { ...options, headers })
	let data = await res.json().catch(() => null)

	// Se token expirou e temos refreshToken, tenta refresh 1x e repete.
	const isAuthPath = url.includes('/auth/refresh') || url.includes('/auth/admin/login') || url.includes('/auth/paciente/login')
	if (!isAuthPath && (res.status === 401 || res.status === 403)) {
		const newToken = await tryRefreshToken().catch(() => null)
		if (newToken) {
			const retryHeaders = {
				...headers,
				Authorization: `Bearer ${newToken}`,
			}
			res = await fetch(url, { ...options, headers: retryHeaders })
			data = await res.json().catch(() => null)
		}
	}

	if (!res.ok) {
		const err = new Error(data?.message || `API error ${res.status}`)
		err.status = res.status
		err.data = data
		throw err
	}
	return data
}

export async function apiFetchBlob(path, options = {}) {
	const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
	const token = getAuthToken()

	const headers = {
		...(options.headers || {}),
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	let res = await fetch(url, { ...options, headers })

	// Se token expirou e temos refreshToken, tenta refresh 1x e repete.
	const isAuthPath = url.includes('/auth/refresh') || url.includes('/auth/admin/login') || url.includes('/auth/paciente/login')
	if (!isAuthPath && (res.status === 401 || res.status === 403)) {
		const newToken = await tryRefreshToken().catch(() => null)
		if (newToken) {
			const retryHeaders = {
				...headers,
				Authorization: `Bearer ${newToken}`,
			}
			res = await fetch(url, { ...options, headers: retryHeaders })
		}
	}

	if (!res.ok) {
		let data = null
		try {
			data = await res.json()
		} catch {
			// ignore
		}
		const err = new Error(data?.message || `API error ${res.status}`)
		err.status = res.status
		err.data = data
		throw err
	}

	const blob = await res.blob()
	return { blob, headers: res.headers }
}
