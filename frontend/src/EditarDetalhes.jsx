import React, { useState } from 'react'
import AppLayout from './components/Layout/AppLayout'
import Informacao from './components/Detalhes/Informacao'
import Exames from './components/Detalhes/Exames'
import AnexosClinicos from './components/Detalhes/AnexosClinicos'
import RGPDConsentimentos from './components/Detalhes/RGPDConsentimentos'
import './App.css'

export default function EditarDetalhes(){
  const [isEditing, setIsEditing] = useState(false)
  const [patientData, setPatientData] = useState({
    nomeCompleto: 'João Pedro da Silva',
    dataNascimento: '14/02/1986',
    numeroUtente: '123456789',
    nif: '245 998 120',
    telefone: '+351 915 222 333',
    email: 'joao.silva@example.com',
    dataRegisto: '10/03/2023'
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    // Aqui pode adicionar a lógica para guardar os dados no backend
    console.log('Dados guardados:', patientData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Restaurar dados originais se necessário
  }

  const handleChange = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <AppLayout breadcrumb="Pacientes > João Pedro da Silva > Detalhes" userName="Dra. Sofia Lima">
      <div className="patient-page">


          {/* RGPD / Consentimentos */}
          <div className="patient-section">
            <button className="patient-rgpd-btn">
              RGPD / Consentimentos
            </button>
          </div>



          {/* Botões */}
          <div className="patient-header">
            <h1 className="patient-title">Ficha do Paciente</h1>
            <div className="patient-actions">
              <button className="patient-btn-secondary">
                Voltar à Lista
              </button>
              {!isEditing ? (
                <button className="patient-btn-primary" onClick={handleEdit}>
                  Editar Paciente
                </button>
              ) : (
                <>
                  <button className="patient-btn-secondary" onClick={handleCancel}>
                    Cancelar
                  </button>
                  <button className="patient-btn-primary" onClick={handleSave}>
                    Guardar
                  </button>
                </>
              )}
            </div>
          </div>




          {/* Informações Gerais */}
          <Informacao 
            isEditing={isEditing}
            data={patientData}
            onChange={handleChange}
          />


          {/* Histórico Clínico */}
          <div className="patient-section">
            <div className="patient-section-header">
              <div>
                <h2 className="patient-section-title">Histórico Clínico</h2>
                <p className="patient-section-subtitle">Registos em ordem cronológica</p>
              </div>
              <button className="patient-btn-small">
                Ver mais detalhes
              </button>
            </div>

            {/* Nota clínica */}
            <div className="patient-card">
              <div className="patient-card-content">
                <div className="patient-card-body">
                  <h3 className="patient-card-title">Nota clínica adicionada</h3>
                  <p className="patient-card-meta">12/05/2025 • Dr. Alex Morgan</p>
                  <p className="patient-card-text">Texto: Dor lombar crónica, recomendado fisioterapia 2x/semana.</p>
                </div>
                <span className="patient-card-badge">#HC-1021</span>
              </div>
            </div>
          </div>

          {/* Exames e Testes */}
          <Exames />

          {/* Anexos Clínicos */}
          <AnexosClinicos />

          {/* RGPD / Consentimentos */}
          <RGPDConsentimentos />

          {/* Planos de Tratamento */}
          <div className="patient-section-large">
            <div className="patient-section-header">
              <div>
                <h2 className="patient-section-title">Planos de Tratamento</h2>
                <p className="patient-section-subtitle">Histórico e estado dos planos</p>
              </div>
              <button className="patient-btn-export">
                Exportar PDF
              </button>
            </div>

            <div className="patient-card">
              <div className="patient-plan-row">
                <div>
                  <h3 className="patient-card-title">Plano 2025-Q2 • Versão 1.3</h3>
                </div>
                <span className="patient-status-badge">Ativo</span>
                <span className="patient-date-text">12/05/2025</span>
              </div>
            </div>
          </div>
      </div>
    </AppLayout>
  )
}
