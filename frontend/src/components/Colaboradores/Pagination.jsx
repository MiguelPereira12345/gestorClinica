import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, maxPage, onPrev, onNext }) {
	return (
		<div className="colaboradores-pagination">
			<button
				type="button"
				className="colaboradores-page-btn"
				onClick={onPrev}
				disabled={page <= 1}
				aria-label="Página anterior"
			>
				<ChevronLeft width="16" height="16" aria-hidden="true" />
			</button>
			<span className="colaboradores-page-meta">
				Página {page} de {maxPage}
			</span>
			<button
				type="button"
				className="colaboradores-page-btn"
				onClick={onNext}
				disabled={page >= maxPage}
				aria-label="Próxima página"
			>
				<ChevronRight width="16" height="16" aria-hidden="true" />
			</button>
		</div>
	)
}
