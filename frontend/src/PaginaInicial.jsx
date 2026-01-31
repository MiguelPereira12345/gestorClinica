import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import ResumoConsultas from './components/PaginaInicial/ResumoConsultas'
import TarefasAlertas from './components/PaginaInicial/TarefasAlertas'
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

	const tasks = useMemo(
		() => [
			{
				id: 't1',
				tipo: 'alert',
				severidade: 'warning',
				titulo: '3 consultas por confirmar',
				detalhe: 'Confirmar antes do início da manhã',
			},
			{
				id: 't2',
				tipo: 'alert',
				severidade: 'danger',
				titulo: '1 consentimento RGPD em falta',
					detalhe: 'Paciente: —',
			},
			{
				id: 't3',
				tipo: 'task',
				severidade: 'info',
				titulo: '2 exames por anexar',
				detalhe: 'Associar anexos ao episódio clínico',
			},
			{
				id: 't4',
				tipo: 'task',
				severidade: 'info',
				titulo: '1 pagamento pendente',
				detalhe: 'Verificar no final do dia',
			},
		],
		[],
	)

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
			<section className="p-4" style={{ background: '#f6f6f7' }}>
				<div className="d-flex justify-content-end gap-2 mb-3" aria-label="Ações">
					<button type="button" className="btn btn-light">
						<span className="me-2" aria-hidden="true">⟳</span>
						Atualizar
					</button>
					<button type="button" className="btn btn-primary" onClick={() => navigate('/agenda')}>
						<span className="me-2" aria-hidden="true">＋</span>
						Novo Agendamento
					</button>
				</div>

				<h2 className="h6 fw-semibold text-dark mb-3">Área principal do dashboard</h2>

				<div className="row g-3">
					<div className="col-12 col-lg-6">
						<ResumoConsultas summary={summary} />
					</div>
					<div className="col-12 col-lg-6">
						<TarefasAlertas tasks={tasks} />
					</div>
					<div className="col-12 col-lg-6">
						<ProximasConsultas appointments={appointments} onSetStatus={setStatus} />
					</div>
					<div className="col-12 col-lg-6">
						<Atalhos />
					</div>
				</div>
			</section>
		</AppLayout>
	)
}

