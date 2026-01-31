import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, maxPage, onPrev, onNext }) {
	return (
		<div className="d-inline-flex align-items-center gap-2">
			<button
				type="button"
				className="btn btn-light btn-sm"
				onClick={onPrev}
				disabled={page <= 1}
				aria-label="Página anterior"
			>
				<ChevronLeft width="16" height="16" aria-hidden="true" />
			</button>
			<span className="ui-meta">Página {page} de {maxPage}</span>
			<button
				type="button"
				className="btn btn-light btn-sm"
				onClick={onNext}
				disabled={page >= maxPage}
				aria-label="Próxima página"
			>
				<ChevronRight width="16" height="16" aria-hidden="true" />
			</button>
		</div>
	)
}
