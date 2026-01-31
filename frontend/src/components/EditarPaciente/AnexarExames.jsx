import React from 'react'

export default function AnexarExames({ files, onPickFiles }) {
	return (
		<details className="ui-card p-3 patient-details">
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Anexar exames clínicos
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Ficheiros
					</label>
					<input className="form-control" type="file" multiple onChange={onPickFiles} />
					{files.length ? (
						<ul className="list-group mt-2" aria-label="Ficheiros selecionados">
							{files.map((f) => (
								<li className="list-group-item py-2" key={f.name}>
									{f.name}
								</li>
							))}
						</ul>
					) : (
						<div className="form-text">Ainda não selecionaste ficheiros.</div>
					)}
				</div>
			</div>
		</details>
	)
}
