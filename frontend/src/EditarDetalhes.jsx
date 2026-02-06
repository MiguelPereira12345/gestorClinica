import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
import Informacao from './components/Detalhes/Informacao'
import Exames from './components/Detalhes/Exames'
import AnexosClinicos from './components/Detalhes/AnexosClinicos'
import RGPDConsentimentos from './components/Detalhes/RGPDConsentimentos'
import './App.css'
import { isValidName, isValidNif, isValidNumeroUtente, isValidPhone, sanitizeDigits, sanitizeName, sanitizePhone } from './utils/validation'

export default function EditarDetalhes(){
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [patientData, setPatientData] = useState({
    nomeCompleto: 'João Pedro da Silva',
    dataNascimento: '14/02/1986',
    numeroUtente: '123456789',
    nif: '245998120',
    telefone: '+351915222333',
    email: 'joao.silva@example.com',
    dataRegisto: '10/03/2023'
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    const nome = sanitizeName(patientData.nomeCompleto).trim()
    const telefone = sanitizePhone(patientData.telefone).trim()
    const numeroUtente = sanitizeDigits(patientData.numeroUtente, { maxDigits: 9 })
    const nif = sanitizeDigits(patientData.nif, { maxDigits: 9 })

    if (!isValidName(nome)) {
      window.alert('Nome inválido. Use apenas letras e espaços.')
      return
    }
    if (!isValidPhone(telefone)) {
      window.alert('Telefone inválido. Indica um número com 9 a 15 dígitos.')
      return
    }
    if (!isValidNumeroUtente(numeroUtente)) {
      window.alert('Nº de utente inválido. Máximo 9 dígitos.')
      return
    }
    if (!isValidNif(nif)) {
      window.alert('NIF inválido. Tem de ter exatamente 9 dígitos.')
      return
    }

    const cleaned = {
      ...patientData,
      nomeCompleto: nome,
      telefone,
      numeroUtente,
      nif,
    }

    setPatientData(cleaned)
    setIsEditing(false)
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
    <AppLayout breadcrumb="Utentes > João Pedro da Silva > Detalhes" userName="Dra. Sofia Lima">
      <div className="ui-page" style={{ padding: '20px 40px' }}>
        <div className="mb-3">
          <button className="btn btn-light" type="button" onClick={() => navigate('/pacientes')}>
            RGPD / Consentimentos
          </button>
        </div>

        <PageHeader
          title="Ficha do Utente"
          actions={
            <>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/pacientes')}>
                Voltar à Lista
              </button>
              {!isEditing ? (
                <button className="btn btn-primary" type="button" onClick={handleEdit}>
                  Editar Utente
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" type="button" onClick={handleCancel}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" type="button" onClick={handleSave}>
                    Guardar
                  </button>
                </>
              )}
            </>
          }
        />




          <Informacao 
            isEditing={isEditing}
            data={patientData}
            onChange={handleChange}
          />


          {/* Histórico Clínico */}
          <section className="ui-card p-3 mb-3" aria-label="Histórico Clínico">
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
                  Histórico Clínico
                </h2>
                <p className="mt-1 mb-0" style={{ fontSize: 13, color: '#999' }}>
                  Registos em ordem cronológica
                </p>
              </div>
              <button className="btn btn-sm btn-light" type="button">
                Ver mais detalhes
              </button>
            </div>

            <div className="border rounded-2 p-3 mt-3" style={{ background: '#f9f9f9', borderColor: '#ddd' }}>
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                  <h3 className="m-0" style={{ fontSize: 15, fontWeight: 600 }}>
                    Nota clínica adicionada
                  </h3>
                  <p className="mt-2 mb-2" style={{ fontSize: 13, color: '#666' }}>
                    12/05/2025 • Dr. Alex Morgan
                  </p>
                  <p className="m-0" style={{ fontSize: 14, color: '#333' }}>
                    Texto: Dor lombar crónica, recomendado fisioterapia 2x/semana.
                  </p>
                </div>
                <span style={{ fontSize: 12, color: '#999' }}>#HC-1021</span>
              </div>
            </div>
          </section>

          {/* Exames e Testes */}
          <Exames />

          {/* Anexos Clínicos */}
          <AnexosClinicos />

          {/* RGPD / Consentimentos */}
          <RGPDConsentimentos />

          {/* Planos de Tratamento */}
          <section className="ui-card p-3 mt-4" aria-label="Planos de Tratamento">
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
                  Planos de Tratamento
                </h2>
                <p className="mt-1 mb-0" style={{ fontSize: 13, color: '#999' }}>
                  Histórico e estado dos planos
                </p>
              </div>
              <button className="btn btn-light" type="button">
                Exportar PDF
              </button>
            </div>

            <div className="border rounded-2 p-3 mt-3" style={{ background: '#f9f9f9', borderColor: '#ddd' }}>
              <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <div>
                  <h3 className="m-0" style={{ fontSize: 15, fontWeight: 600 }}>
                    Plano 2025-Q2 • Versão 1.3
                  </h3>
                </div>
                <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                  Ativo
                </span>
                <span style={{ fontSize: 13, color: '#999' }}>12/05/2025</span>
              </div>
            </div>
          </section>
      </div>
    </AppLayout>
  )
}
