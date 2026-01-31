import React from 'react'

export default function ObservacoesAdicionais({ form, updateField }) {
	return (
		<details className="ui-card p-3 patient-details">
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Observações adicionais
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Notas
					</label>
					<textarea className="form-control" rows={4} value={form.observacoesAdicionais} onChange={(e) => updateField('observacoesAdicionais', e.target.value)} />
				</div>
			</div>
		</details>
	)
}
