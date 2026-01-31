import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Consultas.css'

import Button from './components/UI/Button'
import PageHeader from './components/UI/PageHeader'

import ConsultasFilters from './components/Consultas/ConsultasFilters'
import ConsultasTable from './components/Consultas/ConsultasTable'
import Pagination from './components/Consultas/Pagination'

import { exportConsultasToCSV, listConsultas, patchConsulta, appendHistory } from './utils/consultasStorage'
import { PROFESSIONALS } from './utils/consultasLookups'

const DEFAULT_PAGE_SIZE = 5
const VIEWS_KEY = 'gestorClinica.consultas.vistas'

function downloadTextFile(filename, content, mimeType) {
	const blob = new Blob([content], { type: mimeType })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

export default function ConsultasLista() {
	const navigate = useNavigate()
	const [filters, setFilters] = useState({
		patient: '',
		professional: '',
		date: '',
		status: '',
		bookingType: '',
	})
	const [page, setPage] = useState(1)
	const [refreshToken, setRefreshToken] = useState(0)

	const result = useMemo(
		() => listConsultas({ filters, page, pageSize: DEFAULT_PAGE_SIZE }),
		[filters, page, refreshToken],
	)

	function onSetStatus(c, nextStatus) {
		patchConsulta(c.id, { bookingStatus: nextStatus })
		if (String(nextStatus) === 'confirmada') {
			appendHistory(c.id, { action: 'Confirmada', note: 'Consulta confirmada.' })
		} else if (String(nextStatus) === 'cancelada') {
			appendHistory(c.id, { action: 'Cancelada', note: 'Consulta cancelada.' })
		} else {
			appendHistory(c.id, { action: 'Pendente', note: 'Consulta marcada como pendente.' })
		}
		setRefreshToken((t) => t + 1)
	}

	const startIdx = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
	const endIdx = result.total === 0 ? 0 : startIdx + result.items.length - 1

	function onExport() {
		const all = listConsultas({ filters, page: 1, pageSize: 10000 })
		const csv = exportConsultasToCSV(all.items)
		downloadTextFile(`consultas_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
	}

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

	return (
		<AppLayout breadcrumb="Consultas > Lista" userName="Dra. Sofia Lima">
			<div className="consultas-page ui-page">
				<PageHeader
					title="Consultas"
					subtitle="Lista de consultas marcadas com filtros, exportação e gestão de estado."
					actions={
						<>
							<Button
								variant="secondary"
								onClick={onExport}
								leftIcon={<Download className="consultas-btn-icon" aria-hidden="true" />}
							>
								Exportar
							</Button>
							<Button
								variant="primary"
								onClick={() => navigate('/consultas/nova')}
								leftIcon={<Plus className="consultas-btn-icon" aria-hidden="true" />}
							>
								Adicionar Consulta
							</Button>
						</>
					}
				/>

				<ConsultasFilters
					filters={filters}
					onChange={(next) => {
						setFilters(next)
						setPage(1)
					}}
					professionals={PROFESSIONALS}
					onClear={onClear}
					onSaveView={onSaveView}
				/>

				<div className="consultas-meta-row">
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
					onView={(c) => navigate(`/consultas/${c.id}`)}
					onEdit={(c) => navigate(`/consultas/${c.id}/editar`)}
					onSetStatus={onSetStatus}
				/>
			</div>
		</AppLayout>
	)
}
