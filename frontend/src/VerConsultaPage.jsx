import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Paperclip, Upload } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'

import StatusBadge from './components/Consultas/StatusBadge'

import { ensureConsultaStored, getConsultaById, patchConsulta } from './utils/consultasStorage'
import { formatDatePT, formatTimePT, parseISOToDate } from './utils/dateTime'
import { getPatientById } from './utils/patientStorage'
import { downloadClinicalFile, listConsultaFiles, openClinicalFileInNewTab, uploadConsultaFile } from './utils/clinicalFilesApi'

function tipoLabelFromMime(mime) {
	if (!mime) return 'Ficheiro'
	if (String(mime).includes('pdf')) return 'PDF'
	if (String(mime).startsWith('image/')) return 'Imagem'
	return 'Ficheiro'
}

function formatMoneyEUR(amount) {
	const n = Number(amount)
	if (Number.isNaN(n)) return '—'
	return n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function openPresenceDeclaration({ patientName, professionalName, dateStr, entryTime }) {
	const html = `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Declaração de Presença</title>
<style>
	body { font-family: Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #1e2a35; padding: 36px; }
	.card { border: 1px solid rgba(30,42,53,0.12); padding: 22px; }
	h1 { font-size: 18px; margin: 0 0 14px; }
	p { margin: 8px 0; font-size: 14px; }
	.small { color: rgba(30,42,53,0.60); font-size: 12px; margin-top: 16px; }
	.sign { margin-top: 28px; display: flex; justify-content: space-between; gap: 20px; }
	.line { border-top: 1px solid rgba(30,42,53,0.20); padding-top: 8px; width: 46%; }
</style>
</head>
<body>
	<div class="card">
		<h1>Declaração de Presença</h1>
		<p>Declara-se que o(a) paciente <strong>${patientName || '—'}</strong> esteve presente na clínica.</p>
		<p>Profissional: <strong>${professionalName || '—'}</strong></p>
		<p>Data: <strong>${dateStr || '—'}</strong></p>
		<p>Hora de Entrada: <strong>${entryTime || '—'}</strong></p>
		<div class="sign">
			<div class="line">Assinatura / Carimbo</div>
			<div class="line">Assinatura do Paciente</div>
		</div>
		<p class="small">Documento gerado a ${new Date().toLocaleString('pt-PT')}</p>
	</div>
	<script>window.print();</script>
</body>
</html>`

	const w = window.open('', '_blank')
	if (!w) return
	w.document.open()
	w.document.write(html)
	w.document.close()
}

export default function VerConsultaPage() {
	const navigate = useNavigate()
	const { id } = useParams()
	const fileInputRef = useRef(null)
	const [rev, setRev] = useState(0)

	useMemo(() => {
		ensureConsultaStored(id)
	}, [id])

	const consulta = useMemo(() => getConsultaById(id), [id, rev])
	const patient = useMemo(() => (consulta?.patientId ? getPatientById(consulta.patientId) : null), [consulta?.patientId])
	const patientData = patient?.data || {}

	const [consultaFiles, setConsultaFiles] = useState([])
	const [filesLoading, setFilesLoading] = useState(false)
	const [filesError, setFilesError] = useState('')

	const [presenceEntryTime, setPresenceEntryTime] = useState(() => {
		const d = parseISOToDate(consulta?.startISO)
		if (!d) return ''
		const entry = new Date(d.getTime() - 5 * 60000)
		return `${String(entry.getHours()).padStart(2, '0')}:${String(entry.getMinutes()).padStart(2, '0')}`
	})

	if (!consulta) {
		return (
			<AppLayout breadcrumb="Consultas > Detalhes" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<div className="fw-bold">Consulta não encontrada</div>
						<div className="ui-meta mt-1">Verifica o link ou volta à lista.</div>
						<div className="d-flex justify-content-start mt-3">
							<button type="button" className="btn btn-secondary" onClick={() => navigate('/consultas')}>
								<ArrowLeft size={16} aria-hidden="true" />
								Voltar à lista
							</button>
						</div>
					</div>
				</div>
			</AppLayout>
		)
	}

	const subtitle = `${formatDatePT(consulta.startISO)} às ${formatTimePT(consulta.startISO)} • ${consulta.specialty || '—'} • ${consulta.medicoName || '—'}`
	const billing = consulta.billing || null
	const attachments = Array.isArray(consulta.attachments) ? consulta.attachments : []

	useEffect(() => {
		let mounted = true
		if (!consulta?.id) return

		setFilesError('')
		setFilesLoading(true)
		;(async () => {
			try {
				const rows = await listConsultaFiles(consulta.id)
				if (mounted) setConsultaFiles(rows)
			} catch (e) {
				if (mounted) {
					setConsultaFiles([])
					setFilesError(e?.message || 'Erro ao carregar anexos')
				}
			} finally {
				if (mounted) setFilesLoading(false)
			}
		})()

		return () => {
			mounted = false
		}
	}, [consulta?.id])

	async function onUploadFiles(files) {
		if (!files?.length) return
		if (!consulta?.id) return

		setFilesError('')
		setFilesLoading(true)
		try {
			for (const f of files) {
				if (f.size > 8 * 1024 * 1024) {
					window.alert(`O ficheiro “${f.name}” é demasiado grande (máx 8MB).`)
					continue
				}
				await uploadConsultaFile({ consultaId: consulta.id, patientId: consulta.patientId || null, file: f })
			}
			const rows = await listConsultaFiles(consulta.id)
			setConsultaFiles(rows)
		} catch (e) {
			setFilesError(e?.message || 'Sem permissão')
		} finally {
			setFilesLoading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	return (
		<AppLayout
			breadcrumb="Consultas > Detalhes"
			userName="Dra. Sofia Lima"
			actions={
				<>
					<button type="button" className="btn btn-secondary" onClick={() => navigate('/consultas')}>
						<ArrowLeft size={16} aria-hidden="true" />
						Voltar à lista
					</button>
					<button type="button" className="btn btn-primary app-action-primary" onClick={() => navigate(`/consultas/${consulta.id}/editar`)}>
						Editar Consulta
					</button>
				</>
			}
		>
			<div className="ui-page">
				<div className="ui-page-header">
					<div>
						<h1 className="ui-page-title">{(consulta.dependentName || consulta.patientName) || 'Consulta'}</h1>
						<div className="ui-page-subtitle">{subtitle}</div>
					</div>
				</div>

				<div className="row g-3">
					<div className="col-12 col-lg-7">
						<section className="ui-card p-3" aria-label="Detalhes da Consulta">
							<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
								<div>
									<div className="fw-bold">Detalhes da Consulta</div>
									<div className="ui-meta">Informação principal e estado</div>
								</div>
								<StatusBadge status={consulta.bookingStatus} />
							</div>

							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Paciente</div></div>
								<div className="col">
									<div className="fw-semibold">{consulta.dependentName || consulta.patientName || '—'}</div>
									{consulta.dependentName && consulta.patientName ? (
										<div className="text-muted small">Responsável: {consulta.patientName}</div>
									) : null}
								</div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Profissional</div></div>
								<div className="col"><div className="fw-semibold">{consulta.medicoName || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Especialidade</div></div>
								<div className="col"><div className="fw-semibold">{consulta.specialty || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Data</div></div>
								<div className="col"><div className="fw-semibold">{formatDatePT(consulta.startISO) || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Hora</div></div>
								<div className="col"><div className="fw-semibold">{formatTimePT(consulta.startISO) || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Duração</div></div>
								<div className="col"><div className="fw-semibold">{consulta.durationMin ? `${consulta.durationMin} min` : '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Tipo</div></div>
								<div className="col"><div className="fw-semibold">{consulta.bookingType || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Motivo</div></div>
								<div className="col"><div className="fw-semibold">{consulta.firstVisitReason || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5 col-md-4"><div className="ui-meta">Notas internas</div></div>
								<div className="col"><div className="fw-semibold">{consulta.notes || '—'}</div></div>
							</div>
						</section>
					</div>

					<div className="col-12 col-lg-5">
						<section className="ui-card p-3" aria-label="Paciente e anexos">
							<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
								<div>
									<div className="fw-bold">Paciente</div>
									<div className="ui-meta">Contactos e identificadores</div>
								</div>
								<button type="button" className="btn btn-light btn-sm" onClick={() => consulta.patientId && navigate(`/pacientes/${consulta.patientId}`)}>
									Ver ficha
								</button>
							</div>

							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5"><div className="ui-meta">Data de Nascimento</div></div>
								<div className="col"><div className="fw-semibold">{patientData.dataNascimento || '—'}</div></div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5"><div className="ui-meta">Contacto</div></div>
								<div className="col">
									<div className="fw-semibold">{patientData.contactoTelefone || '—'}</div>
									{patientData.contactoEmail ? <div className="ui-meta mt-1">{patientData.contactoEmail}</div> : null}
								</div>
							</div>
							<div className="row g-2 align-items-baseline py-2 border-top">
								<div className="col-5"><div className="ui-meta">Nº Utente</div></div>
								<div className="col"><div className="fw-semibold">{patientData.numeroUtente || '—'}</div></div>
							</div>

							<div className="mt-3">
								<div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
									<div className="fw-bold">Anexos</div>
								</div>

								{filesError ? (
									<div className="alert alert-warning py-2" role="alert">
										{filesError}
									</div>
								) : null}

								<div className="table-responsive">
									<table className="table table-sm align-middle mb-0" aria-label="Anexos">
										<thead>
											<tr>
												<th>Ficheiro</th>
												<th>Tipo</th>
												<th>Adicionado</th>
												<th className="text-end">Ações</th>
											</tr>
										</thead>
										<tbody>
											{filesLoading ? (
												<tr>
													<td colSpan={4} className="ui-meta">
														A carregar…
													</td>
												</tr>
											) : consultaFiles.length > 0 ? (
												consultaFiles.map((f) => (
													<tr key={f.id_file}>
														<td className="fw-bold">
															<Paperclip size={14} className="me-2" aria-hidden="true" />
															{f.file_name || `Anexo ${f.id_file}`}
														</td>
														<td>{tipoLabelFromMime(f.mime_type)}</td>
														<td>{formatDatePT(f.created_at) || '—'}</td>
														<td className="text-end">
															<div className="btn-group" role="group" aria-label="Ações do anexo">
																<button type="button" className="btn btn-light btn-sm" onClick={() => openClinicalFileInNewTab(f.id_file)}>
																	Ver
																</button>
																<button type="button" className="btn btn-light btn-sm" onClick={() => downloadClinicalFile(f.id_file)}>
																	Baixar
																</button>
															</div>
														</td>
													</tr>
												))
											) : attachments.length === 0 ? (
												<tr>
													<td colSpan={4} className="ui-meta">
														Sem anexos.
													</td>
												</tr>
											) : (
												attachments.map((a) => (
													<tr key={a.id}>
														<td>
															<Paperclip size={14} className="me-2" aria-hidden="true" />
															{a.dataUrl ? (
																<a className="link-dark fw-bold text-decoration-none" href={a.dataUrl} target="_blank" rel="noreferrer">
																	{a.filename}
																</a>
															) : (
																	<span className="fw-bold">{a.filename}</span>
															)}
														</td>
														<td>{tipoLabelFromMime(a.mimeType)}</td>
														<td>{formatDatePT(a.addedAtISO) || '—'}</td>
														<td className="text-end"><span className="ui-meta">Local</span></td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>

								<div className="d-flex justify-content-start mt-2">
									<input
										ref={fileInputRef}
										type="file"
										multiple
										accept="application/pdf,image/*"
										className="d-none"
										onChange={(e) => onUploadFiles(Array.from(e.target.files || []))}
									/>
									<button type="button" className="btn btn-light btn-sm" onClick={() => fileInputRef.current?.click()} disabled={filesLoading}>
										<Upload size={16} aria-hidden="true" />
										Carregar ficheiro
									</button>
								</div>
							</div>
						</section>
					</div>
				</div>

				<div className="row g-3 mt-3">
					<div className="col-12 col-lg-7">
						<section className="ui-card p-3" aria-label="Declaração de Presença">
							<div className="mb-2">
								<div className="fw-bold">Declaração de Presença</div>
								<div className="ui-meta">Emitir comprovativo de presença do paciente</div>
							</div>

							<div className="row g-3">
								<div className="col-md-6">
									<label className="form-label">Paciente</label>
									<input className="form-control" value={(consulta.dependentName || consulta.patientName) || ''} readOnly />
									{consulta.dependentName && consulta.patientName ? (
										<div className="form-text">Responsável: {consulta.patientName}</div>
									) : null}
								</div>
								<div className="col-md-6">
									<label className="form-label">Profissional</label>
									<input className="form-control" value={consulta.medicoName || ''} readOnly />
								</div>
								<div className="col-md-6">
									<label className="form-label">Data</label>
									<input className="form-control" value={formatDatePT(consulta.startISO) || ''} readOnly />
								</div>
								<div className="col-md-6">
									<label className="form-label">Hora de Entrada</label>
									<input type="time" className="form-control" value={presenceEntryTime} onChange={(e) => setPresenceEntryTime(e.target.value)} />
								</div>
							</div>

							<div className="d-flex justify-content-end mt-3">
								<button
								type="button"
								className="btn btn-primary"
								onClick={() =>
									openPresenceDeclaration({
												patientName: consulta.dependentName
													? `${consulta.dependentName}${consulta.patientName ? ` (Dependente de ${consulta.patientName})` : ' (Dependente)'}`
													: consulta.patientName,
										professionalName: consulta.medicoName,
										dateStr: formatDatePT(consulta.startISO),
										entryTime: presenceEntryTime,
									})
								}
							>
								Emitir declaração
								</button>
						</div>
					</section>
					</div>


				</div>
			</div>
		</AppLayout>
	)
}

