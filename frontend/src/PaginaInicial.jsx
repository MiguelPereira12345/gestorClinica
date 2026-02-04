import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import Button from './components/UI/Button'
import ResumoConsultas from './components/PaginaInicial/ResumoConsultas'
import ProximasConsultas from './components/PaginaInicial/ProximasConsultas'
import Atalhos from './components/PaginaInicial/Atalhos'
import './App.css'

import { getStoredConsultas, isConsultaConfirmada, statusLabel } from './utils/consultasStorage'
import { parseISOToDate } from './utils/dateTime'
import { syncConsultasFromApi, syncPatientsFromApi } from './utils/dataSync'

export default function PaginaInicial() {
	const navigate = useNavigate()
	const [rev, setRev] = useState(0)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				await syncPatientsFromApi()
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

	const appointments = useMemo(() => {
		const all = getStoredConsultas()
		const now = Date.now()
		return all
			.filter((c) => c?.startISO)
			.map((c) => {
				const dStart = parseISOToDate(c.startISO)
				const dEnd = parseISOToDate(c.endISO)
				const inicio = dStart
					? `${String(dStart.getHours()).padStart(2, '0')}:${String(dStart.getMinutes()).padStart(2, '0')}`
					: ''
				const fim = dEnd
					? `${String(dEnd.getHours()).padStart(2, '0')}:${String(dEnd.getMinutes()).padStart(2, '0')}`
					: ''

				return {
					id: c.id,
					utente: c.dependentName || c.patientName || c.patientId || 'Utente',
					medico: c.medicoName || 'Profissional',
					tipo: c.specialty || 'Consulta',
					inicio,
					fim,
					estado: statusLabel(c.bookingStatus),
					_startMs: dStart ? dStart.getTime() : 0,
					_isPast: dStart ? dStart.getTime() < now : false,
				}
			})
			.filter((a) => !a._isPast)
			.sort((a, b) => a._startMs - b._startMs)
	}, [rev])

	const summary = useMemo(() => {
		const total = appointments.length
		const confirmed = getStoredConsultas().filter((c) => isConsultaConfirmada(c.bookingStatus)).length
		const inProgress = 0
		const done = 0
		return { total, confirmed, inProgress, done }
	}, [appointments])

	async function refresh() {
		try {
			await syncPatientsFromApi()
			await syncConsultasFromApi()
		} catch {
			// ignore
		} finally {
			setRev((x) => x + 1)
		}
	}
	return (
		<AppLayout breadcrumb="Painel" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Painel"
					subtitle={null}
					actions={
						<>
							<Button variant="light" leftIcon={<RefreshCw size={16} aria-hidden="true" />} onClick={refresh}>
								Atualizar
							</Button>
							<Button
								variant="primary"
								leftIcon={<Plus size={16} aria-hidden="true" />}
								onClick={() => navigate('/agenda')}
							>
								Novo Agendamento
							</Button>
						</>
					}
				/>

				<div className="row g-3 align-items-start">
					<div className="col-12 col-lg-6">
						<div className="d-flex flex-column gap-3">
							<ResumoConsultas summary={summary} />
							<Atalhos />
						</div>
					</div>
					<div className="col-12 col-lg-6">
						<ProximasConsultas appointments={appointments} />
					</div>
				</div>
			</div>
		</AppLayout>
	)
}

