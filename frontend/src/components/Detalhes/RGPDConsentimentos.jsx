 import React from 'react'

export default function RGPDConsentimentos() {
  return (
    <section className="ui-card p-3 mb-3" aria-label="RGPD / Consentimentos">
      <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
        RGPD / Consentimentos
      </h2>
      <p className="mt-1 mb-3" style={{ fontSize: 13, color: '#999' }}>
        Conformidade e auditoria
      </p>

      <div className="border rounded-2 bg-white p-3" style={{ borderColor: '#ddd' }}>
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: '#f0f0f0' }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Consentimento</span>
          <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 4, fontSize: 13, fontWeight: 500 }}>
            Aceito
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: '#f0f0f0' }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Data</span>
          <span style={{ fontSize: 14, color: '#333' }}>12/05/2025 09:12</span>
        </div>

        <div className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: '#f0f0f0' }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>IP</span>
          <span style={{ fontSize: 14, color: '#333' }}>203.0.113.42</span>
        </div>

        <div className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: '#f0f0f0' }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Versão</span>
          <span style={{ fontSize: 14, color: '#333' }}>v1.2</span>
        </div>

        <div className="d-flex justify-content-between align-items-center py-2">
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Último acesso</span>
          <span style={{ fontSize: 14, color: '#333' }}>
            14/05/2025 17:20 <strong>por admin@clinimolelos.pt</strong>
          </span>
        </div>
      </div>
    </section>
  )
}
