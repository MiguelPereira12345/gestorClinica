import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import StatusBadge from './components/UI/StatusBadge'

import { getColaboradorById } from './utils/colaboradoresStorage'

export default function DetalhesColaborador() {
	const navigate = useNavigate()
	const { id } = useParams()

	const colaborador = useMemo(() => getColaboradorById(id), [id])

	if (!colaborador) {
		return (
			<AppLayout breadcrumb="Colaboradores > Detalhes" userName="Dra. Sofia Lima">
				<div className="ui-page">
					<div className="ui-card p-3">
						<div className="fw-bold">Colaborador não encontrado</div>
						<div className="mt-3">
							<button type="button" className="btn btn-secondary" onClick={() => navigate('/colaboradores')}>
								<ArrowLeft size={16} aria-hidden="true" />
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
				<button type="button" className="btn btn-secondary" onClick={() => navigate('/colaboradores')}>
					<ArrowLeft size={16} aria-hidden="true" />
					Voltar
				</button>
			}
		>
			<div className="ui-page">
				<PageHeader title={colaborador.name} subtitle={`${colaborador.cargo} • ${colaborador.id}`} />

				<div className="row g-3">
					<div className="col-lg-8">
						<div className="ui-card p-3">
							<div className="fw-bold">Informações Pessoais</div>
							<div className="ui-meta mt-1">Dados do colaborador</div>

							<div className="row g-3 mt-1">
								<div className="col-md-6">
									<div className="ui-meta">Nome</div>
									<div className="fw-bold">{colaborador.name}</div>
								</div>
								<div className="col-md-6">
									<div className="ui-meta">Email</div>
									<div className="fw-bold">{colaborador.email}</div>
								</div>
								<div className="col-md-6">
									<div className="ui-meta">Telefone</div>
									<div className="fw-bold">{colaborador.phone}</div>
								</div>
								<div className="col-md-6">
									<div className="ui-meta">Cargo</div>
									<div className="fw-bold">{colaborador.cargo}</div>
								</div>
								<div className="col-md-6">
									<div className="ui-meta">Estado</div>
									<div className="mt-1">
										<StatusBadge status={colaborador.status} />
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="col-lg-4">
						<div className="ui-card p-3">
							<div className="fw-bold">Ações</div>
							<div className="mt-3">
								<button type="button" className="btn btn-primary" onClick={() => navigate(`/colaboradores/${colaborador.id}/editar`)}>
									Editar
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	)
}
