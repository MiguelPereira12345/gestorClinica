import React from 'react'

export default function HabitosEstiloVida({ form, updateField }) {
	return (
		<details className="ui-card p-3 patient-details">
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Hábitos e Estilo de Vida
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Hábitos de higiene oral
					</label>
					<textarea className="form-control" rows={3} value={form.habitosHigieneOral} onChange={(e) => updateField('habitosHigieneOral', e.target.value)} />
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Hábitos alimentares
					</label>
					<textarea className="form-control" rows={3} value={form.habitosAlimentares} onChange={(e) => updateField('habitosAlimentares', e.target.value)} />
				</div>

				<div className="col-12 col-md-4">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Tabaco
					</label>
					<select className="form-select" value={form.consumoTabaco} onChange={(e) => updateField('consumoTabaco', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Não">Não</option>
						<option value="Ocasional">Ocasional</option>
						<option value="Regular">Regular</option>
					</select>
				</div>
				<div className="col-12 col-md-4">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Álcool
					</label>
					<select className="form-select" value={form.consumoAlcool} onChange={(e) => updateField('consumoAlcool', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Não">Não</option>
						<option value="Ocasional">Ocasional</option>
						<option value="Regular">Regular</option>
					</select>
				</div>
				<div className="col-12 col-md-4">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Drogas
					</label>
					<select className="form-select" value={form.consumoDrogas} onChange={(e) => updateField('consumoDrogas', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Não">Não</option>
						<option value="Ocasional">Ocasional</option>
						<option value="Regular">Regular</option>
					</select>
				</div>

				<div className="col-12">
					<div className="form-check">
						<input
							className="form-check-input"
							type="checkbox"
							checked={!!form.bruxismo}
							onChange={(e) => updateField('bruxismo', e.target.checked)}
							id="edit-patient-bruxismo"
						/>
						<label className="form-check-label" htmlFor="edit-patient-bruxismo" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
							Bruxismo (aperto/ranger)
						</label>
					</div>
				</div>

				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Atividades desportivas
					</label>
					<textarea className="form-control" rows={2} value={form.atividadesDesportivas} onChange={(e) => updateField('atividadesDesportivas', e.target.value)} />
				</div>
			</div>
		</details>
	)
}
