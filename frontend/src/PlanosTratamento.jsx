import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Plus, CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import Button from './components/UI/Button'
import { loadPatients } from './utils/patientStorage'
import { getStoredConsultas, statusLabel } from './utils/consultasStorage'
import { parseISOToDate } from './utils/dateTime'
import {
	PLANO_STATUS,
	appendTreatmentPlanHistory,
	createTreatmentPlan,
	listTreatmentPlans,
	planoStatusLabel,
	removeTreatmentPlan,
	updateTreatmentPlan,
} from './utils/treatmentPlansStorage'

function normalizePatient(p) {
	return {
		id: p?.id,
		nome: p?.nome || p?.data?.nomeCompleto || '',
	}
}

export default function PlanosTratamento() {
	const navigate = useNavigate()
	const location = useLocation()
	const { id: patientIdFromParams } = useParams()

	const patients = useMemo(() => {
		return loadPatients()
			.map(normalizePatient)
			.filter((p) => p?.id)
			.sort((a, b) => String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-PT'))
	}, [])

	const preselectedPatientId =
		String(patientIdFromParams || location.state?.patientId || '').trim() || ''

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
	const [noteText, setNoteText] = useState('')
	const [form, setForm] = useState({
		data_inicio: '',
		data_fim: '',
		descricao: '',
		status: 'ativo',
	})
	const [error, setError] = useState('')

	useEffect(() => {
		setSelectedPatientId(preselectedPatientId)
	}, [preselectedPatientId])

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

		try {
			if (editingId) {
				updateTreatmentPlan(editingId, {
					...form,
					patientId: selectedPatientId,
					patientName: selectedPatient?.nome || '',
				})
			} else {
				createTreatmentPlan({
					patientId: selectedPatientId,
					patientName: selectedPatient?.nome || '',
					...form,
				})
			}
			setItemsVersion((v) => v + 1)
			resetForm()
		} catch (e) {
			setError(e?.message || 'Erro ao guardar o plano')
		}
	}

	function onDelete(plan) {
		if (!plan?.id) return
		const ok = window.confirm('Remover este plano de tratamento?')
		if (!ok) return
		removeTreatmentPlan(plan.id)
		if (expandedPlanId === plan.id) setExpandedPlanId('')
		setItemsVersion((v) => v + 1)
	}

	function markSession(plan) {
		const patientId = String(selectedPatientId || '').trim()
		const patientName = selectedPatient?.nome || ''
		const reason = plan?.descricao ? `Tratamento: ${plan.descricao}` : ''

		navigate('/consultas/nova', {
			state: {
				prefill: {
					patientId,
					patientName,
					firstVisitReason: reason,
				},
				fromTreatmentPlanId: plan?.id || null,
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
										{p.nome} ({p.id})
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
								<input
									type="text"
									className="form-control"
									placeholder="Ex: Ortodontia — alinhadores (12 sessões)"
									value={form.descricao}
									onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
								/>
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
											<td style={{ fontWeight: 800 }}>{p.descricao || '—'}</td>
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
