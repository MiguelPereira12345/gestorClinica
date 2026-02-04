import React from 'react'
import './App.css'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Login from './Login'
import Recuperarpass from './Recuperarpass'
import Pacientes from './Pacientes'
import PaginaInicial from './PaginaInicial'
import Agenda from './Agenda'
import EditarDetalhes from './EditarDetalhes'
import VerExames from './VerExames'
import AdicionarPaciente from './AdicionarPaciente'
import AdicionarDependente from './AdicionarDependente'
import VerPaciente from './VerPaciente'
import EditarPaciente from './EditarPaciente'
import ConsultasLista from './ConsultasLista'
import VerConsulta from './VerConsultaPage'
import EditarConsulta from './EditarConsulta'
import NovaConsulta from './NovaConsulta'
import ColaboradoresLista from './ColaboradoresLista'
import DetalhesColaborador from './DetalhesColaborador'
import EditarColaborador from './EditarColaborador'
import NovoColaborador from './NovoColaborador'
import PlanosTratamento from './PlanosTratamento'
import VerPlanoTratamento from './VerPlanoTratamento'
import Webpage from './webpage'
import EquipaEspecialistas from './EquipaEspecialistas'
import ContactosPage from './ContactosPage'
import { ConfirmProvider } from './components/UI/ConfirmProvider'
import { getCurrentUserRole } from './utils/apiClient'

import PacienteDashboard from './PacienteDashboard'
import PacienteConsultas from './PacienteConsultas'
import PacienteVerConsulta from './PacienteVerConsulta'
import PacientePlanos from './PacientePlanos'
import PacienteVerPlano from './PacienteVerPlano'
import PacienteDependentes from './PacienteDependentes'
import PacienteVerDependente from './PacienteVerDependente'
import PacientePerfil from './PacientePerfil'
import PacienteMarcarConsulta from './PacienteMarcarConsulta'
import PacienteDocsDeclaracoes from './PacienteDocsDeclaracoes'

import Notificacoes from './Notificacoes'

function RequireAuth({ children }) {
	const location = useLocation()
	let isAuthed = false
	try {
		const raw = localStorage.getItem('auth_user')
		isAuthed = Boolean(raw && JSON.parse(raw))
	} catch {
		isAuthed = false
	}

	if (!isAuthed) {
		return <Navigate to="/login" replace state={{ from: location.pathname }} />
	}

	return children
}

function RequireStaff({ children }) {
	const role = getCurrentUserRole()
	const isStaff = role && role !== 'user' && role !== 'paciente'
	if (!isStaff) {
		return <Navigate to="/portal" replace />
	}
	return children
}

function RequireStaffOutlet() {
	return (
		<RequireAuth>
			<RequireStaff>
				<Outlet />
			</RequireStaff>
		</RequireAuth>
	)
}

function RequirePatient({ children }) {
	const role = getCurrentUserRole()
	const isPatient = role === 'user' || role === 'paciente'
	if (!isPatient) {
		return <Navigate to="/pagina-inicial" replace />
	}
	return children
}

function RequirePatientOutlet() {
	return (
		<RequireAuth>
			<RequirePatient>
				<Outlet />
			</RequirePatient>
		</RequireAuth>
	)
}

function RequireAuthOutlet() {
	return (
		<RequireAuth>
			<Outlet />
		</RequireAuth>
	)
}

function RedirectIfAuthed({ children }) {
	let isAuthed = false
	try {
		const raw = localStorage.getItem('auth_user')
		isAuthed = Boolean(raw && JSON.parse(raw))
	} catch {
		isAuthed = false
	}

	if (isAuthed) {
		const role = getCurrentUserRole()
		const isPatient = role === 'user' || role === 'paciente'
		return <Navigate to={isPatient ? '/portal' : '/pagina-inicial'} replace />
	}

	return children
}

function App() {
  return (
		<ConfirmProvider>
			<div className="app">
				<Routes>
					{/* Páginas públicas (landing + auth) */}
					<Route path="/" element={<Webpage />} />
					<Route path="/equipa" element={<EquipaEspecialistas />} />
					<Route path="/contactos" element={<ContactosPage />} />
					<Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
					<Route path="/registar" element={<Navigate to="/login" replace />} />
					<Route path="/recuperar-palavra-passe" element={<Recuperarpass />} />

					{/* Portal do utente */}
					<Route element={<RequirePatientOutlet />}>
						<Route path="/portal" element={<PacienteDashboard />} />
						<Route path="/portal/consultas" element={<PacienteConsultas />} />
						<Route path="/portal/consultas/:id" element={<PacienteVerConsulta />} />
						<Route path="/portal/planos" element={<PacientePlanos />} />
						<Route path="/portal/planos/:id" element={<PacienteVerPlano />} />
						<Route path="/portal/dependentes" element={<PacienteDependentes />} />
						<Route path="/portal/dependentes/:id" element={<PacienteVerDependente />} />
						<Route path="/portal/perfil" element={<PacientePerfil />} />
						<Route path="/portal/docs" element={<PacienteDocsDeclaracoes />} />
						<Route path="/portal/marcar-consulta" element={<PacienteMarcarConsulta />} />
					</Route>

					{/* Área staff (protegida) */}
					<Route element={<RequireStaffOutlet />}>
						<Route path="/pacientes" element={<Pacientes />} />
						<Route path="/pacientes/novo" element={<AdicionarPaciente />} />
						<Route path="/pacientes/:id/dependente/novo" element={<AdicionarDependente />} />
						<Route path="/pacientes/:id" element={<VerPaciente />} />
						<Route path="/pacientes/:id/editar" element={<EditarPaciente />} />
						<Route path="/pacientes/:id/planos" element={<PlanosTratamento />} />
						<Route path="/pacientes/:id/planos/:planId" element={<VerPlanoTratamento />} />
						<Route path="/pagina-inicial" element={<PaginaInicial />} />
						<Route path="/agenda" element={<Agenda />} />
						<Route path="/agenda/consultas/novo" element={<Navigate to="/consultas/nova" replace />} />
						<Route path="/consultas" element={<ConsultasLista />} />
						<Route path="/consultas/nova" element={<NovaConsulta />} />
						<Route path="/planos" element={<PlanosTratamento />} />
						<Route path="/consultas/:id" element={<VerConsulta />} />
						<Route path="/consultas/:id/editar" element={<EditarConsulta />} />
						<Route path="/ver-exames" element={<VerExames />} />
						<Route path="/editar-detalhes" element={<EditarDetalhes />} />
						<Route path="/colaboradores" element={<ColaboradoresLista />} />
						<Route path="/colaboradores/novo" element={<NovoColaborador />} />
						<Route path="/colaboradores/:id" element={<DetalhesColaborador />} />
						<Route path="/colaboradores/:id/editar" element={<EditarColaborador />} />
						<Route path="/notificacoes" element={<Notificacoes />} />
					</Route>

					{/* Fallback */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</div>
		</ConfirmProvider>
  )
}

export default App
