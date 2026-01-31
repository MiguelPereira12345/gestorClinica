import React from 'react'

export default function AnexarExames({ files, onPickFiles }) {
	return (
		<details className="patient-form-section">
			<summary>Anexar exames clínicos</summary>
			<div className="patient-form-grid">
				<label className="patient-form-field patient-form-field-wide">
					<span>Ficheiros</span>
					<input type="file" multiple onChange={onPickFiles} />
					{files.length ? (
						<ul className="patient-form-files" aria-label="Ficheiros selecionados">
							{files.map((f) => (
								<li key={f.name}>{f.name}</li>
							))}
						</ul>
					) : (
						<div className="patient-form-help">Ainda não selecionaste ficheiros.</div>
					)}
				</label>
			</div>
		</details>
	)
}
