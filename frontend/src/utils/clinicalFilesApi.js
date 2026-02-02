import { apiFetch, apiFetchBlob } from './apiClient'

export async function listClinicalFiles(patientId) {
	const pid = Number(String(patientId || '').trim())
	if (!Number.isFinite(pid) || !pid) throw new Error('patientId inválido')
	const data = await apiFetch(`/files?patientId=${encodeURIComponent(String(pid))}`)
	return Array.isArray(data?.files) ? data.files : []
}

export async function uploadClinicalFile({ patientId, file, kind = 'anexo_clinico' }) {
	const pid = Number(String(patientId || '').trim())
	if (!Number.isFinite(pid) || !pid) throw new Error('patientId inválido')
	if (!file) throw new Error('file em falta')

	const body = new FormData()
	body.append('file', file)
	body.append('patient_id', String(pid))
	if (kind) body.append('kind', String(kind))

	const res = await apiFetch('/files/upload', {
		method: 'POST',
		body,
	})

	return res?.file || null
}

export async function listConsultaFiles(consultaId) {
	const cid = Number(String(consultaId || '').trim())
	if (!Number.isFinite(cid) || !cid) throw new Error('consultaId inválido')
	const data = await apiFetch(`/files?consultaId=${encodeURIComponent(String(cid))}`)
	return Array.isArray(data?.files) ? data.files : []
}

export async function uploadConsultaFile({ consultaId, patientId = null, file, kind = 'consulta_anexo' }) {
	const cid = Number(String(consultaId || '').trim())
	if (!Number.isFinite(cid) || !cid) throw new Error('consultaId inválido')
	if (!file) throw new Error('file em falta')

	const body = new FormData()
	body.append('file', file)
	body.append('consulta_id', String(cid))
	if (patientId != null && String(patientId).trim() !== '') body.append('patient_id', String(patientId))
	if (kind) body.append('kind', String(kind))

	const res = await apiFetch('/files/upload', {
		method: 'POST',
		body,
	})

	return res?.file || null
}

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

export async function fetchClinicalFileBlob(idFile) {
	const id = Number(String(idFile || '').trim())
	if (!Number.isFinite(id) || !id) throw new Error('id_file inválido')

	const res = await apiFetchBlob(`/files/${encodeURIComponent(String(id))}/download`)
	const filename =
		parseFilenameFromDisposition(res.headers?.get('content-disposition')) || `anexo-${id}`
	return { blob: res.blob, filename, mimeType: res.headers?.get('content-type') || '' }
}

export async function openClinicalFileInNewTab(idFile) {
	const { blob, filename } = await fetchClinicalFileBlob(idFile)
	const url = URL.createObjectURL(blob)
	// tenta abrir; se o browser bloquear popups, o download ainda pode ser feito
	window.open(url, '_blank', 'noopener,noreferrer')
	// liberta mais tarde
	setTimeout(() => URL.revokeObjectURL(url), 60_000)
	return { filename }
}

export async function downloadClinicalFile(idFile) {
	const { blob, filename } = await fetchClinicalFileBlob(idFile)
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.rel = 'noopener'
	a.click()
	setTimeout(() => URL.revokeObjectURL(url), 60_000)
	return { filename }
}
