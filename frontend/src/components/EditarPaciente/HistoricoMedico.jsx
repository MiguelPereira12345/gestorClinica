import React from 'react'

export default function HistoricoMedico({ form, updateField }) {
	return (
		<details className="ui-card p-3 patient-details">
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Histórico Médico Geral
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Condições de saúde pré-existentes
					</label>
					<textarea className="form-control" rows={3} value={form.condicoesPreExistentes} onChange={(e) => updateField('condicoesPreExistentes', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Medicamentos em uso
					</label>
					<textarea className="form-control" rows={3} value={form.medicamentosEmUso} onChange={(e) => updateField('medicamentosEmUso', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Alergias conhecidas
					</label>
					<textarea className="form-control" rows={3} value={form.alergiasConhecidas} onChange={(e) => updateField('alergiasConhecidas', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Histórico cirúrgico relevante
					</label>
					<textarea className="form-control" rows={3} value={form.historicoCirurgico} onChange={(e) => updateField('historicoCirurgico', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Internações ou tratamentos importantes
					</label>
					<textarea className="form-control" rows={3} value={form.internacoesTratamentos} onChange={(e) => updateField('internacoesTratamentos', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Gravidez (quando aplicável)
					</label>
					<textarea className="form-control" rows={2} value={form.gravidez} onChange={(e) => updateField('gravidez', e.target.value)} />
				</div>
			</div>
		</details>
	)
}

