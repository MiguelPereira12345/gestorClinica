import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'

import ColaboradorForm from './components/Colaboradores/ColaboradorForm'
import { addColaborador } from './utils/colaboradoresStorage'

export default function NovoColaborador() {
	const navigate = useNavigate()

	return (
		<AppLayout
			breadcrumb="Colaboradores > Novo"
			userName="Dra. Sofia Lima"
			actions={
				<button type="button" className="btn btn-secondary" onClick={() => navigate('/colaboradores')}>
					<ArrowLeft size={16} aria-hidden="true" />
					Voltar
				</button>
			}
		>
			<div className="ui-page">
				<PageHeader title="Novo colaborador" subtitle="Adicione um novo colaborador à clínica" />

				<ColaboradorForm
					submitLabel="Criar Colaborador"
					onCancel={() => navigate('/colaboradores')}
					onSubmit={(payload) => {
						const newColaborador = addColaborador(payload)
						navigate(`/colaboradores/${newColaborador.id}`)
					}}
				/>
			</div>
		</AppLayout>
	)
}
