import React from 'react'

export default function CardExames({ exam }) {
  return (
    <div className="exam-card">
      <div className="exam-title">{exam.title}</div>
      <div className="exam-meta">Data da consulta: {exam.date}</div>
      <div className="exam-meta">ID do utente: {exam.patientId}</div>
      <div className="exam-actions">
        <button className="link-btn">Ver mais</button>
        <div className="right-actions">
          <button className="icon-btn">+</button>
          <button className="edit-btn" aria-label="Editar"></button>
        </div>
      </div>
    </div>
  )
}
