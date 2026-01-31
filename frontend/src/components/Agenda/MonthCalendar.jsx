import React from 'react'
import './Agenda.css'

function startOfDay(date) {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d
}

export default function MonthCalendar({
	currentDate,
	selectedDate,
	onSelectDate,
	onPrevMonth,
	onNextMonth,
	getDayMeta,
	getDayCount,
}) {
	const year = currentDate.getFullYear()
	const month = currentDate.getMonth()

	const first = new Date(year, month, 1)
	const last = new Date(year, month + 1, 0)
	const daysBefore = first.getDay() === 0 ? 6 : first.getDay() - 1 // start monday

	const selectedKey = selectedDate ? startOfDay(selectedDate).toDateString() : ''

	const cells = []
	for (let i = 0; i < daysBefore; i++) cells.push(null)
	for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))

	function statusLabel(status) {
		if (status === 'holiday') return 'Feriado'
		if (status === 'closed') return 'Fechado'
		if (status === 'noslots') return 'Sem vagas'
		return 'Aberto'
	}

	return (
		<div className="w-100">
			<div className="d-flex justify-content-between align-items-center mb-2">
				<button
					type="button"
					onClick={onPrevMonth}
					className="btn btn-light btn-sm border fw-bold"
					style={{ width: 36, height: 36, padding: 0 }}
					aria-label="Mês anterior"
				>
					&lt;
				</button>
				<div className="fw-bold text-capitalize">
					{currentDate.toLocaleString(undefined, { month: 'long' })} {year}
				</div>
				<button
					type="button"
					onClick={onNextMonth}
					className="btn btn-light btn-sm border fw-bold"
					style={{ width: 36, height: 36, padding: 0 }}
					aria-label="Mês seguinte"
				>
					&gt;
				</button>
			</div>

			<div className="moc-grid" role="grid" aria-label="Calendário mensal">
				{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((h) => (
					<div key={h} className="text-center text-muted small" role="columnheader">
						{h}
					</div>
				))}

				{cells.map((c, i) => {
					if (!c) {
						return (
							<div
								key={i}
								className="rounded-3 bg-transparent"
								style={{ minHeight: 54 }}
								role="gridcell"
								aria-disabled="true"
							/>
						)
					}

					const meta = typeof getDayMeta === 'function' ? getDayMeta(c) : null
					const status = meta?.status || ''
					const occ = typeof meta?.occupancy === 'number' ? meta.occupancy : null

					const occBucket =
						occ == null
							? ''
							: occ >= 0.8
								? 'occ-4'
								: occ >= 0.6
									? 'occ-3'
									: occ >= 0.35
										? 'occ-2'
										: occ > 0
											? 'occ-1'
											: 'occ-0'

					const isToday = c.toDateString() === new Date().toDateString()
					const isSelected = c.toDateString() === selectedKey

					const count = typeof getDayCount === 'function' ? getDayCount(c) : 0
					const occText = occ == null ? '' : `${Math.round(occ * 100)}%`

					return (
						<button
							key={i}
							type="button"
							className={`moc-cell d-flex align-items-start justify-content-between gap-2 text-start border rounded-3 p-2 bg-white bg-opacity-75 ${isToday ? 'today' : ''} ${isSelected ? 'is-selected' : ''} ${status ? `moc-${status}` : ''} ${occBucket ? `moc-${occBucket}` : ''}`}
							onClick={() => onSelectDate && onSelectDate(c)}
							title={
								meta
									? `${status === 'holiday' ? 'Feriado' : status === 'closed' ? 'Fechado' : 'Aberto'}${occ == null ? '' : ` • Ocupação: ${Math.round(occ * 100)}%`}${count ? ` • Consultas: ${count}` : ''}`
									: undefined
							}
						>
							<div className="d-flex flex-column gap-1 flex-grow-1" style={{ minWidth: 0 }}>
								<span className="fw-bold text-dark">{c.getDate()}</span>
								{meta ? (
									<div className="small text-muted lh-sm">
										<div className="fw-semibold">{statusLabel(status)}</div>
										{occText ? <div>Ocupação: {occText}</div> : null}
									</div>
								) : null}
							</div>
							{count > 0 ? (
								<span className="badge rounded-pill text-bg-light border text-dark fw-semibold">
									{count}
								</span>
							) : null}
						</button>
					)
				})}
			</div>
		</div>
	)
}
