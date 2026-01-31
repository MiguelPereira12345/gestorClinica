import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import {
	Calendar,
	ClipboardList,
	Eye,
	LayoutDashboard,
	LogOut,
	Pencil,
	Search,
	Stethoscope,
	Trash2,
	Users,
	UserRound,
} from 'lucide-react'

import {
	buildPatientRecordFromForm,
	createEmptyPatientForm,
	loadPatients,
	removePatient,
	upsertPatient,
} from './utils/patientStorage'

import logoClinimolelos from './assets/Logo-CliniMolelos.png'

export default function Pacientes() {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [storedRows, setStoredRows] = useState([])
	const [storedIds, setStoredIds] = useState(() => new Set())

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

	useEffect(() => {
		const parsed = loadPatients()
		setStoredRows(
			parsed.map((p) => ({
				id: p.id,
				nome: p.nome,
				email: p.email || '',
				estado: p.estado || 'Ativo',
			})),
		)
		setStoredIds(new Set(parsed.map((p) => p.id)))
	}, [])

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
		setStoredIds(new Set(parsed.map((p) => p.id)))
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
		// coloca os criados recentemente no topo
		return [...storedRows, ...rows]
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
					<div className="patients-title-row">
						<div className="patients-title">
							<Users className="patients-title-icon" aria-hidden="true" />
							<h1>Pacientes</h1>
						</div>

						<div className="patients-title-actions">
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

							<button
								type="button"
								className="patient-btn-primary"
								onClick={() => navigate('/pacientes/novo')}
							>
								Adicionar paciente
							</button>
						</div>
					</div>

					<section className="patients-card" aria-label="Lista de pacientes">
						<div className="patients-table-wrap">
							<table className="patients-table">
								<thead>
									<tr>
										<th>Nome</th>
										<th>Email</th>
										<th>Estado</th>
										<th className="patients-actions-col">
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
												<span
													className={
														r.estado === 'Ativo'
															? 'patients-badge is-active'
															: 'patients-badge is-inactive'
													}
												>
													{r.estado}
												</span>
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
				</main>
		</AppLayout>
	)
}
