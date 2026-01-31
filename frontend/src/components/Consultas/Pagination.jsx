import React from 'react'

export default function Pagination({ page, maxPage, onPrev, onNext }) {
	return (
		<div className="consultas-pagination">
			<button
				type="button"
				className="consultas-page-btn"
				onClick={onPrev}
				disabled={page <= 1}
			>
				Anterior
			</button>
			<div className="consultas-page-meta">Página {page} de {maxPage}</div>
			<button
				type="button"
				className="consultas-page-btn"
				onClick={onNext}
				disabled={page >= maxPage}
			>
				Seguinte
			</button>
		</div>
	)
}
