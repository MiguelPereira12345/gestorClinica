import React, { useMemo } from 'react'
import './Agenda.css'

const HOUR_START = 8
const HOUR_END = 19
const HOUR_HEIGHT = 40

function timeToMinutes(date) {
	return date.getHours() * 60 + date.getMinutes()
}

function isSameDay(a, b) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	)
}

function layoutOverlaps(items) {
	const sorted = [...items].sort(
		(a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime(),
	)

	const colEnd = [] // minutes
	let maxCols = 1

	const placed = sorted.map((appt) => {
		const s = new Date(appt.data_inicio)
		const e = new Date(appt.data_fim)
		const startMin = timeToMinutes(s)
		const endMin = timeToMinutes(e)

		let col = colEnd.findIndex((end) => end <= startMin)
		if (col === -1) {
			col = colEnd.length
			colEnd.push(endMin)
		} else {
			colEnd[col] = endMin
		}

		maxCols = Math.max(maxCols, colEnd.length)
		return { appt, startMin, endMin, col }
	})

	return { placed, maxCols }
}

export default function ResourceDayCalendar({ date, resources = [], appointments = [] }) {
	const totalHours = HOUR_END - HOUR_START + 1
	const gridHeight = totalHours * HOUR_HEIGHT

	const perResource = useMemo(() => {
		const d = new Date(date)
		return resources.map((r) => {
			const items = appointments.filter((a) => {
				const s = new Date(a.data_inicio)
				return a.medico_id === r.id && isSameDay(s, d)
			})

			return { resource: r, ...layoutOverlaps(items) }
		})
	}, [appointments, date, resources])

	return (
		<div className="rc-root">
			<div className="rc-header">
				<div className="rc-time-col" />
				<div className="rc-resources">
					{resources.map((r) => (
						<div key={r.id} className="rc-resource-col-header">
							<span className="rc-resource-dot" style={{ background: r.color }} />
							{r.name}
						</div>
					))}
				</div>
			</div>

			<div className="rc-body" style={{ height: gridHeight }}>
				<div className="rc-time-col">
					{Array.from({ length: totalHours }).map((_, i) => (
						<div key={i} className="rc-time-cell">
							{String(HOUR_START + i).padStart(2, '0')}:00
						</div>
					))}
				</div>

				<div className="rc-resources">
					{perResource.map(({ resource, placed, maxCols }) => (
						<div key={resource.id} className="rc-resource-col">
							<div className="rc-grid" style={{ height: gridHeight }}>
								{placed.map(({ appt, startMin, endMin, col }) => {
									const minutesFromDayStart = startMin - HOUR_START * 60
									const durationMinutes = endMin - startMin
									const top = (minutesFromDayStart / 60) * HOUR_HEIGHT
									const height = (durationMinutes / 60) * HOUR_HEIGHT
									const startStr = new Date(appt.data_inicio).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit',
									})
									const endStr = new Date(appt.data_fim).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit',
									})

									const colWidthPct = 100 / Math.max(1, maxCols)
									const leftPct = col * colWidthPct

									return (
										<div
											key={appt.id}
											className="rc-appointment"
											title={`${appt.paciente_nome} — ${appt.tipo_consulta}`}
											style={{
												top: `${top}px`,
												height: `${Math.max(28, height)}px`,
												background: appt.color || resource.color,
												left: `calc(${leftPct}% + 8px)`,
												width: `calc(${colWidthPct}% - 16px)`,
											}}
										>
											<div className="rc-appointment-title">{appt.paciente_nome}</div>
											<div className="rc-appointment-meta">
												{startStr}–{endStr}
											</div>
										</div>
									)
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
