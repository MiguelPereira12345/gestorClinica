import React from 'react'

export default function Exames() {
  return (
    <section className="ui-card p-3 mb-3" aria-label="Exames e Testes">
      <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
        Exames e Testes
      </h2>

      <div className="border rounded-2 p-3 mt-3" style={{ background: '#f9f9f9', borderColor: '#ddd' }}>
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <h3 className="m-0" style={{ fontSize: 15, fontWeight: 600 }}>
              Exame laboratorial
            </h3>
            <p className="mt-2 mb-2" style={{ fontSize: 13, color: '#666' }}>
              02/04/2025 • Dra. Sofia Lima
            </p>
            <p className="m-0" style={{ fontSize: 14, color: '#333' }}>
              Resumo: Hemograma completo dentro dos parâmetros.
            </p>
          </div>
          <span className="badge" style={{ background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontWeight: 500, color: '#333' }}>
            Exame
          </span>
        </div>
      </div>

      <div className="border rounded-2 p-3 mt-3" style={{ background: '#f9f9f9', borderColor: '#ddd' }}>
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <h3 className="m-0" style={{ fontSize: 15, fontWeight: 600 }}>
              Imagem radiográfica adicionada
            </h3>
            <p className="mt-2 mb-2" style={{ fontSize: 13, color: '#666' }}>
              18/01/2025 • Dr. Rui Matos
            </p>
            <p className="m-0" style={{ fontSize: 14, color: '#333' }}>
              Resumo: RX coluna — sem fraturas.
            </p>
          </div>
          <span className="badge" style={{ background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontWeight: 500, color: '#333' }}>
            Imagem
          </span>
        </div>
      </div>
    </section>
  )
}
