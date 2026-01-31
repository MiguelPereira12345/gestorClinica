import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Colaboradores.css'

import ColaboradoresFilters from './components/Colaboradores/ColaboradoresFilters'
import ColaboradoresTable from './components/Colaboradores/ColaboradoresTable'
import Pagination from './components/Colaboradores/Pagination'

import { listColaboradores } from './utils/colaboradoresStorage'

const DEFAULT_PAGE_SIZE = 5

export default function ColaboradoresLista() {
	const navigate = useNavigate()
	const [filters, setFilters] = useState({
		name: '',
		specialty: '',
		status: '',
	})
	const [page, setPage] = useState(1)

	const result = useMemo(
		() => listColaboradores({ filters, page, pageSize: DEFAULT_PAGE_SIZE }),
		[filters, page],
	)

	const startIdx = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
	const endIdx = result.total === 0 ? 0 : startIdx + result.items.length - 1

	function onClear() {
		setFilters({ name: '', specialty: '', status: '' })
		setPage(1)
	}

	return (
		<AppLayout breadcrumb="Colaboradores > Lista" userName="Dra. Sofia Lima">
			<div className="colaboradores-page">
				<div className="colaboradores-title-row">
					<h1 className="colaboradores-title">Colaboradores</h1>
					<div className="colaboradores-title-actions">
						<button
							type="button"
							className="colaboradores-btn colaboradores-btn-primary"
							onClick={() => navigate('/colaboradores/novo')}
						>
							<Plus className="colaboradores-btn-icon" aria-hidden="true" />
							Adicionar Colaborador
						</button>
					</div>
				</div>

				<ColaboradoresFilters
					filters={filters}
					onChange={(next) => {
						setFilters(next)
						setPage(1)
					}}
					onClear={onClear}
				/>

				<div className="colaboradores-meta-row">
					<div>Mostrando {startIdx}–{endIdx} de {result.total} colaboradores</div>
					<Pagination
						page={result.page}
						maxPage={result.maxPage}
						onPrev={() => setPage((p) => Math.max(1, p - 1))}
						onNext={() => setPage((p) => Math.min(result.maxPage, p + 1))}
					/>
				</div>

				<ColaboradoresTable
					rows={result.items}
					onView={(c) => navigate(`/colaboradores/${c.id}`)}
					onEdit={(c) => navigate(`/colaboradores/${c.id}/editar`)}
				/>
			</div>
		</AppLayout>
	)
}
