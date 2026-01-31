import React from 'react'

export default function ObservacoesAdicionais({ form, updateField }) {
	return (
		<details className="patient-form-section">
			<summary>Observações adicionais</summary>
			<div className="patient-form-grid">
				<label className="patient-form-field patient-form-field-wide">
					<span>Notas</span>
					<textarea rows={4} value={form.observacoesAdicionais} onChange={(e) => updateField('observacoesAdicionais', e.target.value)} />
				</label>
			</div>
		</details>
	)
}
