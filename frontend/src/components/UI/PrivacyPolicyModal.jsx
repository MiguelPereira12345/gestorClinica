import React, { useEffect, useRef } from 'react'

export default function PrivacyPolicyModal({ open, onClose }) {
	const closeButtonRef = useRef(null)

	useEffect(() => {
		if (!open) return
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = previousOverflow
		}
	}, [open])

	useEffect(() => {
		if (!open) return
		const handleKeyDown = (e) => {
			if (e.key === 'Escape') onClose?.()
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [open, onClose])

	useEffect(() => {
		if (!open) return
		closeButtonRef.current?.focus()
	}, [open])

	if (!open) return null

	return (
		<div
			className="policy-modal-backdrop"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose?.()
			}}
		>
			<div className="policy-modal" role="dialog" aria-modal="true" aria-labelledby="policyModalTitle">
				<div className="policy-modal-header">
					<div id="policyModalTitle" className="h5 mb-0">
						Política de Privacidade
					</div>
					<div className="small muted mt-1">
						Resumo informativo sobre tratamento de dados.
					</div>
				</div>

				<div className="policy-modal-body">
					<div className="policy-section">
						<div className="policy-section-title">1) Que dados recolhemos</div>
						<div className="muted">
							Podem ser recolhidos dados de identificação e contacto, bem como informação necessária
							para a prestação de cuidados de saúde e gestão de marcações.
						</div>
					</div>

					<div className="policy-section">
						<div className="policy-section-title">2) Finalidade</div>
						<div className="muted">
							Gestão de consultas, comunicação com o utente e cumprimento de obrigações legais.
						</div>
					</div>

					<div className="policy-section">
						<div className="policy-section-title">3) Conservação</div>
						<div className="muted">
							Os dados são conservados apenas pelo período necessário às finalidades acima e/ou pelos
							prazos legalmente exigidos.
						</div>
					</div>

					<div className="policy-section">
						<div className="policy-section-title">4) Direitos</div>
						<div className="muted">
							Pode solicitar acesso, retificação ou eliminação (quando aplicável), bem como exercer
							outros direitos previstos no RGPD.
						</div>
					</div>

					<div className="policy-section">
						<div className="policy-section-title">5) Contacto</div>
						<div className="muted">
							Para esclarecimentos, contacte-nos através dos canais indicados na página de contactos.
						</div>
					</div>
				</div>

				<div className="policy-modal-footer">
					<button
						ref={closeButtonRef}
						type="button"
						className="btn btn-outline-gold rounded-pill px-4"
						onClick={() => onClose?.()}
					>
						Fechar
					</button>
				</div>
			</div>
		</div>
	)
}
