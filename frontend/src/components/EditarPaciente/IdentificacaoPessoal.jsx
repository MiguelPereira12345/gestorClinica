import React from 'react'
import { sanitizeDigits, sanitizeName, sanitizePhone } from '../../utils/validation'

export default function IdentificacaoPessoal({ form, updateField, disabled = false }) {
	return (
		<details className="ui-card p-3 patient-details" open>
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Registo dos Utentes — Identificação Pessoal
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Nome completo *
					</label>
					<input className="form-control" type="text" value={form.nomeCompleto} onChange={(e) => updateField('nomeCompleto', sanitizeName(e.target.value))} required disabled={disabled} />
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Data de nascimento
					</label>
					<input className="form-control" type="date" value={form.dataNascimento} onChange={(e) => updateField('dataNascimento', e.target.value)} disabled={disabled} />
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Sexo
					</label>
					<select className="form-select" value={form.sexo} onChange={(e) => updateField('sexo', e.target.value)} disabled={disabled}>
						<option value="">Selecionar…</option>
						<option value="Feminino">Feminino</option>
						<option value="Masculino">Masculino</option>
						<option value="Outro">Outro</option>
						<option value="Prefere não dizer">Prefere não dizer</option>
					</select>
				</div>

				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Endereço
					</label>
					<input className="form-control" type="text" value={form.endereco} onChange={(e) => updateField('endereco', e.target.value)} disabled={disabled} />
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Contacto (telefone)
					</label>
					<input className="form-control" type="tel" value={form.contactoTelefone} onChange={(e) => updateField('contactoTelefone', sanitizePhone(e.target.value))} disabled={disabled} />
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Contacto (email)
					</label>
					<input className="form-control" type="email" value={form.contactoEmail} onChange={(e) => updateField('contactoEmail', e.target.value)} disabled={disabled} />
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Nº de utente (se aplicável)
					</label>
					<input className="form-control" type="text" inputMode="numeric" maxLength={9} value={form.numeroUtente} onChange={(e) => updateField('numeroUtente', sanitizeDigits(e.target.value, { maxDigits: 9 }))} disabled={disabled} />
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						NIF *
					</label>
					<input className="form-control" type="text" inputMode="numeric" maxLength={9} value={form.nif} onChange={(e) => updateField('nif', sanitizeDigits(e.target.value, { maxDigits: 9 }))} required disabled={disabled} />
				</div>

				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Subsistemas de saúde
					</label>
					<input className="form-control" type="text" value={form.subsistemasSaude} onChange={(e) => updateField('subsistemasSaude', e.target.value)} disabled={disabled} />
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Estado civil
					</label>
					<select className="form-select" value={form.estadoCivil} onChange={(e) => updateField('estadoCivil', e.target.value)} disabled={disabled}>
						<option value="">Selecionar…</option>
						<option value="Solteiro(a)">Solteiro(a)</option>
						<option value="Casado(a)">Casado(a)</option>
						<option value="União de facto">União de facto</option>
						<option value="Divorciado(a)">Divorciado(a)</option>
						<option value="Viúvo(a)">Viúvo(a)</option>
					</select>
				</div>

				<div className="col-12 col-md-6">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Profissão
					</label>
					<input className="form-control" type="text" value={form.profissao} onChange={(e) => updateField('profissao', e.target.value)} disabled={disabled} />
				</div>
			</div>
		</details>
	)
}
