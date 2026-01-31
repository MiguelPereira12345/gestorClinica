import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import './Colaboradores.css'

import { getColaboradorById } from './utils/colaboradoresStorage'

export default function DetalhesColaborador() {
	const navigate = useNavigate()
	const { id } = useParams()

	const colaborador = useMemo(() => getColaboradorById(id), [id])

	if (!colaborador) {
		return (
			<AppLayout breadcrumb="Colaboradores > Detalhes" userName="Dra. Sofia Lima">
				<div className="colaboradores-page">
					<div className="colaborador-card">
						<div className="colaborador-card-title">Colaborador não encontrado</div>
						<div className="colaborador-card-footer">
							<button type="button" className="colaboradores-btn" onClick={() => navigate('/colaboradores')}>
								<ArrowLeft className="colaboradores-btn-icon" aria-hidden="true" />
								Voltar
							</button>
						</div>
					</div>
				</div>
			</AppLayout>
		)
	}

	return (
		<AppLayout
			breadcrumb="Colaboradores > Detalhes"
			userName="Dra. Sofia Lima"
			actions={
				<button type="button" className="colaboradores-btn" onClick={() => navigate('/colaboradores')}>
					<ArrowLeft className="colaboradores-btn-icon" aria-hidden="true" />
					Voltar
				</button>
			}
		>
			<div className="colaboradores-page">
				<div className="colaborador-detail-header">
					<div>
						<h1 className="colaborador-detail-title">{colaborador.name}</h1>
						<div className="colaborador-detail-sub">{colaborador.cargo} • {colaborador.id}</div>
					</div>
				</div>

				<div className="colaborador-grid">
					<div className="colaborador-card">
						<div className="colaborador-card-head">
							<div>
								<div className="colaborador-card-title">Informações Pessoais</div>
								<div className="colaborador-card-sub">Dados do colaborador</div>
							</div>
						</div>
						<div className="colaborador-fields">
							<div className="colaborador-field-row">
								<span className="colaborador-field-label">Nome</span>
								<span className="colaborador-field-value">{colaborador.name}</span>
							</div>
							<div className="colaborador-field-row">
								<span className="colaborador-field-label">Email</span>
								<span className="colaborador-field-value">{colaborador.email}</span>
							</div>
							<div className="colaborador-field-row">
								<span className="colaborador-field-label">Telefone</span>
								<span className="colaborador-field-value">{colaborador.phone}</span>
							</div>
							<div className="colaborador-field-row">
								<span className="colaborador-field-label">Cargo</span>
								<span className="colaborador-field-value">{colaborador.cargo}</span>
							</div>
							<div className="colaborador-field-row">
								<span className="colaborador-field-label">Status</span>
								<span className="colaborador-field-value">{colaborador.status}</span>
							</div>
						</div>
					</div>

					<div className="colaborador-card">
						<div className="colaborador-card-head">
							<div>
								<div className="colaborador-card-title">Ações</div>
							</div>
						</div>
						<div className="colaborador-card-footer">
							<button
								type="button"
								className="colaboradores-btn colaboradores-btn-primary"
								onClick={() => navigate(`/colaboradores/${colaborador.id}/editar`)}
							>
								Editar
							</button>
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	)
}
