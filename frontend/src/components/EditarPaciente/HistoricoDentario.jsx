import React from 'react'

export default function HistoricoDentario({ form, updateField }) {
	return (
		<details className="patient-form-section">
			<summary>Histórico Dentário</summary>
			<div className="patient-form-grid">
				<label className="patient-form-field patient-form-field-wide">
					<span>Motivo da consulta inicial</span>
					<textarea rows={2} value={form.motivoConsultaInicial} onChange={(e) => updateField('motivoConsultaInicial', e.target.value)} />
				</label>
				<label className="patient-form-field patient-form-field-wide">
					<span>Condições dentárias pré-existentes</span>
					<textarea rows={3} value={form.condicoesDentarias} onChange={(e) => updateField('condicoesDentarias', e.target.value)} />
				</label>
				<label className="patient-form-field patient-form-field-wide">
					<span>Tratamentos dentários passados</span>
					<textarea rows={3} value={form.historicoTratamentosDentarios} onChange={(e) => updateField('historicoTratamentosDentarios', e.target.value)} />
				</label>
				<label className="patient-form-field patient-form-field-wide">
					<span>Experiência com anestesias</span>
					<textarea rows={2} value={form.experienciaAnestesias} onChange={(e) => updateField('experienciaAnestesias', e.target.value)} />
				</label>
				<label className="patient-form-field patient-form-field-wide">
					<span>Dor/desconforto/sensibilidade</span>
					<textarea rows={2} value={form.historicoDorSensibilidade} onChange={(e) => updateField('historicoDorSensibilidade', e.target.value)} />
				</label>
			</div>
		</details>
	)
}
