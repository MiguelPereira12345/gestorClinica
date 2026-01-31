import React from 'react'

export default function AnexosClinicos() {
  return (
    <section className="ui-card p-3 mb-3" aria-label="Anexos Clínicos">
      <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
        Anexos Clínicos
      </h2>
      <p className="mt-1 mb-3" style={{ fontSize: 13, color: '#999' }}>
        Pré-visualizações com ações seguras
      </p>

      <div className="row g-3">
        {[
          { src: '/placeholder-xray.jpg', alt: 'Radiografia', title: 'Radiografia', subtitle: 'Tórax' },
          { src: '/placeholder-document.jpg', alt: 'Exame', title: 'Exame', subtitle: 'Sangue' },
          { src: '/placeholder-photo.jpg', alt: 'Foto', title: 'Foto', subtitle: 'Lesão' },
        ].map((item) => (
          <div className="col-12 col-md-6 col-lg-4" key={item.src}>
            <div className="border rounded-3 overflow-hidden bg-white" style={{ borderColor: '#ddd' }}>
              <div className="ratio ratio-4x3 bg-light">
                <img src={item.src} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div className="p-3">
                <div className="mb-2">
                  <h3 className="m-0" style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
                    {item.title}
                  </h3>
                  <p className="mt-1 mb-0" style={{ fontSize: 13, color: '#666' }}>
                    {item.subtitle}
                  </p>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <button className="btn btn-light btn-sm w-100" type="button">
                      Ver
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      className="btn btn-sm w-100"
                      type="button"
                      style={{ background: '#b8956a', borderColor: '#b8956a', color: 'white' }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
