import React from 'react'

export default function InfoField({ label, value }) {
	return (
		<div className="col-12 col-lg-6">
			<div
				className="border rounded-2 p-3 h-100"
				style={{ background: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(30, 42, 53, 0.08)' }}
			>
				<div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(122, 130, 138, 0.95)', marginBottom: 6 }}>{label}</div>
				<div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(30, 42, 53, 0.92)', whiteSpace: 'pre-wrap' }}>{value || '—'}</div>
			</div>
		</div>
	)
}
