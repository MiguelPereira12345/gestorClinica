import React, { useMemo, useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import {
	Eye,
	Pencil,
	Plus,
	Search,
	Trash2,
} from 'lucide-react'

import Button from './components/UI/Button'
import PageHeader from './components/UI/PageHeader'
import StatusBadge from './components/UI/StatusBadge'

import {
	buildPatientRecordFromForm,
	createEmptyPatientForm,
	loadPatients,
	getDependentsOf,
	getEffectivePhone,
	matchesNameOrPhone,
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
			telefone: p.telefone || p?.data?.contactoTelefone || '',
			responsavelId: p.responsavelId || p?.data?.responsavelId || null,
			estado: p.estado || 'Ativo',
		}))
	})

	const storedIds = useMemo(() => new Set(storedRows.map((r) => r.id)), [storedRows])

	const rows = useMemo(
		() => [
			{
				id: 'P001',
				nome: 'Maria Gonzalez',
				telefone: '912 345 678',
				estado: 'Ativo',
				responsavelId: null,
			},
			{
				id: 'P002',
				nome: 'Liam Chen',
				telefone: '913 222 111',
				estado: 'Inativo',
				responsavelId: null,
			},
			{
				id: 'P003',
				nome: 'Sofia Martins',
				telefone: '914 000 999',
				estado: 'Ativo',
				responsavelId: null,
			},
			{
				id: 'P004',
				nome: 'Noah Patel',
				telefone: '915 123 456',
				estado: 'Ativo',
				responsavelId: null,
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
		const ok = window.confirm(
			'Este paciente é um exemplo. Queres criar a ficha dele agora para poderes ver/editar?'
		)
		if (!ok) return false

		const form = createEmptyPatientForm()
		form.nomeCompleto = row.nome
		form.contactoTelefone = row.telefone || ''
		form.contactoEmail = ''

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
		<AppLayout breadcrumb="Pacientes" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Pacientes"
					subtitle="Pesquisa rápida, estado e ações numa lista consistente."
					actions={
						<>
							<div className="ui-search input-group" role="search" aria-label="Pesquisar pacientes">
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
								Adicionar paciente
							</Button>
						</>
					}
				/>

				<section className="ui-card" aria-label="Lista de pacientes">
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
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														const baseId = r.responsavelId || r.id
														navigate(`/pacientes/${baseId}/dependente/novo`)
													}}
													disabled={!!r.responsavelId}
													title={r.responsavelId ? 'Adicionar dependentes no responsável' : 'Adicionar dependente'}
												>
													<Plus size={14} aria-hidden="true" />
																	Dependente
												</button>
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														navigate(`/pacientes/${r.id}`)
													}}
												>
													<Eye size={14} aria-hidden="true" />
													Ver
												</button>
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														navigate(`/pacientes/${r.id}/editar`)
													}}
												>
													<Pencil size={14} aria-hidden="true" />
													Editar
												</button>
												<button
													type="button"
													className="btn btn-light btn-sm"
													onClick={() => {
														if (!ensurePatientExists(r)) return
														const ok = window.confirm('Eliminar este paciente?')
														if (!ok) return
														removePatient(r.id)
														refreshStored()
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
