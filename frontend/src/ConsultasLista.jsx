import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'

import ConsultasFilters from './components/Consultas/ConsultasFilters'
import ConsultasTable from './components/Consultas/ConsultasTable'
import Pagination from './components/Consultas/Pagination'
import { useConfirm } from './components/UI/ConfirmProvider'

import { deleteConsultaApi, listConsultas, patchConsulta } from './utils/consultasStorage'
import { syncColaboradoresFromApi, syncConsultasFromApi } from './utils/dataSync'
import { loadMedicosForSelect, refreshMedicosForSelect } from './utils/professionalsStorage'
import { getCurrentUser, isMedicoUser } from './utils/apiClient'

const DEFAULT_PAGE_SIZE = 5
const VIEWS_KEY = 'gestorClinica.consultas.vistas'

export default function ConsultasLista() {
	const navigate = useNavigate()
	const confirm = useConfirm()
	const currentUser = getCurrentUser()
	const isMedico = isMedicoUser()
	const currentUserId = Number(currentUser?.id || 0) || 0
	const [professionals, setProfessionals] = useState(() => loadMedicosForSelect())
	const [filters, setFilters] = useState({
		patient: '',
		professional: '',
		date: '',
		status: '',
		bookingType: '',
	})
	const [page, setPage] = useState(1)
	const [rev, setRev] = useState(0)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				await syncColaboradoresFromApi().catch(() => null)
				const list = await refreshMedicosForSelect()
				if (mounted) setProfessionals(list)

				await syncConsultasFromApi()
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
		() => listConsultas({ filters, page, pageSize: DEFAULT_PAGE_SIZE }),
		[filters, page, rev],
	)

	const startIdx = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
	const endIdx = result.total === 0 ? 0 : startIdx + result.items.length - 1

	function onSaveView() {
		const name = window.prompt('Nome da vista (ex: “Consultas de hoje”)')
		if (!name) return
		const raw = localStorage.getItem(VIEWS_KEY)
		const parsed = raw ? JSON.parse(raw) : []
		const next = Array.isArray(parsed) ? parsed : []
		next.unshift({ id: `V${Date.now()}`, name, filters, createdAt: new Date().toISOString() })
		localStorage.setItem(VIEWS_KEY, JSON.stringify(next.slice(0, 10)))
		window.alert('Vista guardada.')
	}

	function onClear() {
		setFilters({ patient: '', professional: '', date: '', status: '', bookingType: '' })
		setPage(1)
	}

	async function handleDelete(consulta) {
		const id = consulta?.id
		if (!id) return
		const ok = await confirm({
			title: 'Eliminar consulta',
			message: 'Tem a certeza que deseja eliminar esta consulta?\n\nEsta ação não pode ser desfeita.',
			confirmText: 'Eliminar',
			confirmVariant: 'danger',
		})
		if (!ok) return
		try {
			await deleteConsultaApi(id)
			setRev((x) => x + 1)
		} catch (e) {
			window.alert(e?.message ?? 'Erro ao eliminar consulta')
		}
	}

	return (
		<AppLayout breadcrumb="Consultas > Lista" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<div className="ui-page-header">
					<h1 className="ui-page-title">Consultas Marcadas</h1>
					<div className="ui-page-actions">
						<button
							type="button"
							className="btn btn-primary"
							onClick={() => navigate('/consultas/nova')}
						>
							<Plus size={16} aria-hidden="true" />
							Adicionar Consulta
						</button>
					</div>
				</div>

				<ConsultasFilters
					filters={filters}
					onChange={(next) => {
						setFilters(next)
						setPage(1)
					}}
					professionals={professionals}
					onClear={onClear}
					onSaveView={onSaveView}
				/>

				<div className="d-flex align-items-center justify-content-between gap-2 flex-wrap ui-meta mt-3 mb-2">
					<div>Mostrando {startIdx}–{endIdx} de {result.total} consultas</div>
					<Pagination
						page={result.page}
						maxPage={result.maxPage}
						onPrev={() => setPage((p) => Math.max(1, p - 1))}
						onNext={() => setPage((p) => Math.min(result.maxPage, p + 1))}
					/>
				</div>

				<ConsultasTable
					rows={result.items}
					canManage={(c) => {
						if (!isMedico) return true
						if (!currentUserId) return false
						return Number(c?.medicoId || 0) === currentUserId
					}}
					onView={(c) => navigate(`/consultas/${c.id}`)}
					onEdit={(c) => navigate(`/consultas/${c.id}/editar`)}
					onSetStatus={(c, status) => {
						patchConsulta(c.id, { bookingStatus: status })
						setRev((x) => x + 1)
					}}
					onDelete={handleDelete}
				/>
			</div>
		</AppLayout>
	)
}

