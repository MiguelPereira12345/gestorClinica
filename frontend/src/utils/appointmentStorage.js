const APPOINTMENTS_KEY = 'gestorClinica.consultas'
const ONE_OFF_SCHEDULES_KEY = 'gestorClinica.horariosPontuais'

function safeParse(json) {
	try {
		return JSON.parse(json)
	} catch {
		return null
	}
}

export const DEFAULT_CLINIC_HOURS = [
	{ start: '08:00', end: '13:00' },
	{ start: '14:00', end: '19:00' },
]

export function isHoliday(date) {
	// lista simples (podes expandir depois)
	const month = date.getMonth() + 1
	const day = date.getDate()
	const fixed = [
		{ m: 1, d: 1 }, // Ano Novo
		{ m: 4, d: 25 }, // 25 Abril
		{ m: 5, d: 1 }, // 1 Maio
		{ m: 6, d: 10 }, // 10 Junho
		{ m: 8, d: 15 }, // 15 Agosto
		{ m: 12, d: 1 }, // 1 Dezembro
		{ m: 12, d: 8 }, // 8 Dezembro
		{ m: 12, d: 25 }, // Natal
	]
	return fixed.some((x) => x.m === month && x.d === day)
}

export function isClinicOpenDay(date) {
	// Mon-Fri aberto por defeito; Sáb/Dom fechado
	const dow = date.getDay() // 0 dom .. 6 sáb
	return dow >= 1 && dow <= 5
}

export function loadAppointments() {
	const parsed = safeParse(localStorage.getItem(APPOINTMENTS_KEY))
	return Array.isArray(parsed) ? parsed : []
}

export function saveAppointments(items) {
	localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(items))
}

export function upsertAppointment(appt) {
	const items = loadAppointments()
	const idx = items.findIndex((a) => a?.id === appt?.id)
	if (idx >= 0) items[idx] = appt
	else items.unshift(appt)
	saveAppointments(items)
	return appt
}

export function removeAppointment(id) {
	const items = loadAppointments()
	const next = items.filter((a) => a?.id !== id)
	saveAppointments(next)
	return next.length !== items.length
}

export function loadOneOffSchedules() {
	const parsed = safeParse(localStorage.getItem(ONE_OFF_SCHEDULES_KEY))
	return Array.isArray(parsed) ? parsed : []
}

export function saveOneOffSchedules(items) {
	localStorage.setItem(ONE_OFF_SCHEDULES_KEY, JSON.stringify(items))
}

export function addOneOffSchedule(schedule) {
	const items = loadOneOffSchedules()
	items.unshift(schedule)
	saveOneOffSchedules(items)
	return schedule
}

export function getOneOffSchedulesForDate(dateISO) {
	return loadOneOffSchedules().filter((s) => s?.dateISO === dateISO)
}

function toMinutes(hhmm) {
	const [h, m] = String(hhmm).split(':').map(Number)
	return (h || 0) * 60 + (m || 0)
}

function fromMinutes(min) {
	const h = Math.floor(min / 60)
	const m = min % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function dateToISO(date) {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d.toISOString().slice(0, 10)
}

export function overlap(aStart, aEnd, bStart, bEnd) {
	return aStart < bEnd && bStart < aEnd
}

export function getClinicIntervalsForDate({ date, medicoId }) {
	const iso = dateToISO(date)
	const oneOff = getOneOffSchedulesForDate(iso).filter((s) => !medicoId || s.medicoId === medicoId)
	const hasOneOff = oneOff.length > 0

	let status = 'open'
	if (!isClinicOpenDay(date)) status = 'closed'
	if (isHoliday(date)) status = 'holiday'
	if (hasOneOff) status = 'open'

	let intervals = DEFAULT_CLINIC_HOURS
	if (hasOneOff) {
		intervals = oneOff
			.map((s) => ({ start: s.start, end: s.end }))
			.sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
	}

	return { status, intervals }
}

export function getAppointmentsForDay({ date, medicoId }) {
	const iso = dateToISO(date)
	return loadAppointments().filter((a) => {
		if (!a?.startISO) return false
		if (a.medicoId !== medicoId) return false
		return a.startISO.slice(0, 10) === iso
	})
}

export function isSlotFree({ date, medicoId, startHHMM, durationMin }) {
	const day = new Date(date)
	const [h, m] = startHHMM.split(':').map(Number)
	day.setHours(h, m || 0, 0, 0)
	const startISO = day.toISOString()
	const endISO = new Date(day.getTime() + durationMin * 60000).toISOString()
	const s = new Date(startISO).getTime()
	const e = new Date(endISO).getTime()

	const appts = getAppointmentsForDay({ date, medicoId })
	for (const a of appts) {
		const as = new Date(a.startISO).getTime()
		const ae = new Date(a.endISO).getTime()
		if (overlap(s, e, as, ae)) return false
	}
	return true
}

export function listAvailableSlots({ date, medicoId, durationMin, limit = 6, stepMin = 15 }) {
	const { status, intervals } = getClinicIntervalsForDate({ date, medicoId })
	if (status === 'closed' || status === 'holiday') return { status, slots: [] }

	const slots = []
	for (const interval of intervals) {
		const startM = toMinutes(interval.start)
		const endM = toMinutes(interval.end)
		for (let t = startM; t + durationMin <= endM; t += stepMin) {
			const hhmm = fromMinutes(t)
			if (isSlotFree({ date, medicoId, startHHMM: hhmm, durationMin })) {
				slots.push(hhmm)
				if (slots.length >= limit) return { status, slots }
			}
		}
	}

	return { status, slots }
}

export function computeOccupancyForDay({ date, medicoId }) {
	// ocupação simples: minutos ocupados / minutos disponíveis
	const { status, intervals } = getClinicIntervalsForDate({ date, medicoId })
	if (status === 'closed') return { status, occupancy: 0 }
	if (status === 'holiday') return { status, occupancy: 0 }

	const availableMinutes = intervals.reduce((sum, i) => sum + (toMinutes(i.end) - toMinutes(i.start)), 0)
	if (!availableMinutes) return { status, occupancy: 0 }

	const appts = loadAppointments().filter((a) => {
		if (!a?.startISO || !a?.endISO) return false
		if (medicoId && a.medicoId !== medicoId) return false
		return a.startISO.slice(0, 10) === dateToISO(date)
	})

	const usedMinutes = appts.reduce((sum, a) => {
		const s = new Date(a.startISO)
		const e = new Date(a.endISO)
		return sum + Math.max(0, (e.getTime() - s.getTime()) / 60000)
	}, 0)

	return { status, occupancy: Math.max(0, Math.min(1, usedMinutes / availableMinutes)) }
}

export function buildAppointmentRecord({
	patientId,
	patientName,
	dependentName,
	notes,
	specialty,
	medicoId,
	medicoName,
	bookingType,
	bookingStatus,
	firstVisitReason,
	isReschedule,
	isNoShow,
	durationMin,
	date,
	startHHMM,
}) {
	const day = new Date(date)
	const [h, m] = startHHMM.split(':').map(Number)
	day.setHours(h, m || 0, 0, 0)
	const startISO = day.toISOString()
	const endISO = new Date(day.getTime() + durationMin * 60000).toISOString()

	return {
		id: `C${Date.now()}`,
		patientId,
		patientName,
		dependentName: dependentName || '',
		notes: notes || '',
		specialty: specialty || '',
		medicoId,
		medicoName: medicoName || '',
		bookingType: bookingType || 'vaga',
		bookingStatus: bookingStatus || 'a_confirmar',
		firstVisitReason: firstVisitReason || '',
		isReschedule: !!isReschedule,
		isNoShow: !!isNoShow,
		durationMin,
		startISO,
		endISO,
		createdAt: new Date().toISOString(),
	}
}
