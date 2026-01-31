import React from 'react'

export default function TratamentosResultados({ form, updateField }) {
	return (
		<details className="patient-form-section">
			<summary>Tratamentos anteriores e resultados</summary>
			<div className="patient-form-grid">
				<label className="patient-form-field patient-form-field-wide">
					<span>Histórico de tratamentos</span>
					<textarea rows={3} value={form.historicoTratamentos} onChange={(e) => updateField('historicoTratamentos', e.target.value)} />
				</label>
				<label className="patient-form-field patient-form-field-wide">
					<span>Resultados de tratamentos anteriores</span>
					<textarea rows={3} value={form.resultadosTratamentos} onChange={(e) => updateField('resultadosTratamentos', e.target.value)} />
				</label>
				<label className="patient-form-field patient-form-field-wide">
					<span>Planos de tratamento</span>
					<textarea rows={3} value={form.planosTratamento} onChange={(e) => updateField('planosTratamento', e.target.value)} />
				</label>
			</div>
		</details>
	)
}
