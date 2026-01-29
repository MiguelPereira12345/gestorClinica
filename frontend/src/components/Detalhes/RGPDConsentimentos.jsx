 import React from 'react'

export default function RGPDConsentimentos() {
  return (
    <div className="patient-section">
      <h2 className="patient-section-title">RGPD / Consentimentos</h2>
      <p className="patient-section-subtitle">Conformidade e auditoria</p>
      
      <div className="rgpd-card">
        <div className="rgpd-row">
          <span className="rgpd-label">Consentimento</span>
          <span className="rgpd-badge rgpd-badge-accepted">Aceito</span>
        </div>
        
        <div className="rgpd-row">
          <span className="rgpd-label">Data</span>
          <span className="rgpd-value">12/05/2025 09:12</span>
        </div>
        
        <div className="rgpd-row">
          <span className="rgpd-label">IP</span>
          <span className="rgpd-value">203.0.113.42</span>
        </div>
        
        <div className="rgpd-row">
          <span className="rgpd-label">Versão</span>
          <span className="rgpd-value">v1.2</span>
        </div>
        
        <div className="rgpd-row">
          <span className="rgpd-label">Último acesso</span>
          <span className="rgpd-value">14/05/2025 17:20 <strong>por admin@clinimolelos.pt</strong></span>
        </div>
      </div>
    </div>
  )
}
