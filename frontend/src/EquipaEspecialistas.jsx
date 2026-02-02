import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import './webpage.css'
import ProfileModal from './components/UI/ProfileModal'
import PrivacyPolicyModal from './components/UI/PrivacyPolicyModal'
import equipaEspecialistas from './data/equipaEspecialistas'
import logoClinimolelos from './assets/Logo-CliniMolelos.png'

function EquipaEspecialistas() {
	const fallbackPhoto = 'https://placehold.co/96x96/png'
	const equipa = useMemo(() => equipaEspecialistas, [])
	const [selectedProfile, setSelectedProfile] = useState(null)
	const [policyOpen, setPolicyOpen] = useState(false)

	return (
		<div className="webpage bg-white">
			<nav className="navbar navbar-expand-lg bg-white sticky-top border-bottom">
				<div className="container py-2">
					<Link className="navbar-brand d-flex align-items-center gap-2" to="/">
						<span className="logo-mark" aria-hidden="true">
							<img src={logoClinimolelos} alt="" width="24" height="24" />
						</span>
						<span className="fw-semibold">Clinimolelos</span>
					</Link>

					<button
						className="navbar-toggler"
						type="button"
						data-bs-toggle="collapse"
						data-bs-target="#clinimolelosNavbar"
						aria-controls="clinimolelosNavbar"
						aria-expanded="false"
						aria-label="Toggle navigation"
					>
						<span className="navbar-toggler-icon" />
					</button>

					<div className="collapse navbar-collapse" id="clinimolelosNavbar">
						<ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
							<li className="nav-item">
								<Link className="nav-link" to="/">
									Início
								</Link>
							</li>
							<li className="nav-item">
								<Link className="nav-link active" to="/equipa">
									Equipa
								</Link>
							</li>
							<li className="nav-item">
								<Link className="nav-link" to="/contactos">
									Contactos
								</Link>
							</li>
						</ul>

						<div className="d-flex">
							<Link className="btn btn-gold rounded-pill px-4" to="/login">
								Iniciar Sessão
							</Link>
						</div>
					</div>
				</div>
			</nav>

			<header className="py-5 bg-white border-bottom">
				<div className="container py-4">
					<h1 className="display-6 mb-2">Equipa de especialistas</h1>
					<p className="muted mb-0">
						Conheça os profissionais que cuidam do seu sorriso.
					</p>
				</div>
			</header>

			<section className="py-5 bg-cream">
				<div className="container py-4">
					<div className="row g-4">
						{equipa.map((p) => (
							<div key={p.id || p.name} className="col-12 col-lg-4">
								<div className="card card-soft shadow-sm h-100">
									<div className="card-body p-4">
										<div className="d-flex gap-3 align-items-center">
											<img
												src={p.photo || fallbackPhoto}
												alt={`Foto de ${p.name}`}
												onError={(e) => {
													e.currentTarget.onerror = null
													e.currentTarget.src = fallbackPhoto
												}}
												className="team-avatar rounded-4 flex-shrink-0 border"
												width="72"
												height="72"
												loading="lazy"
											/>
											<div className="flex-grow-1">
												<div className="fw-semibold">{p.name}</div>
												<div className="small muted">{p.omd}</div>
												<div className="small muted">{p.role}</div>
													<button
														type="button"
														className="btn btn-link p-0 small text-gold text-decoration-none"
														onClick={() => setSelectedProfile(p)}
													>
														Ver perfil
													</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<ProfileModal
				open={Boolean(selectedProfile)}
				profile={selectedProfile}
				onClose={() => setSelectedProfile(null)}
			/>

			<footer className="bg-white border-top">
				<div className="container py-4">
					<div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
						<div className="d-flex align-items-center gap-2">
							<span className="logo-mark" aria-hidden="true">
								<img src={logoClinimolelos} alt="" width="24" height="24" />
							</span>
							<span className="small">Clinimolelos</span>
						</div>
						<div className="small muted">
							© 2025 Clinimolelos. Todos os direitos reservados ·{' '}
							<button
								type="button"
								className="policy-link text-gold"
								onClick={() => setPolicyOpen(true)}
							>
								Política de Privacidade
							</button>
						</div>
					</div>
				</div>
			</footer>

			<PrivacyPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
		</div>
	)
}

export default EquipaEspecialistas
