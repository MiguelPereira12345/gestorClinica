import React from 'react'

export default function HistoricoMedico({ form, updateField }) {
	return (
		<>
			<details className="patient-form-section">
				<summary>Histórico Médico Geral</summary>
				<div className="patient-form-grid">
					<label className="patient-form-field patient-form-field-wide">
						<span>Condições de saúde pré-existentes</span>
						<textarea rows={3} value={form.condicoesPreExistentes} onChange={(e) => updateField('condicoesPreExistentes', e.target.value)} />
					</label>
					<label className="patient-form-field patient-form-field-wide">
						<span>Medicamentos em uso</span>
						<textarea rows={3} value={form.medicamentosEmUso} onChange={(e) => updateField('medicamentosEmUso', e.target.value)} />
					</label>
					<label className="patient-form-field patient-form-field-wide">
						<span>Alergias conhecidas</span>
						<textarea rows={3} value={form.alergiasConhecidas} onChange={(e) => updateField('alergiasConhecidas', e.target.value)} />
					</label>
					<label className="patient-form-field patient-form-field-wide">
						<span>Histórico cirúrgico relevante</span>
						<textarea rows={3} value={form.historicoCirurgico} onChange={(e) => updateField('historicoCirurgico', e.target.value)} />
					</label>
					<label className="patient-form-field patient-form-field-wide">
						<span>Internações ou tratamentos importantes</span>
						<textarea rows={3} value={form.internacoesTratamentos} onChange={(e) => updateField('internacoesTratamentos', e.target.value)} />
					</label>
					<label className="patient-form-field patient-form-field-wide">
						<span>Gravidez (quando aplicável)</span>
						<textarea rows={2} value={form.gravidez} onChange={(e) => updateField('gravidez', e.target.value)} />
					</label>
				</div>
			</details>
		</>
	)
}

