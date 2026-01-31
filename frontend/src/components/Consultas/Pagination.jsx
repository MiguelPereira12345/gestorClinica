import React from 'react'

export default function Pagination({ page, maxPage, onPrev, onNext }) {
	return (
		<div className="d-inline-flex align-items-center gap-2">
			<nav aria-label="Paginação">
				<ul className="pagination pagination-sm mb-0">
					<li className={`page-item${page <= 1 ? ' disabled' : ''}`}>
						<button type="button" className="page-link" onClick={onPrev} disabled={page <= 1}>
							Anterior
						</button>
					</li>
					<li className={`page-item${page >= maxPage ? ' disabled' : ''}`}>
						<button type="button" className="page-link" onClick={onNext} disabled={page >= maxPage}>
							Seguinte
						</button>
					</li>
				</ul>
			</nav>
			<div className="ui-meta">Página {page} de {maxPage}</div>
		</div>
	)
}
