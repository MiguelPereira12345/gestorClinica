import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

const ConfirmContext = createContext(null)

function normalizeOptions(options) {
	return {
		title: 'Confirmar',
		message: 'Tem a certeza?',
		confirmText: 'Confirmar',
		cancelText: 'Cancelar',
		confirmVariant: 'danger',
		...options,
	}
}

export function ConfirmProvider({ children }) {
	const [modal, setModal] = useState({ open: false, options: normalizeOptions({}) })
	const resolverRef = useRef(null)
	const lastActiveElementRef = useRef(null)
	const confirmBtnRef = useRef(null)

	const confirm = useCallback((options = {}) => {
		const normalized = normalizeOptions(options)
		return new Promise((resolve) => {
			resolverRef.current = resolve
			lastActiveElementRef.current = document.activeElement
			setModal({ open: true, options: normalized })
		})
	}, [])

	const close = useCallback((result) => {
		setModal((m) => ({ ...m, open: false }))
		const resolve = resolverRef.current
		resolverRef.current = null
		if (typeof resolve === 'function') resolve(result)
		queueMicrotask(() => {
			try {
				lastActiveElementRef.current?.focus?.()
			} catch {
				// ignore
			}
		})
	}, [])

	useEffect(() => {
		if (!modal.open) return
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = prevOverflow
		}
	}, [modal.open])

	useEffect(() => {
		if (!modal.open) return
		function onKeyDown(e) {
			if (e.key === 'Escape') {
				e.preventDefault()
				close(false)
			}
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [modal.open, close])

	useEffect(() => {
		if (!modal.open) return
		queueMicrotask(() => confirmBtnRef.current?.focus?.())
	}, [modal.open])

	const contextValue = useMemo(() => confirm, [confirm])

	return (
		<ConfirmContext.Provider value={contextValue}>
			{children}
			{modal.open
				? createPortal(
					<>
						<div
							className="modal fade show"
							role="dialog"
							aria-modal="true"
							style={{ display: 'block' }}
							onMouseDown={(e) => {
								// Click outside -> cancel
								if (e.target === e.currentTarget) close(false)
							}}
						>
							<div className="modal-dialog modal-dialog-centered" role="document">
								<div className="modal-content" style={{ borderRadius: 'var(--ui-radius-md)' }}>
									<div className="modal-header">
										<div className="d-flex align-items-center gap-2">
											<AlertTriangle size={18} aria-hidden="true" />
											<h5 className="modal-title" style={{ margin: 0 }}>
												{modal.options.title}
											</h5>
										</div>
										<button
											type="button"
											className="btn-close"
											aria-label="Fechar"
											onClick={() => close(false)}
										></button>
									</div>
									<div className="modal-body">
										<div style={{ whiteSpace: 'pre-line', fontWeight: 600, color: 'var(--ui-ink)' }}>
											{modal.options.message}
										</div>
									</div>
									<div className="modal-footer">
										<button type="button" className="btn btn-light" onClick={() => close(false)}>
											{modal.options.cancelText}
										</button>
										<button
											type="button"
											ref={confirmBtnRef}
											className={`btn btn-${modal.options.confirmVariant === 'danger' ? 'danger' : modal.options.confirmVariant}`}
											onClick={() => close(true)}
										>
											{modal.options.confirmText}
										</button>
									</div>
								</div>
							</div>
						</div>
						<div className="modal-backdrop fade show"></div>
					</>,
					document.body,
				)
				: null}
		</ConfirmContext.Provider>
	)
}

export function useConfirm() {
	const ctx = useContext(ConfirmContext)
	if (!ctx) {
		throw new Error('useConfirm must be used within a ConfirmProvider')
	}
	return ctx
}
