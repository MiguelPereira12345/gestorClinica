import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Plus, CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import Button from './components/UI/Button'
import { useConfirm } from './components/UI/ConfirmProvider'
import { loadPatients } from './utils/patientStorage'
import { getStoredConsultas, statusLabel } from './utils/consultasStorage'
import { parseISOToDate } from './utils/dateTime'
import {
	PLANO_STATUS,
	appendTreatmentPlanHistory,
	listTreatmentPlans,
	planoStatusLabel,
	createTreatmentPlanApi,
	updateTreatmentPlanApi,
	deleteTreatmentPlanApi,
} from './utils/treatmentPlansStorage'

import { syncTreatmentPlansFromApi } from './utils/dataSync'

function normalizePatient(p) {
	return {
		id: p?.id,
		nome: p?.nome || p?.data?.nomeCompleto || '',
		responsavelId: p?.responsavelId || p?.data?.responsavelId || null,
	}
}

function truncateText(value, maxLen) {
	const s = String(value || '')
	const clean = s.replace(/\s+/g, ' ').trim()
	if (!clean) return { short: '', isTruncated: false, full: '' }
	const max = Number(maxLen) > 0 ? Number(maxLen) : 120
	if (clean.length <= max) return { short: clean, isTruncated: false, full: clean }
	return { short: `${clean.slice(0, max)}…`, isTruncated: true, full: clean }
}

export default function PlanosTratamento() {
	const navigate = useNavigate()
	const location = useLocation()
	const { id: patientIdFromParams } = useParams()
	const confirm = useConfirm()
	const rawPatients = useMemo(() => loadPatients(), [])
	const patientNameById = useMemo(() => {
		const m = new Map()
		for (const p of rawPatients) m.set(String(p?.id), p?.nome || p?.data?.nomeCompleto || '')
		return m
	}, [rawPatients])

	const patients = useMemo(() => {
		return rawPatients
			.map(normalizePatient)
			.filter((p) => p?.id)
			.sort((a, b) => String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-PT'))
	}, [rawPatients])

	const preselectedPatientId =
		String(patientIdFromParams || location.state?.patientId || '').trim() || ''
	const expandPlanIdFromNav = String(location.state?.expandPlanId || '').trim()

	const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId)
	const selectedPatient = useMemo(
		() => patients.find((p) => String(p.id) === String(selectedPatientId)) || null,
		[patients, selectedPatientId]
	)

	const [itemsVersion, setItemsVersion] = useState(0)
	const plans = useMemo(() => {
		return listTreatmentPlans({ patientId: selectedPatientId })
	}, [selectedPatientId, itemsVersion])

	const [showForm, setShowForm] = useState(false)
	const [editingId, setEditingId] = useState('')
	const [expandedPlanId, setExpandedPlanId] = useState('')
	const [expandedDescPlanId, setExpandedDescPlanId] = useState('')
	const [noteText, setNoteText] = useState('')
	const [form, setForm] = useState({
		data_inicio: '',
		data_fim: '',
		descricao: '',
		status: 'ativo',
	})
	const [error, setError] = useState('')
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		setSelectedPatientId(preselectedPatientId)
	}, [preselectedPatientId])

	useEffect(() => {
		if (!expandPlanIdFromNav) return
		setExpandedPlanId(expandPlanIdFromNav)
		setExpandedDescPlanId(expandPlanIdFromNav)
		setShowForm(false)
		setEditingId('')
		setError('')
	}, [expandPlanIdFromNav])

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				await syncTreatmentPlansFromApi()
			} catch {
				// ignore
			} finally {
				if (mounted) setItemsVersion((v) => v + 1)
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	function resetForm() {
		setEditingId('')
		setForm({ data_inicio: '', data_fim: '', descricao: '', status: 'ativo' })
		setError('')
		setShowForm(false)
	}

	function openCreate() {
		setEditingId('')
		setForm({ data_inicio: '', data_fim: '', descricao: '', status: 'ativo' })
		setError('')
		setExpandedDescPlanId('')
		setShowForm(true)
	}

	function openEdit(plan) {
		setEditingId(plan?.id || '')
		setForm({
			data_inicio: plan?.data_inicio || '',
			data_fim: plan?.data_fim || '',
			descricao: plan?.descricao || '',
			status: plan?.status || 'ativo',
		})
		setError('')
		setExpandedDescPlanId(plan?.id || '')
		setShowForm(true)
	}

	function submitForm() {
		setError('')
		if (!String(selectedPatientId || '').trim()) {
			setError('Seleciona um paciente.')
			return
		}
		if (!String(form.descricao || '').trim()) {
			setError('Escreve uma descrição do plano.')
			return
		}

		void (async () => {
			if (saving) return
			setSaving(true)
			try {
				if (editingId) {
					await updateTreatmentPlanApi(editingId, {
						patientId: selectedPatientId,
						...form,
					})
				} else {
					await createTreatmentPlanApi({
						patientId: selectedPatientId,
						...form,
					})
				}
				await syncTreatmentPlansFromApi().catch(() => {})
				setItemsVersion((v) => v + 1)
				resetForm()
			} catch (e) {
				setError(e?.message || 'Erro ao guardar o plano')
			} finally {
				setSaving(false)
			}
		})()
	}

	function onDelete(plan) {
		if (!plan?.id) return
		void (async () => {
			const ok = await confirm({
				title: 'Remover plano de tratamento',
				message: 'Deseja realmente remover este plano de tratamento?\n\nEsta ação não pode ser desfeita.',
				confirmText: 'Remover',
				confirmVariant: 'danger',
			})
			if (!ok) return
			try {
				await deleteTreatmentPlanApi(plan.id)
				if (expandedPlanId === plan.id) setExpandedPlanId('')
				await syncTreatmentPlansFromApi().catch(() => {})
				setItemsVersion((v) => v + 1)
			} catch (e) {
				console.error(e)
				window.alert(e?.message || 'Erro ao apagar o plano')
			}
		})()
	}

	function markSession(plan) {
		const patientId = String(selectedPatientId || '').trim()
		const patientName = selectedPatient?.nome || ''
		const desc = truncateText(plan?.descricao || '', 240).full
		const reason = desc ? `Tratamento: ${desc}` : ''

		navigate('/consultas/nova', {
			state: {
				prefill: {
					patientId,
					patientName,
					firstVisitReason: reason,
				},
				fromTreatmentPlanId: plan?.id || null,
				returnTo: {
					pathname: `/pacientes/${encodeURIComponent(String(patientId))}/planos`,
					state: { patientId, expandPlanId: plan?.id || null },
				},
			},
		})
	}

	function sessionsForPlan(planId) {
		const all = getStoredConsultas()
		return all
			.filter((c) => String(c?.treatmentPlanId || '') === String(planId))
			.slice()
			.sort((a, b) => String(b?.startISO || '').localeCompare(String(a?.startISO || '')))
	}

	function formatStart(iso) {
		const d = parseISOToDate(iso)
		if (!d) return '—'
		const date = d.toISOString().slice(0, 10)
		const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
		return `${date} ${time}`
	}

	function addNote(plan) {
		const text = String(noteText || '').trim()
		if (!plan?.id) return
		if (!text) return
		appendTreatmentPlanHistory(plan.id, {
			type: 'note',
			title: 'Nota',
			note: text,
		})
		setNoteText('')
		setItemsVersion((v) => v + 1)
	}

	return (
		<AppLayout breadcrumb="Planos de Tratamento" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Planos de Tratamento"
					subtitle={selectedPatient ? `${selectedPatient.nome} • ${selectedPatient.id}` : 'Selecione um paciente para ver/criar planos'}
					actions={
						<>
							<Button
								variant="primary"
								leftIcon={<Plus size={16} aria-hidden="true" />}
								onClick={openCreate}
								disabled={!String(selectedPatientId || '').trim()}
							>
								Novo plano
							</Button>
						</>
					}
				/>

				<section className="ui-card p-3 mb-3" aria-label="Selecionar paciente">
					<div className="row g-3 align-items-end">
						<div className="col-12 col-md-8">
							<label className="form-label">Paciente</label>
							<select
								className="form-select"
								value={selectedPatientId}
								onChange={(e) => {
									setSelectedPatientId(e.target.value)
									setShowForm(false)
									setEditingId('')
									setError('')
								}}
							>
								<option value="">Selecione</option>
								{patients.map((p) => (
									<option key={p.id} value={p.id}>
										{p.nome} ({p.id}){p.responsavelId ? ` — Dependente de ${patientNameById.get(String(p.responsavelId)) || p.responsavelId}` : ''}
									</option>
								))}
							</select>
						</div>

						<div className="col-12 col-md-4 d-flex justify-content-md-end gap-2">
							<Button variant="light" onClick={() => navigate('/pacientes')}>
								Ver pacientes
							</Button>
						</div>
					</div>
				</section>

				{showForm ? (
					<section className="ui-card p-3 mb-3" aria-label="Formulário do plano">
						<div className="d-flex align-items-start justify-content-between gap-2 mb-2">
							<div>
								<div className="fw-bold">{editingId ? 'Editar plano' : 'Novo plano'}</div>
								<div className="text-muted small">Define datas, estado e descrição.</div>
							</div>
							<Button variant="light" onClick={resetForm}>
								Fechar
							</Button>
						</div>

						<div className="row g-3">
							<div className="col-12 col-md-6">
								<label className="form-label">Data início</label>
								<input
									type="date"
									className="form-control"
									value={form.data_inicio}
									onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))}
								/>
							</div>
							<div className="col-12 col-md-6">
								<label className="form-label">Data fim</label>
								<input
									type="date"
									className="form-control"
									value={form.data_fim}
									onChange={(e) => setForm((p) => ({ ...p, data_fim: e.target.value }))}
								/>
							</div>

							<div className="col-12 col-md-4">
								<label className="form-label">Estado</label>
								<select
									className="form-select"
									value={form.status}
									onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
								>
									{PLANO_STATUS.map((s) => (
										<option key={s.id} value={s.id}>
											{s.label}
										</option>
									))}
								</select>
							</div>
							<div className="col-12 col-md-8">
								<label className="form-label">Descrição</label>
								<textarea
									className="form-control"
									rows={2}
									placeholder="Ex: Ortodontia — alinhadores (12 sessões)"
									value={form.descricao}
									onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
								/>
								<div className="form-text">{String(form.descricao || '').length} caracteres</div>
							</div>
						</div>

						{error ? (
							<div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
								{error}
							</div>
						) : null}

						<div className="d-flex gap-2 justify-content-end mt-3">
							<Button variant="secondary" onClick={resetForm}>
								Cancelar
							</Button>
							<Button variant="primary" onClick={submitForm}>
								Guardar
							</Button>
						</div>
					</section>
				) : null}

				<section className="ui-card" aria-label="Lista de planos">
					<div className="p-3 border-bottom" style={{ borderColor: 'rgba(30, 42, 53, 0.10)' }}>
						<div className="fw-bold">Planos</div>
						<div className="text-muted small">{plans.length} plano(s)</div>
					</div>

					<div className="ui-table-wrap">
						<table className="table ui-table" style={{ minWidth: 720 }}>
							<thead>
								<tr>
									<th>Descrição</th>
									<th>Início</th>
									<th>Fim</th>
									<th>Estado</th>
									<th className="ui-actions-col">Ações</th>
								</tr>
							</thead>
							<tbody>
								{plans.map((p) => (
									<React.Fragment key={p.id}>
										<tr>
											<td>
												<div style={{ fontWeight: 800, minWidth: 0 }}>
													{(() => {
														const t = truncateText(p.descricao || '', 90)
														const expanded = expandedDescPlanId === p.id
														if (!t.full) return '—'
														return (
															<>
																<span
																	style={{
																		whiteSpace: expanded ? 'pre-wrap' : 'normal',
																		overflowWrap: 'anywhere',
																		wordBreak: 'break-word',
																		lineBreak: 'anywhere',
																	}}
																>
																	{expanded ? t.full : t.short}
																</span>
																{t.isTruncated ? (
																	<button
																		type="button"
																		className="btn btn-link btn-sm p-0 ms-2"
																		onClick={() => setExpandedDescPlanId((cur) => (cur === p.id ? '' : p.id))}
																	>
																		{expanded ? 'Ver menos' : 'Ver mais'}
																	</button>
																) : null}
															</>
														)
													})()}
												</div>
											</td>
											<td>{p.data_inicio || '—'}</td>
											<td>{p.data_fim || '—'}</td>
											<td>{planoStatusLabel(p.status)}</td>
											<td className="ui-actions-col">
												<div className="d-flex gap-2 justify-content-end flex-wrap">
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => markSession(p)}
													title="Marcar sessão"
												>
													<CalendarPlus size={16} aria-hidden="true" className="me-1" />
													Marcar sessão
												</button>
													<button
														type="button"
														className="btn btn-light btn-sm"
														onClick={() => {
															setExpandedPlanId((cur) => (cur === p.id ? '' : p.id))
															setNoteText('')
														}}
														title="Histórico"
													>
														Histórico
													</button>
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => openEdit(p)}
													title="Editar"
												>
													<Pencil size={16} aria-hidden="true" />
												</button>
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => onDelete(p)}
													title="Apagar"
												>
													<Trash2 size={16} aria-hidden="true" />
												</button>
											</div>
											</td>
										</tr>
										{expandedPlanId === p.id ? (
											<tr>
												<td colSpan={5} style={{ padding: 0 }}>
													<div className="p-3" style={{ background: 'rgba(30, 42, 53, 0.03)' }}>
														<div className="row g-3">
															<div className="col-12 col-lg-6">
																<div className="ui-card p-3" style={{ background: 'rgba(255,255,255,0.9)' }}>
																	<div className="fw-bold mb-2">Sessões</div>
																	{sessionsForPlan(p.id).length ? (
																		<div className="d-flex flex-column gap-2">
																			{sessionsForPlan(p.id).slice(0, 12).map((s) => (
																				<div key={s.id} className="d-flex justify-content-between gap-2 border rounded-2 p-2" style={{ borderColor: 'rgba(30, 42, 53, 0.10)' }}>
																					<div className="min-w-0">
																						<div className="fw-semibold" style={{ fontSize: 13 }}>
																							{formatStart(s.startISO)}
																						</div>
																						<div className="text-muted small">
																							{s.medicoName || '—'} • {statusLabel(s.bookingStatus)}
																						</div>
																					</div>
																					<div className="flex-shrink-0">
																						<button type="button" className="btn btn-light btn-sm" onClick={() => navigate(`/consultas/${s.id}`)}>
																							Abrir
																						</button>
																					</div>
																				</div>
																			))}
																		</div>
																	) : (
																		<div className="text-muted small">Ainda sem sessões marcadas.</div>
																	)}
																</div>
															</div>
															<div className="col-12 col-lg-6">
																<div className="ui-card p-3" style={{ background: 'rgba(255,255,255,0.9)' }}>
																	<div className="fw-bold mb-2">Histórico</div>
																	<div className="d-flex gap-2 mb-2">
																		<input
																			type="text"
																			className="form-control"
																			placeholder="Adicionar nota ao plano..."
																			value={noteText}
																			onChange={(e) => setNoteText(e.target.value)}
																		/>
																		<Button variant="primary" onClick={() => addNote(p)}>
																			Guardar
																		</Button>
																	</div>

																	{Array.isArray(p.history) && p.history.length ? (
																		<ul className="list-unstyled mb-0 d-flex flex-column gap-2">
																			{p.history.slice(0, 12).map((h, idx) => (
																				<li key={`${h.atISO || 't'}-${idx}`} className="border rounded-2 p-2" style={{ borderColor: 'rgba(30, 42, 53, 0.10)' }}>
																					<div className="d-flex justify-content-between gap-2">
																						<div className="fw-semibold" style={{ fontSize: 13 }}>{h.title || 'Atualização'}</div>
																						<div className="text-muted small">{formatStart(h.atISO)}</div>
																					</div>
																					{h.note ? <div className="text-muted small" style={{ whiteSpace: 'pre-wrap' }}>{h.note}</div> : null}
																				</li>
																			))}
																		</ul>
																	) : (
																		<div className="text-muted small">Sem entradas de histórico.</div>
																	)}
																</div>
															</div>
														</div>
													</div>
												</td>
											</tr>
										) : null}
									</React.Fragment>
								))}
								{!plans.length ? (
									<tr>
										<td colSpan={5} className="text-muted" style={{ padding: 16 }}>
											{selectedPatientId ? 'Sem planos registados.' : 'Seleciona um paciente para ver os planos.'}
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</AppLayout>
	)
}
