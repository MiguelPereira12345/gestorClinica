import React from 'react'

export default function IdentificacaoPessoal({ form, updateField }) {
	return (
		<details className="patient-form-section" open>
			<summary>Registo dos Pacientes — Identificação Pessoal</summary>
			<div className="patient-form-grid">
				<label className="patient-form-field">
					<span>Nome completo *</span>
					<input type="text" value={form.nomeCompleto} onChange={(e) => updateField('nomeCompleto', e.target.value)} required />
				</label>

				<label className="patient-form-field">
					<span>Data de nascimento</span>
					<input type="date" value={form.dataNascimento} onChange={(e) => updateField('dataNascimento', e.target.value)} />
				</label>

				<label className="patient-form-field">
					<span>Sexo</span>
					<select value={form.sexo} onChange={(e) => updateField('sexo', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Feminino">Feminino</option>
						<option value="Masculino">Masculino</option>
						<option value="Outro">Outro</option>
						<option value="Prefere não dizer">Prefere não dizer</option>
					</select>
				</label>

				<label className="patient-form-field patient-form-field-wide">
					<span>Endereço</span>
					<input type="text" value={form.endereco} onChange={(e) => updateField('endereco', e.target.value)} />
				</label>

				<label className="patient-form-field">
					<span>Contacto (telefone)</span>
					<input type="tel" value={form.contactoTelefone} onChange={(e) => updateField('contactoTelefone', e.target.value)} />
				</label>

				<label className="patient-form-field">
					<span>Contacto (email)</span>
					<input type="email" value={form.contactoEmail} onChange={(e) => updateField('contactoEmail', e.target.value)} />
				</label>

				<label className="patient-form-field">
					<span>Nº de utente (se aplicável)</span>
					<input type="text" value={form.numeroUtente} onChange={(e) => updateField('numeroUtente', e.target.value)} />
				</label>

				<label className="patient-form-field">
					<span>NIF</span>
					<input type="text" value={form.nif} onChange={(e) => updateField('nif', e.target.value)} />
				</label>

				<label className="patient-form-field patient-form-field-wide">
					<span>Subsistemas de saúde</span>
					<input type="text" value={form.subsistemasSaude} onChange={(e) => updateField('subsistemasSaude', e.target.value)} />
				</label>

				<label className="patient-form-field">
					<span>Estado civil</span>
					<select value={form.estadoCivil} onChange={(e) => updateField('estadoCivil', e.target.value)}>
						<option value="">Selecionar…</option>
						<option value="Solteiro(a)">Solteiro(a)</option>
						<option value="Casado(a)">Casado(a)</option>
						<option value="União de facto">União de facto</option>
						<option value="Divorciado(a)">Divorciado(a)</option>
						<option value="Viúvo(a)">Viúvo(a)</option>
					</select>
				</label>

				<label className="patient-form-field">
					<span>Profissão</span>
					<input type="text" value={form.profissao} onChange={(e) => updateField('profissao', e.target.value)} />
				</label>
			</div>
		</details>
	)
}
