import React, { useMemo, useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import {
	Eye,
	Pencil,
	Search,
	Trash2,
	Users,
} from 'lucide-react'

import Button from './components/UI/Button'
import PageHeader from './components/UI/PageHeader'
import StatusBadge from './components/UI/StatusBadge'

import {
	buildPatientRecordFromForm,
	createEmptyPatientForm,
	loadPatients,
	removePatient,
	upsertPatient,
} from './utils/patientStorage'

export default function Pacientes() {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [storedRows, setStoredRows] = useState(() => {
		const parsed = loadPatients()
		return parsed.map((p) => ({
			id: p.id,
			nome: p.nome,
			email: p.email || '',
			estado: p.estado || 'Ativo',
		}))
	})

	const storedIds = useMemo(() => new Set(storedRows.map((r) => r.id)), [storedRows])

	const rows = useMemo(
		() => [
			{
				id: 'P001',
				nome: 'Maria Gonzalez',
				email: 'maria.gonzalez@example.com',
				estado: 'Ativo',
			},
			{
				id: 'P002',
				nome: 'Liam Chen',
				email: 'liam.chen@example.com',
				estado: 'Inativo',
			},
			{
				id: 'P003',
				nome: 'Sofia Martins',
				email: 'sofia.martins@example.com',
				estado: 'Ativo',
			},
			{
				id: 'P004',
				nome: 'Noah Patel',
				email: 'noah.patel@example.com',
				estado: 'Ativo',
			},
		],
		[],
	)

	function refreshStored() {
		const parsed = loadPatients()
		setStoredRows(
			parsed.map((p) => ({
				id: p.id,
				nome: p.nome,
				email: p.email || '',
				estado: p.estado || 'Ativo',
			})),
		)
	}

	function canOpenDetails(patientId) {
		return storedIds.has(patientId)
	}

	function ensurePatientExists(row) {
		if (canOpenDetails(row.id)) return true
		const ok = window.confirm(
			'Este paciente é um exemplo. Queres criar a ficha dele agora para poderes ver/editar?'
		)
		if (!ok) return false

		const form = createEmptyPatientForm()
		form.nomeCompleto = row.nome
		form.contactoEmail = row.email

		const patient = buildPatientRecordFromForm({
			id: row.id,
			estado: row.estado || 'Ativo',
			form,
			anexosClinicos: [],
		})
		upsertPatient(patient)
		refreshStored()
		return true
	}

	const allRows = useMemo(() => {
		// coloca os criados recentemente no topo e evita duplicados por id
		const map = new Map()
		for (const r of storedRows) map.set(r.id, r)
		for (const r of rows) {
			if (!map.has(r.id)) map.set(r.id, r)
		}
		return Array.from(map.values())
	}, [storedRows, rows])

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return allRows
		return allRows.filter((r) => {
			return (
				r.nome.toLowerCase().includes(q) ||
				r.email.toLowerCase().includes(q) ||
				r.id.toLowerCase().includes(q)
			)
		})
	}, [query, allRows])

	return (
		<AppLayout breadcrumb="Pacientes" userName="Dra. Sofia Lima">
			<main className="patients-content" aria-label="Conteúdo">
				<div className="ui-page">
					<PageHeader
						title="Pacientes"
						subtitle="Pesquisa rápida, estado e ações numa lista consistente."
						actions={
							<>
								<div className="patients-search">
									<Search className="patients-search-icon" aria-hidden="true" />
									<input
										type="text"
										className="patients-search-input"
										placeholder="Pesquisar por nome, email ou ID"
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										aria-label="Pesquisar pacientes"
									/>
								</div>
								<Button variant="primary" onClick={() => navigate('/pacientes/novo')}>
									Adicionar paciente
								</Button>
							</>
						}
					/>

					<section className="patients-card ui-card" aria-label="Lista de pacientes">
						<div className="patients-table-wrap ui-table-wrap">
							<table className="patients-table ui-table">
								<thead>
									<tr>
										<th>Nome</th>
										<th>Email</th>
										<th>Estado</th>
										<th className="patients-actions-col ui-actions-col">
											<span className="patients-actions-header">Ações</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((r) => (
										<tr key={r.id}>
											<td className="patients-name">{r.nome}</td>
											<td className="patients-email">{r.email}</td>
											<td>
												<StatusBadge status={r.estado} />
											</td>
											<td className="patients-actions">
												<button
													className="patients-action"
													type="button"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														navigate(`/pacientes/${r.id}`)
													}}
												>
													<Eye className="patients-action-icon" aria-hidden="true" />
													Ver
												</button>
												<button
													className="patients-action"
													type="button"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														navigate(`/pacientes/${r.id}/editar`)
													}}
												>
													<Pencil className="patients-action-icon" aria-hidden="true" />
													Editar
												</button>
												<button
													className="patients-action"
													type="button"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														const ok = window.confirm('Eliminar este paciente?')
														if (!ok) return
														removePatient(r.id)
														refreshStored()
													}}
												>
													<Trash2 className="patients-action-icon" aria-hidden="true" />
													Eliminar
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				</div>
			</main>
		</AppLayout>
	)
}
