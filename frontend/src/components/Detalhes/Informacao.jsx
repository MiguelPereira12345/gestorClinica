import React from 'react'

export default function Informacao({ isEditing, data, onChange }) {
  return (
    <section className="ui-card p-3 mb-3" aria-label="Informações Gerais">
      <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
        Informações Gerais
      </h2>
      <p className="mt-1 mb-3" style={{ fontSize: 13, color: '#999' }}>
        {isEditing ? 'Editar dados do paciente' : 'Dados principais do paciente (modo leitura)'}
      </p>

      <div className="border rounded-2 overflow-hidden" style={{ borderColor: '#ddd' }}>
        <div className="d-flex border-bottom" style={{ borderColor: '#ddd' }}>
          <div className="p-3" style={{ minWidth: 200, background: '#f9f9f9', fontWeight: 500, fontSize: 14 }}>
            Nome completo
          </div>
          <div className="p-3 flex-grow-1" style={{ fontSize: 14 }}>
            {isEditing ? (
              <input className="form-control" value={data.nomeCompleto} onChange={(e) => onChange('nomeCompleto', e.target.value)} />
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
                value={data.dataNascimento.split('/').reverse().join('-')}
                onChange={(e) => onChange('dataNascimento', e.target.value.split('-').reverse().join('/'))}
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
                    onChange={(e) => onChange('numeroUtente', e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <input className="form-control" placeholder="NIF" value={data.nif} onChange={(e) => onChange('nif', e.target.value)} />
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
                  <input className="form-control" placeholder="Telefone" value={data.telefone} onChange={(e) => onChange('telefone', e.target.value)} />
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
