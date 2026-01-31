export function pad2(value) {
	return String(value).padStart(2, '0')
}

export function parseISOToDate(iso) {
	if (!iso) return null
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return null
	return d
}

export function formatDatePT(value) {
	const d = value instanceof Date ? value : parseISOToDate(value)
	if (!d) return ''
	return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatTimePT(value) {
	const d = value instanceof Date ? value : parseISOToDate(value)
	if (!d) return ''
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function formatDateTimePT(value) {
	const d = value instanceof Date ? value : parseISOToDate(value)
	if (!d) return ''
	return `${formatDatePT(d)} ${formatTimePT(d)}`
}

export function toInputDate(value) {
	const d = value instanceof Date ? value : parseISOToDate(value)
	if (!d) return ''
	const year = d.getFullYear()
	const month = pad2(d.getMonth() + 1)
	const day = pad2(d.getDate())
	return `${year}-${month}-${day}`
}

export function toInputTime(value) {
	const d = value instanceof Date ? value : parseISOToDate(value)
	if (!d) return ''
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function combineDateAndTimeToISO(dateStr, timeStr) {
	if (!dateStr || !timeStr) return null
	const [year, month, day] = String(dateStr).split('-').map(Number)
	const [h, m] = String(timeStr).split(':').map(Number)
	if (!year || !month || !day) return null
	const d = new Date(year, (month || 1) - 1, day || 1, h || 0, m || 0, 0, 0)
	if (Number.isNaN(d.getTime())) return null
	return d.toISOString()
}

export function addMinutesISO(startISO, durationMin) {
	const d = parseISOToDate(startISO)
	if (!d) return null
	const next = new Date(d.getTime() + Number(durationMin || 0) * 60000)
	return next.toISOString()
}
