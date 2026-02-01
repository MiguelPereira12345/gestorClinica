import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import Button from './components/UI/Button'
import ResumoConsultas from './components/PaginaInicial/ResumoConsultas'
import ProximasConsultas from './components/PaginaInicial/ProximasConsultas'
import Atalhos from './components/PaginaInicial/Atalhos'
import './App.css'

export default function PaginaInicial() {
	const navigate = useNavigate()
	const [appointments, setAppointments] = useState(() => [
		{
			id: 'a1',
			paciente: 'Paciente',
			medico: 'Dra. Sofia Lima',
			tipo: 'Check-up',
			inicio: '09:30',
			fim: '10:00',
			estado: 'Por confirmar',
		},
		{
			id: 'a2',
			paciente: 'Maria Ferreira',
			medico: 'Dr. Bruno Costa',
			tipo: 'Limpeza',
			inicio: '10:15',
			fim: '10:45',
			estado: 'Confirmada',
		},
		{
			id: 'a3',
			paciente: 'Carlos Nunes',
			medico: 'Dra. Inês Rocha',
			tipo: 'Tratamento',
			inicio: '11:00',
			fim: '11:45',
			estado: 'Em atraso',
		},
		{
			id: 'a4',
			paciente: 'Ana Martins',
			medico: 'Dra. Sofia Lima',
			tipo: 'Primeira consulta',
			inicio: '12:00',
			fim: '13:00',
			estado: 'Por confirmar',
		},
	])

	const summary = useMemo(() => {
		const total = appointments.length
		const confirmed = appointments.filter((a) => a.estado === 'Confirmada').length
		const inProgress = appointments.filter((a) => a.estado === 'Em atraso').length
		const done = appointments.filter((a) => a.estado === 'Concluída').length
		return { total, confirmed, inProgress, done }
	}, [appointments])

	function setStatus(id, estado) {
		setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, estado } : a)))
	}
	return (
		<AppLayout breadcrumb="Painel" userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Painel"
					subtitle={null}
					actions={
						<>
							<Button variant="light" leftIcon={<RefreshCw size={16} aria-hidden="true" />}>
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

