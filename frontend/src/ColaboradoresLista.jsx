import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'

import ColaboradoresFilters from './components/Colaboradores/ColaboradoresFilters'
import ColaboradoresTable from './components/Colaboradores/ColaboradoresTable'
import Pagination from './components/Colaboradores/Pagination'
import { useConfirm } from './components/UI/ConfirmProvider'

import { deleteColaboradorApi, listColaboradores } from './utils/colaboradoresStorage'
import { syncColaboradoresFromApi } from './utils/dataSync'
import { isMedicoUser } from './utils/apiClient'

const DEFAULT_PAGE_SIZE = 5

export default function ColaboradoresLista() {
	const navigate = useNavigate()
	const readOnly = isMedicoUser()
	const confirm = useConfirm()
	const [filters, setFilters] = useState({
		name: '',
		specialty: '',
		status: '',
	})
	const [page, setPage] = useState(1)
	const [rev, setRev] = useState(0)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				await syncColaboradoresFromApi()
			} catch {
				// ignore
			} finally {
				if (mounted) setRev((x) => x + 1)
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	const result = useMemo(
		() => listColaboradores({ filters, page, pageSize: DEFAULT_PAGE_SIZE }),
		[filters, page, rev],
	)

	const startIdx = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
	const endIdx = result.total === 0 ? 0 : startIdx + result.items.length - 1

	function onClear() {
		setFilters({ name: '', specialty: '', status: '' })
		setPage(1)
	}

	return (
		<AppLayout breadcrumb="Colaboradores > Lista" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Colaboradores"
					actions={
						readOnly ? null : (
							<button type="button" className="btn btn-primary" onClick={() => navigate('/colaboradores/novo')}>
								<Plus size={16} aria-hidden="true" />
								Adicionar Colaborador
							</button>
						)
					}
				/>

				<ColaboradoresFilters
					filters={filters}
					onChange={(next) => {
						setFilters(next)
						setPage(1)
					}}
					onClear={onClear}
				/>

				<div className="d-flex align-items-center justify-content-between gap-2 my-2">
					<div className="ui-meta">Mostrando {startIdx}–{endIdx} de {result.total} colaboradores</div>
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
					onEdit={readOnly ? undefined : (c) => navigate(`/colaboradores/${c.id}/editar`)}
					onDelete={readOnly ? undefined : (c) => {
						if (!c?.id) return
						void (async () => {
							const ok = await confirm({
								title: 'Eliminar colaborador',
								message: `Deseja realmente eliminar o colaborador “${c.name || c.nome || c.id}”?\n\nEsta ação não pode ser desfeita.`,
								confirmText: 'Eliminar',
								confirmVariant: 'danger',
							})
							if (!ok) return
							try {
								await deleteColaboradorApi(c.id)
								setRev((x) => x + 1)
							} catch (e) {
								console.error(e)
								window.alert(e?.message || 'Erro ao eliminar colaborador')
							}
						})()
					}}
				/>
			</div>
		</AppLayout>
	)
}
