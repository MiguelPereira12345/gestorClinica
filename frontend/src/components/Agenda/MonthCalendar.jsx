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
		<div className="moc-root">
			<div className="moc-header">
				<button type="button" onClick={onPrevMonth} className="moc-nav" aria-label="Mês anterior">
					&lt;
				</button>
				<div className="moc-title">
					{currentDate.toLocaleString(undefined, { month: 'long' })} {year}
				</div>
				<button type="button" onClick={onNextMonth} className="moc-nav" aria-label="Mês seguinte">
					&gt;
				</button>
			</div>

			<div className="moc-grid" role="grid" aria-label="Calendário mensal">
				{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((h) => (
					<div key={h} className="moc-weekday" role="columnheader">
						{h}
					</div>
				))}

				{cells.map((c, i) => {
					if (!c) {
						return <div key={i} className="moc-cell is-empty" role="gridcell" aria-disabled="true" />
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
							className={`moc-cell ${isToday ? 'today' : ''} ${isSelected ? 'is-selected' : ''} ${status ? `moc-${status}` : ''} ${occBucket ? `moc-${occBucket}` : ''}`}
							onClick={() => onSelectDate && onSelectDate(c)}
							title={
								meta
									? `${status === 'holiday' ? 'Feriado' : status === 'closed' ? 'Fechado' : 'Aberto'}${occ == null ? '' : ` • Ocupação: ${Math.round(occ * 100)}%`}${count ? ` • Consultas: ${count}` : ''}`
									: undefined
							}
						>
							<div className="moc-left">
								<span className="moc-daynum">{c.getDate()}</span>
								{meta ? (
									<div className="moc-meta">
										<span className="moc-meta-status">{statusLabel(status)}</span>
										{occText ? <span className="moc-meta-occ">Ocupação: {occText}</span> : null}
									</div>
								) : null}
							</div>
							{count > 0 ? <span className="moc-badge">{count}</span> : null}
						</button>
					)
				})}
			</div>
		</div>
	)
}
