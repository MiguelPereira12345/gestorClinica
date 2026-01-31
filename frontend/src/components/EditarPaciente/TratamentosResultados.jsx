import React from 'react'

export default function TratamentosResultados({ form, updateField }) {
	return (
		<details className="ui-card p-3 patient-details">
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Tratamentos anteriores e resultados
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Histórico de tratamentos
					</label>
					<textarea className="form-control" rows={3} value={form.historicoTratamentos} onChange={(e) => updateField('historicoTratamentos', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Resultados de tratamentos anteriores
					</label>
					<textarea className="form-control" rows={3} value={form.resultadosTratamentos} onChange={(e) => updateField('resultadosTratamentos', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Planos de tratamento
					</label>
					<textarea className="form-control" rows={3} value={form.planosTratamento} onChange={(e) => updateField('planosTratamento', e.target.value)} />
				</div>
			</div>
		</details>
	)
}
