import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import './App.css'

export default function PaginaInicial() {
	const navigate = useNavigate()
	const [appointments, setAppointments] = useState(() => [
		{
			id: 'a1',
			paciente: 'João Silva',
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
				detalhe: 'Paciente: João Silva',
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
		<AppLayout breadcrumb="Painel > João Silva" userName="Dra. Sofia Lima">
			<section className="dashboard-content">
					<div className="dashboard-actions" aria-label="Ações">
						<button type="button" className="dashboard-btn dashboard-btn-ghost">
							<span className="dashboard-btn-icon" aria-hidden="true">⟳</span>
							Atualizar
						</button>
						<button 
							type="button" 
							className="dashboard-btn dashboard-btn-primary"
							onClick={() => navigate('/agenda')}
						>
							<span className="dashboard-btn-icon" aria-hidden="true">＋</span>
							Novo Agendamento
						</button>
					</div>


{/*adicionar calendário funcional para ver as consultas do dia */}

					<h2 className="dashboard-title">Área principal do dashboard</h2>

					<div className="dashboard-grid">
						<section className="dashboard-card" aria-label="Resumo de Consultas de Hoje">
							<div className="dashboard-card-header">
								<h3 className="dashboard-card-title">Resumo de Consultas de Hoje</h3>
							</div>
							<div className="dashboard-stats">
								<div className="dashboard-stat">
									<div className="dashboard-stat-label">Agendadas</div>
									<div className="dashboard-stat-value">{summary.total}</div>
								</div>
								<div className="dashboard-stat">
									<div className="dashboard-stat-label">Em andamento</div>
									<div className="dashboard-stat-value">{summary.confirmed}</div>
								</div>
								<div className="dashboard-stat">
									<div className="dashboard-stat-label">Concluídas</div>
									<div className="dashboard-stat-value">{summary.inProgress}</div>
								</div>
							</div>
						</section>

						<section className="dashboard-card" aria-label="Próximas Consultas">
							<div className="dashboard-card-header dashboard-card-header-row">
								<h3 className="dashboard-card-title">Próximas Consultas</h3>
								<button
									type="button"
									className="dashboard-btn dashboard-btn-light"
									onClick={() => navigate('/agenda')}
								>
									<span className="dashboard-btn-icon" aria-hidden="true">🗓</span>
									Ver agenda
								</button>
							</div>

							<div className="dashboard-list" role="list">
								{appointments.slice(0, 6).map((a) => (
									<div key={a.id} className="dashboard-list-item" role="listitem">
										<div className="dashboard-list-left">
											<div className="dashboard-list-title">{a.paciente}</div>
											<div className="dashboard-list-sub">
												{a.inicio}–{a.fim} • {a.medico} • {a.tipo}
											</div>
										</div>

										<div className="dashboard-list-right">
											<span
												className={`dashboard-badge${
													a.estado === 'Confirmada'
														? ' is-ok'
														: a.estado === 'Em atraso'
															? ' is-warn'
															: ' is-muted'
												}`}
											>
												{a.estado}
											</span>

											<div className="dashboard-item-actions">
												<button
													className="dashboard-action-btn"
													type="button"
													onClick={() => setStatus(a.id, 'Confirmada')}
												>
													Confirmar
												</button>
												<button
													className="dashboard-action-btn"
													type="button"
													onClick={() => navigate('/agenda')}
												>
													Reagendar
												</button>
												<button
													className="dashboard-action-btn"
													type="button"
													onClick={() => navigate('/editar-detalhes')}
												>
													Abrir ficha
												</button>
											</div>
									</div>
								</div>
							))}
							</div>
						</section>
					</div>

					<div className="dashboard-grid dashboard-grid-secondary">
						<section className="dashboard-card" aria-label="Tarefas e Alertas">
							<div className="dashboard-card-header dashboard-card-header-row">
								<h3 className="dashboard-card-title">Tarefas / Alertas</h3>
								<button
									type="button"
									className="dashboard-btn dashboard-btn-ghost"
									onClick={() => navigate('/pacientes')}
								>
									Ver pacientes
								</button>
							</div>

							<div className="dashboard-list" role="list">
								{tasks.map((t) => (
									<div key={t.id} className="dashboard-list-item" role="listitem">
										<div className="dashboard-list-left">
											<div className="dashboard-list-title">{t.titulo}</div>
											<div className="dashboard-list-sub">{t.detalhe}</div>
										</div>

										<div className="dashboard-list-right">
											<span
												className={`dashboard-badge${
													t.severidade === 'danger'
														? ' is-danger'
														: t.severidade === 'warning'
															? ' is-warn'
															: ' is-info'
												}`}
											>
												{t.tipo === 'alert' ? 'Alerta' : 'Tarefa'}
											</span>
										</div>
									</div>
								))}
							</div>
						</section>

						<section className="dashboard-card" aria-label="Atalhos">
							<div className="dashboard-card-header">
								<h3 className="dashboard-card-title">Atalhos</h3>
							</div>
							<div className="dashboard-shortcuts">
								<button type="button" className="dashboard-shortcut" onClick={() => navigate('/agenda')}>
									Novo agendamento
								</button>
								<button type="button" className="dashboard-shortcut" onClick={() => navigate('/registar')}>
									Novo paciente
								</button>
								<button type="button" className="dashboard-shortcut" onClick={() => navigate('/pacientes')}>
									Pesquisar pacientes
								</button>
								<button type="button" className="dashboard-shortcut" onClick={() => navigate('/editar-detalhes')}>
									Abrir ficha
								</button>
							</div>
						</section>
					</div>
				</section>
		</AppLayout>
	)
	{/*adicionem uma tabela de pacientes para levar a editardetalhes,
	mas uma ligada a bd, criem nos componentes não façam tudo aqui que fica enorme */}
}

