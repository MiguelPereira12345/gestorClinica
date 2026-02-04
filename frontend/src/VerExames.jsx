import React from 'react'
import './App.css'
import AppLayout from './components/Layout/AppLayout'
import CardExames from './components/VerExames/CardExames'

const sampleMedical = [
  { id: 1, title: 'Consulta geral', date: '22/10/25', patientId: 214 },
  { id: 2, title: 'Consulta limpeza', date: '22/10/25', patientId: 214 },
  { id: 3, title: 'Consulta aparelho', date: '22/10/25', patientId: 214 },
  { id: 4, title: 'Consulta geral', date: '22/10/25', patientId: 214 },
]

const sampleDental = [
  { id: 1, title: 'Consulta geral', date: '22/10/25', patientId: 214 },
  { id: 2, title: 'Consulta gravidez', date: '22/10/25', patientId: 214 },
  { id: 3, title: 'Consulta Saúde', date: '22/10/25', patientId: 214 },
  { id: 4, title: 'Consulta geral', date: '22/10/25', patientId: 214 },
]

export default function VerExames() {
  return (
    <AppLayout breadcrumb="Utentes > Joana Oliveira > Exames" userName="Dra. Sofia Lima">
      <div className="ver-exames-page">
        <main className="ve-main">
          <div className="user-row">
            <div className="user-name">Joana Oliveira</div>
          </div>

          <div className="columns">
            <section className="column">
              <h2>Exames médicos:</h2>
              {sampleMedical.map((e) => (
                <CardExames key={e.id} exam={e} />
              ))}
            </section>

            <section className="column">
              <h2>Exames dentários:</h2>
              {sampleDental.map((e) => (
                <CardExames key={e.id} exam={e} />
              ))}
            </section>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
