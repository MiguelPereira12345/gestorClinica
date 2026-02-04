import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import UtenteActionButtons from './components/Utentes/UtenteActionButtons'
import { Plus, Search, Trash2 } from 'lucide-react'

import Button from './components/UI/Button'
import PageHeader from './components/UI/PageHeader'
import StatusBadge from './components/UI/StatusBadge'
import { useConfirm } from './components/UI/ConfirmProvider'

import {
	loadPatients,
	getDependentsOf,
	getEffectivePhone,
	matchesNameOrPhone,
	isDependentPatientId,
	deletePacienteApi,
	deleteDependenteApi,
	removePatient,
} from './utils/patientStorage'

import { syncPatientsFromApi } from './utils/dataSync'

export default function Pacientes() {
	const navigate = useNavigate()
	const confirm = useConfirm()
	const [query, setQuery] = useState('')
	const [storedRows, setStoredRows] = useState(() => {
		const parsed = loadPatients()
		return parsed.map((p) => ({
			id: p.id,
			nome: p.nome,
			telefone: p.telefone || p?.data?.contactoTelefone || '',
			responsavelId: p.responsavelId || p?.data?.responsavelId || null,
			estado: p.estado || 'Ativo',
		}))
	})

	const storedIds = useMemo(() => new Set(storedRows.map((r) => r.id)), [storedRows])

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				await syncPatientsFromApi()
			} catch {
				// ignore
			} finally {
				if (mounted) refreshStored()
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	function refreshStored() {
		const parsed = loadPatients()
		setStoredRows(
			parsed.map((p) => ({
				id: p.id,
				nome: p.nome,
				telefone: p.telefone || p?.data?.contactoTelefone || '',
				responsavelId: p.responsavelId || p?.data?.responsavelId || null,
				estado: p.estado || 'Ativo',
			})),
		)
	}

	function canOpenDetails(patientId) {
		return storedIds.has(patientId)
	}

	function ensurePatientExists(row) {
		if (canOpenDetails(row.id)) return true
		window.alert('Utente não encontrado na base de dados/cache. Faça sync (login) ou crie um novo utente.')
		return false
	}

	const allRows = useMemo(() => {
		const map = new Map()
		for (const r of storedRows) map.set(r.id, r)
		return Array.from(map.values())
	}, [storedRows])

	const filtered = useMemo(() => {
		const q = query.trim()
		if (!q) return allRows
		return allRows.filter((r) => matchesNameOrPhone(r, q, allRows) || String(r.id || '').toLowerCase().includes(q.toLowerCase()))
	}, [query, allRows])

	function dependentsCountFor(row) {
		if (row?.responsavelId) return 0
		return getDependentsOf(row.id, allRows).length
	}

	function effectivePhoneFor(row) {
		return getEffectivePhone(row, allRows)
	}

	return (
		<AppLayout breadcrumb="Utentes" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Utentes"
					subtitle="Pesquisa rápida, estado e ações numa lista consistente."
					actions={
						<>
							<div className="ui-search input-group" role="search" aria-label="Pesquisar utentes">
								<span className="input-group-text">
									<Search size={16} aria-hidden="true" />
								</span>
								<input
									type="text"
									className="form-control"
									placeholder="Pesquisar por nome, telefone ou ID"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
							<Button
								variant="primary"
								leftIcon={<Plus size={16} aria-hidden="true" />}
								onClick={() => navigate('/pacientes/novo')}
							>
								Adicionar utente
							</Button>
						</>
					}
				/>

				<section className="ui-card" aria-label="Lista de utentes">
					<div className="ui-table-wrap">
						<table className="table ui-table">
							<thead>
								<tr>
									<th>Nome</th>
									<th>Telefone</th>
									<th>Dependentes</th>
									<th className="ui-actions-col">Ações</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((r) => (
									<tr key={r.id}>
										<td style={{ fontWeight: 700 }}>{r.nome}</td>
										<td>{effectivePhoneFor(r) || '—'}</td>
										<td>{dependentsCountFor(r)}</td>
										<td className="ui-actions-col">
											<div className="ui-actions">
												<UtenteActionButtons patient={r} ensurePatientExists={ensurePatientExists} wrap={false} />
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														void (async () => {
															const label = r.responsavelId ? 'dependente' : 'utente'
															const ok = await confirm({
																title: `Eliminar ${label}`,
																message: `Deseja realmente eliminar este ${label}?\n\nEsta ação não pode ser desfeita.`,
																confirmText: 'Eliminar',
																confirmVariant: 'danger',
															})
															if (!ok) return
															try {
																if (isDependentPatientId(r.id)) {
																	await deleteDependenteApi(r.id)
																} else {
																	await deletePacienteApi(r.id)
																}
																removePatient(r.id)
																await syncPatientsFromApi().catch(() => {})
																refreshStored()
															} catch (e) {
																console.error(e)
																window.alert(e?.message || 'Erro ao eliminar utente')
															}
													})()
												}}
												>
													<Trash2 size={14} aria-hidden="true" />
													Eliminar
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</AppLayout>
	)
}
