import React, { useEffect, useMemo, useRef } from 'react'

function ProfileModal({ open, profile, onClose }) {
	const closeButtonRef = useRef(null)
	const fallbackPhoto = useMemo(() => 'https://placehold.co/160x160/png', [])

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

	if (!open || !profile) return null

	const areas = Array.isArray(profile.areas) ? profile.areas.filter(Boolean) : []

	return (
		<div
			className="profile-modal-backdrop"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose?.()
			}}
		>
			<div
				className="profile-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="profileModalTitle"
			>
				<div className="profile-modal-header">
					<div className="profile-modal-identity">
						<img
							src={profile.photo || fallbackPhoto}
							alt={`Foto de ${profile.name}`}
							onError={(e) => {
								e.currentTarget.onerror = null
								e.currentTarget.src = fallbackPhoto
							}}
							className="profile-modal-avatar"
							width="96"
							height="96"
							loading="lazy"
						/>
						<div className="flex-grow-1">
							<div id="profileModalTitle" className="h5 mb-1">
								{profile.name}
							</div>

							<div className="d-flex flex-wrap gap-2 align-items-center">
								{profile.role ? (
									<span className="profile-pill profile-pill-gold">{profile.role}</span>
								) : null}
								{profile.omd ? (
									<span className="profile-pill">{profile.omd}</span>
								) : null}
							</div>
						</div>
					</div>
				</div>

				<div className="profile-modal-body">
					{areas.length > 0 ? (
						<>
							<div className="profile-section-title">Áreas de atuação</div>
							<div className="d-flex flex-wrap gap-2">
								{areas.map((area) => (
									<span key={area} className="profile-chip">
										{area}
									</span>
								))}
							</div>
						</>
					) : (
						<div className="muted">Sem informação adicional.</div>
					)}
				</div>

				<div className="profile-modal-footer">
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

export default ProfileModal
