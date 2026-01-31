import React from 'react'
import { statusLabel } from '../../utils/consultasStorage'

export default function StatusBadge({ status }) {
	const normalized = String(status || '').toLowerCase()
	return (
		<span
			className={`consulta-badge${
				normalized === 'confirmada'
					? ' is-confirmada'
					: normalized === 'cancelada'
						? ' is-cancelada'
						: normalized === 'remarcada'
							? ' is-remarcada'
							: normalized === 'falta'
								? ' is-falta'
								: ' is-espera'
			}`}
		>
			{statusLabel(status)}
		</span>
	)
}
