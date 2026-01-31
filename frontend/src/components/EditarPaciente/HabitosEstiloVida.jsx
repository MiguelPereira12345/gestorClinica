import React from 'react'

export default function HabitosEstiloVida({ form, updateField }) {
	return (
		<details className="patient-form-section">
			<summary>Hábitos e Estilo de Vida</summary>
			<div className="patient-form-grid">
				<label className="patient-form-field patient-form-field-wide">
					<span>Hábitos de higiene oral</span>
					<textarea rows={3} value={form.habitosHigieneOral} onChange={(e) => updateField('habitosHigieneOral', e.target.value)} />
				</label>
				<label className="patient-form-field patient-form-field-wide">
					<span>Hábitos alimentares</span>
					<textarea rows={3} value={form.habitosAlimentares} onChange={(e) => updateField('habitosAlimentares', e.target.value)} />
				</label>

				<label className="patient-form-field">
					<span>Tabaco</span>
					<select value={form.consumoTabaco} onChange={(e) => updateField('consumoTabaco', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Não">Não</option>
						<option value="Ocasional">Ocasional</option>
						<option value="Regular">Regular</option>
					</select>
				</label>
				<label className="patient-form-field">
					<span>Álcool</span>
					<select value={form.consumoAlcool} onChange={(e) => updateField('consumoAlcool', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Não">Não</option>
						<option value="Ocasional">Ocasional</option>
						<option value="Regular">Regular</option>
					</select>
				</label>
				<label className="patient-form-field">
					<span>Drogas</span>
					<select value={form.consumoDrogas} onChange={(e) => updateField('consumoDrogas', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Não">Não</option>
						<option value="Ocasional">Ocasional</option>
						<option value="Regular">Regular</option>
					</select>
				</label>

				<label className="patient-form-field patient-form-checkbox">
					<input type="checkbox" checked={!!form.bruxismo} onChange={(e) => updateField('bruxismo', e.target.checked)} />
					<span>Bruxismo (aperto/ranger)</span>
				</label>

				<label className="patient-form-field patient-form-field-wide">
					<span>Atividades desportivas</span>
					<textarea rows={2} value={form.atividadesDesportivas} onChange={(e) => updateField('atividadesDesportivas', e.target.value)} />
				</label>
			</div>
		</details>
	)
}
