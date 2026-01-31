import React from 'react'

export default function HistoricoDentario({ form, updateField }) {
	return (
		<details className="ui-card p-3 patient-details">
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Histórico Dentário
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Motivo da consulta inicial
					</label>
					<textarea className="form-control" rows={2} value={form.motivoConsultaInicial} onChange={(e) => updateField('motivoConsultaInicial', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Condições dentárias pré-existentes
					</label>
					<textarea className="form-control" rows={3} value={form.condicoesDentarias} onChange={(e) => updateField('condicoesDentarias', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Tratamentos dentários passados
					</label>
					<textarea className="form-control" rows={3} value={form.historicoTratamentosDentarios} onChange={(e) => updateField('historicoTratamentosDentarios', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Experiência com anestesias
					</label>
					<textarea className="form-control" rows={2} value={form.experienciaAnestesias} onChange={(e) => updateField('experienciaAnestesias', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Dor/desconforto/sensibilidade
					</label>
					<textarea className="form-control" rows={2} value={form.historicoDorSensibilidade} onChange={(e) => updateField('historicoDorSensibilidade', e.target.value)} />
				</div>
			</div>
		</details>
	)
}
