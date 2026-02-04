import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, Trash2 } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import { apiFetch } from './utils/apiClient'

function parseBody(body) {
	if (!body) return null
	try {
		return JSON.parse(body)
	} catch {
		return null
	}
}

export default function Notificacoes() {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(true)
	const [rows, setRows] = useState([])
	const [error, setError] = useState('')
	// const [showRead, setShowRead] = useState(false)
	const [contactsByPatientId, setContactsByPatientId] = useState(() => ({}))
	const [loadingContacts, setLoadingContacts] = useState(() => ({}))

	async function load() {
		setLoading(true)
		setError('')
		try {
			const res = await apiFetch('/notifications?unreadOnly=true')
			setRows(Array.isArray(res?.notifications) ? res.notifications : [])
		} catch (e) {
			setError(e?.message || 'Erro ao carregar notificações')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void load()
	}, [])

	async function markRead(idNotification) {
		if (!idNotification) return
		try {
			await apiFetch(`/notifications/${encodeURIComponent(String(idNotification))}/read`, { method: 'PATCH' })
		} catch {
			// best-effort
		}
	}

	const items = useMemo(() => {
		const parsed = (rows || []).map((n) => {
			const meta = parseBody(n.body)
			return { ...n, _meta: meta }
		})

		// Dedup pedidos de consulta pelo consultaId (mantém o mais recente)
		const seen = new Set()
		const deduped = []
		for (const n of parsed) {
			const meta = n?._meta
			const isRequest = n?.type === 'consulta_request' && meta?.consultaId
			if (!isRequest) {
				deduped.push(n)
				continue
			}

			const key = `consulta_request:${String(meta.consultaId)}`
			if (seen.has(key)) continue
			seen.add(key)
			deduped.push(n)
		}
		return deduped
	}, [rows])

	useEffect(() => {
		const patientIds = new Set()
		for (const n of items) {
			const meta = n?._meta
			if (n?.type === 'consulta_request' && meta?.patientId) {
				patientIds.add(String(meta.patientId))
			}
		}

		const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key)
		const missing = Array.from(patientIds).filter((id) => !has(contactsByPatientId, id) && !loadingContacts?.[id])
		if (!missing.length) return

		missing.forEach((id) => {
			setLoadingContacts((prev) => ({ ...prev, [id]: true }))
			void (async () => {
				try {
					const res = await apiFetch(`/patients/${encodeURIComponent(id)}/contact`)
					const c = res?.contact || null
					setContactsByPatientId((prev) => ({ ...prev, [id]: c }))
				} catch {
					setContactsByPatientId((prev) => ({ ...prev, [id]: null }))
				} finally {
					setLoadingContacts((prev) => ({ ...prev, [id]: false }))
				}
			})()
		})
	}, [contactsByPatientId, items, loadingContacts])

	async function approve(consultaId) {
		try {
			if (consultaId == null || String(consultaId).trim() === '') throw new Error('consultaId inválido')
			await apiFetch(`/consultas/${encodeURIComponent(String(consultaId))}/aprovar`, { method: 'PATCH' })
		} catch (e) {
			window.alert(e?.message ? `${e.message}${e.status ? ` (HTTP ${e.status})` : ''}` : 'Erro ao aprovar')
			throw e
		}
	}

	async function reject(consultaId) {
		try {
			if (consultaId == null || String(consultaId).trim() === '') throw new Error('consultaId inválido')
			await apiFetch(`/consultas/${encodeURIComponent(String(consultaId))}/rejeitar`, { method: 'PATCH' })
		} catch (e) {
			window.alert(e?.message ? `${e.message}${e.status ? ` (HTTP ${e.status})` : ''}` : 'Erro ao eliminar')
			throw e
		}
	}

	return (
		<AppLayout breadcrumb="Notificações" userName="">
			<div className="ui-page">
				<PageHeader
					title="Notificações"
					subtitle={null}
					actions={
						<div className="d-flex align-items-center gap-2">
							<button type="button" className="btn btn-light" onClick={() => setRows([])}>
								Limpar
							</button>
							<button type="button" className="btn btn-light" onClick={load}>
								Atualizar
							</button>
						</div>
					}
				/>

				{error ? <div className="alert alert-danger">{error}</div> : null}
				{loading ? <div className="text-muted">A carregar…</div> : null}

				<div className="d-flex flex-column gap-2">
					{!loading && items.length === 0 ? <div className="text-muted">Sem notificações.</div> : null}
					{items.map((n) => {
						const isUnread = !n.read_at
						const meta = n._meta
						const isRequest = n.type === 'consulta_request' && meta?.consultaId
						const patientId = meta?.patientId != null ? String(meta.patientId) : ''
						const contact = patientId ? contactsByPatientId[patientId] : null
						const isContactLoading = patientId ? Boolean(loadingContacts[patientId]) : false

						return (
							<div key={n.id_notification} className={`border rounded-3 p-3 ${isUnread ? 'bg-white' : 'bg-light'}`}>
								<div className="d-flex align-items-start justify-content-between gap-3">
									<div className="min-w-0">
										<div className="fw-bold">{n.title}</div>
										<div className="small text-muted">
											{n.created_at ? new Date(n.created_at).toLocaleString() : ''}
										</div>
										{isRequest ? (
											<div className="mt-2">
												<div className="small"><span className="text-muted">Utente:</span> {meta.patientName || meta.patientId || '-'}</div>
												<div className="small"><span className="text-muted">Contacto:</span> {isContactLoading ? 'a carregar…' : contact ? [contact.telefone, contact.email].filter(Boolean).join(' • ') || '-' : '-'}</div>
												<div className="small"><span className="text-muted">Data/hora:</span> {meta.requestedAt ? new Date(meta.requestedAt).toLocaleString() : '-'}</div>
												{meta.reason ? <div className="small"><span className="text-muted">Motivo:</span> {meta.reason}</div> : null}
											</div>
										) : (
											<div className="small mt-2">{n.body || ''}</div>
										)}
									</div>

									<div className="flex-shrink-0">
										{isRequest ? (
											<div className="ui-actions">
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={async () => {
														await markRead(n.id_notification)
														navigate(`/consultas/${meta.consultaId}`)
													}}
													title="Ver consulta"
												>
													<Eye size={14} aria-hidden="true" />
													Ver consulta
												</button>
												{patientId ? (
													<button
														type="button"
														className="btn btn-light btn-sm"
														onClick={async () => {
														await markRead(n.id_notification)
														navigate(`/pacientes/${patientId}`)
													}}
														title="Ver utente"
													>
														<Eye size={14} aria-hidden="true" />
														Ver utente
													</button>
												) : null}
												<button
													type="button"
													className="btn btn-primary btn-sm"
													onClick={async () => {
														await approve(meta.consultaId)
														await markRead(n.id_notification)
														setRows((prev) => (prev || []).filter((r) => r.id_notification !== n.id_notification))
													}}
													title="Aprovar"
												>
													<Check size={14} aria-hidden="true" />
													Aprovar
												</button>
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={async () => {
														await reject(meta.consultaId)
														await markRead(n.id_notification)
														setRows((prev) => (prev || []).filter((r) => r.id_notification !== n.id_notification))
													}}
													title="Eliminar"
												>
													<Trash2 size={14} aria-hidden="true" />
													Eliminar
												</button>
											</div>
										) : null}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</AppLayout>
	)
}
