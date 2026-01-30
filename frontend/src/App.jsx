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
        <Route path="/ver-exames" element={<VerExames />} />
        <Route path="/editar-detalhes" element={<EditarDetalhes />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
