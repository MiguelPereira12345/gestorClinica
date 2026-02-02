import { apiFetch, apiFetchBlob } from './apiClient'

function parseFilenameFromDisposition(value) {
	const v = String(value || '')
	const m = v.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
	const raw = m ? (m[1] || m[2]) : ''
	if (!raw) return ''
	try {
		return decodeURIComponent(raw)
	} catch {
		return raw
	}
}

export async function getPatientPlan({ patientId, planId }) {
	const pid = Number(String(patientId || '').trim())
	const id = Number(String(planId || '').trim())
	if (!Number.isFinite(pid) || !pid) throw new Error('patientId inválido')
	if (!Number.isFinite(id) || !id) throw new Error('planId inválido')
	const data = await apiFetch(`/patients/${encodeURIComponent(String(pid))}/planos/${encodeURIComponent(String(id))}`)
	const plano = data?.plano || null
	if (!plano) return null
	const consultas = Array.isArray(data?.consultas) ? data.consultas : []
	return { ...plano, consultas }
}

export async function fetchPatientPlanPdfBlob({ patientId, planId }) {
	const pid = Number(String(patientId || '').trim())
	const id = Number(String(planId || '').trim())
	if (!Number.isFinite(pid) || !pid) throw new Error('patientId inválido')
	if (!Number.isFinite(id) || !id) throw new Error('planId inválido')

	const res = await apiFetchBlob(
		`/patients/${encodeURIComponent(String(pid))}/planos/${encodeURIComponent(String(id))}/download`
	)
	const filename = parseFilenameFromDisposition(res.headers?.get('content-disposition')) || `plano-tratamento-${id}.pdf`
	return { blob: res.blob, filename, mimeType: res.headers?.get('content-type') || '' }
}

export async function downloadPatientPlanPdf({ patientId, planId }) {
	const { blob, filename } = await fetchPatientPlanPdfBlob({ patientId, planId })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.rel = 'noopener'
	a.click()
	setTimeout(() => URL.revokeObjectURL(url), 60_000)
	return { filename }
}
