import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Formulario({
  date = '22/10/26',
  patientId = '123',
  info = 'Utente compareceu para consulta de...',
  professional = 'Dra. Sílvia Coimbra',
}) {
  const navigate = useNavigate()
  return (
    <div className="exam-card">
      <div className="card-body">
        <label>Data da consulta:</label>
        <input type="text" placeholder={date} readOnly />

        <label>ID do utente:</label>
        <input type="text" placeholder={patientId} />

        <label>Informação:</label>
        <textarea rows={6} placeholder={info} />

        <label>Profissional responsável:</label>
        <input type="text" placeholder={professional} />

        <div className="actions">
          <button className="btn-remove">Remover</button>
          <button
            className="btn-save"
            type="button"
            onClick={() => {
              // navigate back to the previous page after saving
              navigate(-1)
            }}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}
