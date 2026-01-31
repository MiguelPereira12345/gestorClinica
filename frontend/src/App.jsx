import React from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import Recuperarpass from './Recuperarpass'
import Pacientes from './Pacientes'
import PaginaInicial from './PaginaInicial'
import Agenda from './Agenda'
import AdicionarConsulta from './AdicionarConsulta'
import EditarDetalhes from './EditarDetalhes'
import VerExames from './VerExames'
import AdicionarPaciente from './AdicionarPaciente'
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

function App() {
  return (
    <div className="app">
      <Routes>
        {/* proteger rotas para nao ser acessivel pela barra de pesquisa */}

        <Route path="/login" element={<Login />} />
        <Route path="/registar" element={<Register />} />
        <Route path="/recuperar-palavra-passe" element={<Recuperarpass />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/pacientes/novo" element={<AdicionarPaciente />} />
        <Route path="/pacientes/:id" element={<VerPaciente />} />
        <Route path="/pacientes/:id/editar" element={<EditarPaciente />} />
        <Route path="/pagina-inicial" element={<PaginaInicial />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/agenda/consultas/novo" element={<AdicionarConsulta />} />
        <Route path="/consultas" element={<ConsultasLista />} />
        <Route path="/consultas/nova" element={<NovaConsulta />} />
        <Route path="/consultas/:id" element={<VerConsulta />} />
        <Route path="/consultas/:id/editar" element={<EditarConsulta />} />
        <Route path="/ver-exames" element={<VerExames />} />
        <Route path="/editar-detalhes" element={<EditarDetalhes />} />
        <Route path="/colaboradores" element={<ColaboradoresLista />} />
        <Route path="/colaboradores/novo" element={<NovoColaborador />} />
        <Route path="/colaboradores/:id" element={<DetalhesColaborador />} />
        <Route path="/colaboradores/:id/editar" element={<EditarColaborador />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
