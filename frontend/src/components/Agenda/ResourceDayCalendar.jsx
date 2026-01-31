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
	const sorted = [...items]
		.map((appt) => {
			const s = new Date(appt.data_inicio)
			const e = new Date(appt.data_fim)
			return {
				appt,
				startMin: timeToMinutes(s),
				endMin: timeToMinutes(e),
			}
		})
		.sort((a, b) => new Date(a.appt.data_inicio).getTime() - new Date(b.appt.data_inicio).getTime())

	// Partition into overlap clusters so width is computed per cluster,
	// not globally for the whole day/resource.
	const clusters = []
	let current = []
	let currentEnd = -Infinity

	for (const item of sorted) {
		if (current.length === 0) {
			current = [item]
			currentEnd = item.endMin
			continue
		}

		if (item.startMin < currentEnd) {
			current.push(item)
			currentEnd = Math.max(currentEnd, item.endMin)
		} else {
			clusters.push(current)
			current = [item]
			currentEnd = item.endMin
		}
	}
	if (current.length) clusters.push(current)

	const placed = []
	for (const cluster of clusters) {
		const colEnd = [] // minutes
		let clusterCols = 1

		const clusterPlaced = cluster.map(({ appt, startMin, endMin }) => {
			let col = colEnd.findIndex((end) => end <= startMin)
			if (col === -1) {
				col = colEnd.length
				colEnd.push(endMin)
			} else {
				colEnd[col] = endMin
			}

			clusterCols = Math.max(clusterCols, colEnd.length)
			return { appt, startMin, endMin, col }
		})

		for (const p of clusterPlaced) {
			placed.push({ ...p, clusterCols })
		}
	}

	return { placed }
}

function hexToRgb(hex) {
	const h = String(hex || '').trim().replace('#', '')
	if (h.length !== 6) return null
	const r = Number.parseInt(h.slice(0, 2), 16)
	const g = Number.parseInt(h.slice(2, 4), 16)
	const b = Number.parseInt(h.slice(4, 6), 16)
	if ([r, g, b].some((x) => Number.isNaN(x))) return null
	return { r, g, b }
}

function pickTextColor(bg) {
	const rgb = hexToRgb(bg)
	if (!rgb) return '#1e2a35'
	// relative luminance (sRGB)
	const toLin = (c) => {
		const v = c / 255
		return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
	}
	const L = 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b)
	return L < 0.45 ? '#ffffff' : '#1e2a35'
}

export default function ResourceDayCalendar({ date, resources = [], appointments = [] }) {
	const totalHours = HOUR_END - HOUR_START + 1
	const gridHeight = totalHours * HOUR_HEIGHT
	const timeColWidth = 80

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
		<div className="w-100">
			<div className="d-flex border-bottom bg-light rounded-top-3">
				<div className="flex-shrink-0 bg-white" style={{ width: timeColWidth }} />
				<div className="d-flex flex-grow-1" style={{ minWidth: 0 }}>
					{resources.map((r, idx) => (
						<div
							key={r.id}
							className={
								(idx === 0 ? '' : 'border-start ') +
								'd-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold text-truncate flex-grow-1'
							}
							style={{ minWidth: 0 }}
							title={r.name}
						>
							<span
								className="rounded-pill flex-shrink-0"
								style={{ width: 10, height: 10, background: r.color }}
							/>
							{r.name}
						</div>
					))}
				</div>
			</div>

			<div className="d-flex bg-white rounded-bottom-3 overflow-hidden" style={{ height: gridHeight }}>
				<div className="flex-shrink-0 bg-white" style={{ width: timeColWidth }}>
					{Array.from({ length: totalHours }).map((_, i) => (
						<div
							key={i}
							className="d-flex align-items-center border-bottom px-2 text-muted small"
							style={{ height: HOUR_HEIGHT }}
						>
							{String(HOUR_START + i).padStart(2, '0')}:00
						</div>
					))}
				</div>

				<div className="d-flex flex-grow-1" style={{ minWidth: 0 }}>
					{perResource.map(({ resource, placed }) => (
						<div
							key={resource.id}
							className={(resources[0]?.id === resource.id ? '' : 'border-start ') + 'flex-grow-1 position-relative bg-white'}
							style={{ minWidth: 0 }}
						>
							<div className="rc-grid" style={{ height: gridHeight }}>
								{placed.map(({ appt, startMin, endMin, col, clusterCols }) => {
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

									const colWidthPct = 100 / Math.max(1, clusterCols)
									const leftPct = col * colWidthPct

									return (
										<div
											key={appt.id}
											className="position-absolute rounded-3 shadow-sm overflow-hidden border"
											title={`${appt.paciente_nome} — ${appt.tipo_consulta}`}
											style={{
												top: `${top}px`,
												height: `${Math.max(34, height)}px`,
												background: appt.color || resource.color,
												left: `calc(${leftPct}% + 4px)`,
												width: `calc(${colWidthPct}% - 8px)`,
												padding: '8px 10px',
												color: pickTextColor(appt.color || resource.color),
												borderColor: 'rgba(30, 42, 53, 0.18)',
											}}
										>
											<div className="fw-bold" style={{ fontSize: 13, lineHeight: 1.15 }}>
												{appt.paciente_nome}
											</div>
											<div style={{ fontSize: 11, marginTop: 2, opacity: 0.85, lineHeight: 1.15 }}>
												{startStr}–{endStr}
												{appt.tipo_consulta ? ` • ${appt.tipo_consulta}` : ''}
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
