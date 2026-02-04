import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
	downloadClinicalFile,
	listClinicalFiles,
	listDependentFiles,
	openClinicalFileInNewTab,
} from '../../utils/clinicalFilesApi'

import { formatDatePT } from '../../utils/dateTime'

export default function AnexarExames({ files, onPickFiles, patientId = null, dependentId = null, autoOpen = false }) {
	const detailsRef = useRef(null)

	const canLoadRemote = useMemo(() => {
		const pid = patientId != null && String(patientId).trim() !== ''
		const did = dependentId != null && String(dependentId).trim() !== ''
		return pid || did
	}, [patientId, dependentId])

	const [remoteFiles, setRemoteFiles] = useState([])
	const [remoteLoading, setRemoteLoading] = useState(false)
	const [remoteError, setRemoteError] = useState('')

	useEffect(() => {
		if (!autoOpen) return
		// Abrir a secção quando se navega diretamente para #docs
		setTimeout(() => {
			if (detailsRef.current) detailsRef.current.open = true
		}, 0)
	}, [autoOpen])

	useEffect(() => {
		let mounted = true
		if (!canLoadRemote) return
		setRemoteError('')
		setRemoteLoading(true)
		;(async () => {
			try {
				const rows = dependentId != null && String(dependentId).trim() !== '' ? await listDependentFiles(dependentId) : await listClinicalFiles(patientId)
				if (mounted) setRemoteFiles(Array.isArray(rows) ? rows : [])
			} catch (e) {
				if (mounted) {
					setRemoteFiles([])
					setRemoteError(e?.message || 'Erro ao carregar anexos')
				}
			} finally {
				if (mounted) setRemoteLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [canLoadRemote, patientId, dependentId])

	const pickedFiles = useMemo(
		() => files.filter((f) => typeof File !== 'undefined' && f instanceof File),
		[files]
	)
	const legacyNames = useMemo(
		() => files.filter((f) => !(typeof File !== 'undefined' && f instanceof File)).map((f) => f?.name).filter(Boolean),
		[files]
	)

	return (
		<details ref={detailsRef} className="ui-card p-3 patient-details">
			<summary className="fw-bold" style={{ color: 'rgba(30, 42, 53, 0.92)' }}>
				Anexar exames clínicos
			</summary>
			<div className="row g-3 mt-2">
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Anexos no servidor
					</label>
					{!canLoadRemote ? (
						<div className="form-text">Guarda o utente para poderes ver/baixar os anexos já enviados.</div>
					) : remoteLoading ? (
						<div className="form-text">A carregar anexos…</div>
					) : remoteError ? (
						<div className="alert alert-warning mb-0" role="alert">
							{remoteError}
						</div>
					) : remoteFiles.length ? (
						<div className="ui-table-wrap">
							<table className="table ui-table" aria-label="Anexos">
								<thead>
									<tr>
										<th>Ficheiro</th>
										<th>Tipo</th>
										<th>Tamanho</th>
										<th>Data</th>
										<th className="ui-actions-col">Ações</th>
									</tr>
								</thead>
								<tbody>
									{remoteFiles.map((f) => (
										<tr key={f.id_file}>
											<td style={{ fontWeight: 700 }}>{f.file_name || `Anexo ${f.id_file}`}</td>
											<td>{f.mime_type || '—'}</td>
											<td>{typeof f.size_bytes === 'number' ? `${Math.round(f.size_bytes / 1024)} KB` : '—'}</td>
											<td>{formatDatePT(f.created_at) || '—'}</td>
											<td className="ui-actions-col">
												<div className="ui-actions">
													<button type="button" className="btn btn-light btn-sm" onClick={() => openClinicalFileInNewTab(f.id_file)}>
														Ver
													</button>
													<button type="button" className="btn btn-light btn-sm" onClick={() => downloadClinicalFile(f.id_file)}>
														Baixar
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : legacyNames.length ? (
						<div>
							<div className="form-text mb-2">Anexos antigos (apenas nomes; sem ficheiro associado no servidor).</div>
							<ul className="list-group" aria-label="Anexos (legacy)">
								{legacyNames.map((name) => (
									<li className="list-group-item py-2" key={name}>
										{name}
									</li>
								))}
							</ul>
						</div>
					) : (
						<div className="form-text">Sem anexos.</div>
					)}
				</div>
				<div className="col-12">
					<label className="form-label" style={{ fontSize: 13, fontWeight: 800, color: 'rgba(122, 130, 138, 0.95)' }}>
						Ficheiros
					</label>
					<input className="form-control" type="file" multiple onChange={onPickFiles} />
					{pickedFiles.length ? (
						<ul className="list-group mt-2" aria-label="Ficheiros selecionados">
							{pickedFiles.map((f) => (
								<li className="list-group-item py-2" key={f.name}>
									{f.name}
								</li>
							))}
						</ul>
					) : (
						<div className="form-text">Ainda não selecionaste ficheiros para upload.</div>
					)}
				</div>
			</div>
		</details>
	)
}
