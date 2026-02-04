import React from 'react'
import { sanitizeDigits, sanitizeName, sanitizePhone } from '../../utils/validation'

export default function Informacao({ isEditing, data, onChange }) {
  const safeBirthDateValue = (() => {
    const raw = String(data?.dataNascimento || '').trim()
    // expects dd/mm/yyyy
    const parts = raw.split('/')
    if (parts.length !== 3) return ''
    const [dd, mm, yyyy] = parts
    if (!dd || !mm || !yyyy) return ''
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  })()

  return (
    <section className="ui-card p-3 mb-3" aria-label="Informações Gerais">
      <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
        Informações Gerais
      </h2>
      <p className="mt-1 mb-3" style={{ fontSize: 13, color: '#999' }}>
        {isEditing ? 'Editar dados do utente' : 'Dados principais do utente (modo leitura)'}
      </p>

      <div className="border rounded-2 overflow-hidden" style={{ borderColor: '#ddd' }}>
        <div className="d-flex border-bottom" style={{ borderColor: '#ddd' }}>
          <div className="p-3" style={{ minWidth: 200, background: '#f9f9f9', fontWeight: 500, fontSize: 14 }}>
            Nome completo
          </div>
          <div className="p-3 flex-grow-1" style={{ fontSize: 14 }}>
            {isEditing ? (
              <input
                className="form-control"
                value={data.nomeCompleto}
                onChange={(e) => onChange('nomeCompleto', sanitizeName(e.target.value))}
                maxLength={120}
              />
            ) : (
              data.nomeCompleto
            )}
          </div>
        </div>

        <div className="d-flex border-bottom" style={{ borderColor: '#ddd' }}>
          <div className="p-3" style={{ minWidth: 200, background: '#f9f9f9', fontWeight: 500, fontSize: 14 }}>
            Data de nascimento
          </div>
          <div className="p-3 flex-grow-1" style={{ fontSize: 14 }}>
            {isEditing ? (
              <input
                className="form-control"
                type="date"
                value={safeBirthDateValue}
                onChange={(e) => {
                  const v = String(e.target.value || '')
                  if (!v) {
                    onChange('dataNascimento', '')
                    return
                  }
                  const [yyyy, mm, dd] = v.split('-')
                  onChange('dataNascimento', `${dd}/${mm}/${yyyy}`)
                }}
              />
            ) : (
              data.dataNascimento
            )}
          </div>
        </div>

        <div className="d-flex border-bottom" style={{ borderColor: '#ddd' }}>
          <div className="p-3" style={{ minWidth: 200, background: '#f9f9f9', fontWeight: 500, fontSize: 14 }}>
            Nº de Utente / NIF
          </div>
          <div className="p-3 flex-grow-1" style={{ fontSize: 14 }}>
            {isEditing ? (
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <input
                    className="form-control"
                    placeholder="Nº Utente"
                    value={data.numeroUtente}
                    onChange={(e) => onChange('numeroUtente', sanitizeDigits(e.target.value, { maxDigits: 9 }))}
                    inputMode="numeric"
                    maxLength={9}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <input
                    className="form-control"
                    placeholder="NIF"
                    value={data.nif}
                    onChange={(e) => onChange('nif', sanitizeDigits(e.target.value, { maxDigits: 9 }))}
                    inputMode="numeric"
                    maxLength={9}
                  />
                </div>
              </div>
            ) : (
              <>Utente: {data.numeroUtente} • NIF: {data.nif}</>
            )}
          </div>
        </div>

        <div className="d-flex border-bottom" style={{ borderColor: '#ddd' }}>
          <div className="p-3" style={{ minWidth: 200, background: '#f9f9f9', fontWeight: 500, fontSize: 14 }}>
            Contactos
          </div>
          <div className="p-3 flex-grow-1" style={{ fontSize: 14 }}>
            {isEditing ? (
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <input
                    className="form-control"
                    placeholder="Telefone"
                    value={data.telefone}
                    onChange={(e) => onChange('telefone', sanitizePhone(e.target.value))}
                    inputMode="tel"
                    maxLength={16}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <input
                    className="form-control"
                    placeholder="Email"
                    type="email"
                    value={data.email}
                    onChange={(e) => onChange('email', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                {data.telefone} • {data.email}
              </>
            )}
          </div>
        </div>

        <div className="d-flex">
          <div className="p-3" style={{ minWidth: 200, background: '#f9f9f9', fontWeight: 500, fontSize: 14 }}>
            Data de registo
          </div>
          <div className="p-3 flex-grow-1" style={{ fontSize: 14 }}>
            {data.dataRegisto}
          </div>
        </div>
      </div>
    </section>
  )
}
