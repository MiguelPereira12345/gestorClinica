import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Paperclip, Upload } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Consultas.css'

import StatusBadge from './components/Consultas/StatusBadge'

import { ensureConsultaStored, getConsultaById, patchConsulta } from './utils/consultasStorage'
import { formatDatePT, formatTimePT, parseISOToDate } from './utils/dateTime'
import { getPatientById } from './utils/patientStorage'

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

export default function VerConsulta() {
	const navigate = useNavigate()
	const { id } = useParams()

	useMemo(() => {
		// garantir que os exemplos (demo) ficam editáveis
		ensureConsultaStored(id)
	}, [id])

	const consulta = useMemo(() => getConsultaById(id), [id])
	const fileInputRef = useRef(null)

	const patient = useMemo(() => (consulta?.patientId ? getPatientById(consulta.patientId) : null), [consulta?.patientId])
	const patientData = patient?.data || {}

	const [presenceEntryTime, setPresenceEntryTime] = useState(() => {
		const d = parseISOToDate(consulta?.startISO)
		if (!d) return ''
		const entry = new Date(d.getTime() - 5 * 60000)
		return `${String(entry.getHours()).padStart(2, '0')}:${String(entry.getMinutes()).padStart(2, '0')}`
	})

	if (!consulta) {
		return (
			<AppLayout breadcrumb="Consultas > Detalhes" userName="Dra. Sofia Lima">
				<div className="consultas-page">
					<div className="consulta-card">
						<div className="consulta-card-title">Consulta não encontrada</div>
						<div className="consulta-card-sub">Verifica o link ou volta à lista.</div>
						<div className="consulta-card-footer">
							<button type="button" className="consultas-btn" onClick={() => navigate('/consultas')}>
								<ArrowLeft className="consultas-btn-icon" aria-hidden="true" />
								Voltar à lista
							</button>
						</div>
					</div>
				</div>
			</AppLayout>
		)
	}

	const subtitle = `${formatDatePT(consulta.startISO)} às ${formatTimePT(consulta.startISO)} • ${consulta.specialty || '—'} • ${consulta.medicoName || '—'}`
	const attachments = Array.isArray(consulta.attachments) ? consulta.attachments : []
	const billing = consulta.billing || null

	async function onUploadFiles(files) {
		if (!files?.length) return
		const next = []
		for (const f of files) {
			if (f.size > 8 * 1024 * 1024) {
				window.alert(`O ficheiro “${f.name}” é demasiado grande (máx 8MB).`)
				continue
			}
			const dataUrl = await new Promise((resolve) => {
				const reader = new FileReader()
				reader.onload = () => resolve(String(reader.result || ''))
				reader.onerror = () => resolve('')
				reader.readAsDataURL(f)
			})
			next.push({
				id: `A${Date.now()}_${Math.random().toString(16).slice(2)}`,
				filename: f.name,
				mimeType: f.type || 'application/octet-stream',
				addedAtISO: new Date().toISOString(),
				dataUrl,
			})
		}
		if (next.length === 0) return
		patchConsulta(consulta.id, { attachments: [...next, ...attachments] })
		window.location.reload()
	}

	return (
		<AppLayout
			breadcrumb="Consultas > Detalhes"
			userName="Dra. Sofia Lima"
			actions={
				<>
					<button type="button" className="consultas-btn" onClick={() => navigate('/consultas')}>
						<ArrowLeft className="consultas-btn-icon" aria-hidden="true" />
						Voltar à lista
					</button>
					<button type="button" className="app-action-primary" onClick={() => navigate(`/consultas/${consulta.id}/editar`)}>
						Editar Consulta
					</button>
				</>
			}
		>
			<div className="consultas-page">
				<div className="consulta-detail-header">
					<div>
						<h1 className="consulta-detail-title">{consulta.patientName || 'Consulta'}</h1>
						<div className="consulta-detail-sub">{subtitle}</div>
					</div>
				</div>

				<div className="consulta-grid">
					<section className="consulta-card" aria-label="Detalhes da Consulta">
						<div className="consulta-card-head">
							<div>
								<div className="consulta-card-title">Detalhes da Consulta</div>
								<div className="consulta-card-sub">Informação principal e estado</div>
							</div>
							<StatusBadge status={consulta.bookingStatus} />
						</div>

						<div className="consulta-fields">
							<div className="consulta-field-row">
								<div className="consulta-field-label">Paciente</div>
								<div className="consulta-field-value">{consulta.patientName || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Profissional</div>
								<div className="consulta-field-value">{consulta.medicoName || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Especialidade</div>
								<div className="consulta-field-value">{consulta.specialty || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Data</div>
								<div className="consulta-field-value">{formatDatePT(consulta.startISO) || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Hora</div>
								<div className="consulta-field-value">{formatTimePT(consulta.startISO) || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Duração</div>
								<div className="consulta-field-value">{consulta.durationMin ? `${consulta.durationMin} min` : '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Tipo</div>
								<div className="consulta-field-value">{consulta.bookingType || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Motivo</div>
								<div className="consulta-field-value">{consulta.firstVisitReason || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Notas internas</div>
								<div className="consulta-field-value">{consulta.notes || '—'}</div>
							</div>
						</div>
					</section>

					<section className="consulta-card" aria-label="Paciente e anexos">
						<div className="consulta-card-head">
							<div>
								<div className="consulta-card-title">Paciente</div>
								<div className="consulta-card-sub">Contactos e identificadores</div>
							</div>
							<button
								type="button"
								className="consultas-btn consultas-btn-light"
								onClick={() => {
									if (!consulta.patientId) return
									navigate(`/pacientes/${consulta.patientId}`)
								}}
							>
								Ver ficha
							</button>
						</div>

						<div className="consulta-fields">
							<div className="consulta-field-row">
								<div className="consulta-field-label">Data de Nascimento</div>
								<div className="consulta-field-value">{patientData.dataNascimento || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Contacto</div>
								<div className="consulta-field-value">
									{patientData.contactoTelefone || '—'}
									{patientData.contactoEmail ? (
										<div style={{ fontWeight: 700, color: 'rgba(30,42,53,0.60)', marginTop: 2 }}>
											{patientData.contactoEmail}
										</div>
									) : null}
								</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Nº Utente</div>
								<div className="consulta-field-value">{patientData.numeroUtente || '—'}</div>
							</div>
						</div>

						<div style={{ marginTop: 14 }}>
							<div className="consulta-card-head" style={{ marginBottom: 0 }}>
								<div>
									<div className="consulta-card-title">Anexos</div>
								</div>
							</div>

							<table className="consulta-attachments-table" aria-label="Anexos">
								<thead>
									<tr>
										<th>Ficheiro</th>
										<th>Tipo</th>
										<th>Adicionado</th>
									</tr>
								</thead>
								<tbody>
									{attachments.length === 0 ? (
										<tr>
											<td colSpan={3} style={{ color: 'rgba(30,42,53,0.55)' }}>
												Sem anexos.
											</td>
										</tr>
									) : (
										attachments.map((a) => (
											<tr key={a.id}>
												<td>
													<Paperclip style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'text-bottom' }} aria-hidden="true" />
													{a.dataUrl ? (
														<a className="consulta-attach-link" href={a.dataUrl} target="_blank" rel="noreferrer">
															{a.filename}
														</a>
													) : (
														<span className="consulta-attach-link" onClick={() => window.alert('Anexo de exemplo (sem ficheiro).')} role="button">
															{a.filename}
														</span>
													)}
												</td>
												<td>{tipoLabelFromMime(a.mimeType)}</td>
												<td>{formatDatePT(a.addedAtISO) || '—'}</td>
											</tr>
										))
									)}
								</tbody>
							</table>

							<div className="consulta-card-footer">
								<input
									ref={fileInputRef}
									type="file"
									multiple
									accept="application/pdf,image/*"
									style={{ display: 'none' }}
									onChange={(e) => onUploadFiles(Array.from(e.target.files || []))}
								/>
								<button
									type="button"
									className="consultas-btn consultas-btn-light"
									onClick={() => fileInputRef.current?.click()}
								>
									<Upload className="consultas-btn-icon" aria-hidden="true" />
									Carregar ficheiro
								</button>
							</div>
						</div>
					</section>
				</div>

				<div className="consulta-grid-bottom">
					<section className="consulta-card" aria-label="Declaração de Presença">
						<div className="consulta-card-head">
							<div>
								<div className="consulta-card-title">Declaração de Presença</div>
								<div className="consulta-card-sub">Emitir comprovativo de presença do paciente</div>
							</div>
						</div>

						<div className="consulta-form-grid">
							<div className="consulta-form-field">
								<label className="consulta-form-label">Paciente</label>
								<input className="consulta-form-input" value={consulta.patientName || ''} readOnly />
							</div>
							<div className="consulta-form-field">
								<label className="consulta-form-label">Profissional</label>
								<input className="consulta-form-input" value={consulta.medicoName || ''} readOnly />
							</div>
							<div className="consulta-form-field">
								<label className="consulta-form-label">Data</label>
								<input className="consulta-form-input" value={formatDatePT(consulta.startISO) || ''} readOnly />
							</div>
							<div className="consulta-form-field">
								<label className="consulta-form-label">Hora de Entrada</label>
								<input
									className="consulta-form-input"
									value={presenceEntryTime}
									onChange={(e) => setPresenceEntryTime(e.target.value)}
									placeholder="HH:MM"
								/>
							</div>
						</div>

						<div className="consulta-form-actions">
							<button
								type="button"
								className="consultas-btn consultas-btn-primary"
								onClick={() =>
									openPresenceDeclaration({
										patientName: consulta.patientName,
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

					<section className="consulta-card" aria-label="Resumo de Faturação">
						<div className="consulta-card-head">
							<div>
								<div className="consulta-card-title">Resumo de Faturação</div>
								<div className="consulta-card-sub">Informação para cobrança</div>
							</div>
						</div>

						<div className="consulta-fields">
							<div className="consulta-field-row">
								<div className="consulta-field-label">Serviço</div>
								<div className="consulta-field-value">{billing?.service || consulta.specialty || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Valor</div>
								<div className="consulta-field-value">{billing?.amount != null ? formatMoneyEUR(billing.amount) : '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Convénio/Seguro</div>
								<div className="consulta-field-value">{billing?.payer || '—'}</div>
							</div>
							<div className="consulta-field-row">
								<div className="consulta-field-label">Estado</div>
								<div className="consulta-field-value">{billing?.state || '—'}</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</AppLayout>
	)
}
