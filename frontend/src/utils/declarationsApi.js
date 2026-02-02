import { apiFetchBlob } from './apiClient'

function parseFilenameFromDisposition(value) {
	const v = String(value || '')
	// content-disposition: attachment; filename="foo.pdf"
	const m = v.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
	const raw = m ? (m[1] || m[2]) : ''
	if (!raw) return ''
	try {
		return decodeURIComponent(raw)
	} catch {
		return raw
	}
}

export async function fetchPresenceDeclarationByConsultaBlob(consultaId) {
	const cid = Number(String(consultaId || '').trim())
	if (!Number.isFinite(cid) || !cid) throw new Error('consultaId inválido')

	const res = await apiFetchBlob(`/declarations/presence/by-consulta/${encodeURIComponent(String(cid))}/download`)
	const filename =
		parseFilenameFromDisposition(res.headers?.get('content-disposition')) || `declaracao-presenca-consulta-${cid}.pdf`

	return { blob: res.blob, filename, mimeType: res.headers?.get('content-type') || '' }
}

export async function downloadPresenceDeclarationByConsulta(consultaId) {
	const { blob, filename } = await fetchPresenceDeclarationByConsultaBlob(consultaId)
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.rel = 'noopener'
	a.click()
	setTimeout(() => URL.revokeObjectURL(url), 60_000)
	return { filename }
}
