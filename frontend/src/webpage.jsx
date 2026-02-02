import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
	CalendarDays,
	Bell,
	Activity,
	Download,
	Instagram,
	Facebook,
	Youtube,
} from 'lucide-react'

import './webpage.css'
import ProfileModal from './components/UI/ProfileModal'
import PrivacyPolicyModal from './components/UI/PrivacyPolicyModal'
import equipaEspecialistas from './data/equipaEspecialistas'
import logoClinimolelos from './assets/Logo-CliniMolelos.png'

function Webpage() {
	const equipa = useMemo(() => equipaEspecialistas, [])
	const [selectedProfile, setSelectedProfile] = useState(null)
	const [policyOpen, setPolicyOpen] = useState(false)
	const fallbackPhoto = 'https://placehold.co/96x96/png'

	return (
		<div className="webpage bg-white">
			{/* Navbar */}
			<nav className="navbar navbar-expand-lg bg-white sticky-top border-bottom">
				<div className="container py-2">
					<a className="navbar-brand d-flex align-items-center gap-2" href="#inicio">
						<span className="logo-mark" aria-hidden="true">
							<img src={logoClinimolelos} alt="" width="24" height="24" />
						</span>
						<span className="fw-semibold">Clinimolelos</span>
					</a>

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
								<a className="nav-link" href="#inicio">
									Início
								</a>
							</li>
							<li className="nav-item">
								<Link className="nav-link" to="/equipa">
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

			{/* Hero */}
			<header id="inicio" className="hero">
				<div className="container py-5">
					<div className="row align-items-center g-5">
						<div className="col-12 col-lg-6">
							<div className="hero-eyebrow mb-2">Portal do Paciente</div>
							<h1 className="hero-title display-5 mb-3">
								A SUA SAÚDE DENTÁRIA NA PALMA DA SUA MÃO
							</h1>
							<p className="muted mb-4">
								Faça a gestão das suas consultas, receba alertas e acompanhe os seus
								tratamentos através da nossa app simples e segura.
							</p>

							<div className="d-flex flex-wrap gap-3">
								<a className="btn btn-outline-gold rounded-pill px-4" href="#contactos">
									<span className="d-inline-flex align-items-center gap-2">
										<Download size={18} />
										Descarregar App
									</span>
								</a>
							</div>
						</div>

						<div className="col-12 col-lg-6">
							<div className="rounded-4 overflow-hidden shadow-sm border">
								<img
									className="img-fluid"
									alt="Médico dentista com paciente"
									src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1400&q=80"
									loading="lazy"
								/>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Sobre a App */}
			<section className="py-5 bg-light">
				<div className="container py-4">
					<div className="d-flex align-items-end justify-content-between flex-wrap gap-3 mb-4">
						<h2 className="h3 mb-0">Sobre a App</h2>
					</div>

					<div className="row g-4">
						<div className="col-12 col-md-4">
							<div className="card card-soft shadow-sm h-100">
								<div className="card-body p-4">
									<div className="text-gold mb-3">
										<CalendarDays size={22} />
									</div>
									<h3 className="h6 fw-semibold">Agende consultas facilmente</h3>
									<p className="muted mb-0">
										Escolha data, médico e clínica em segundos.
									</p>
								</div>
							</div>
						</div>

						<div className="col-12 col-md-4">
							<div className="card card-soft shadow-sm h-100">
								<div className="card-body p-4">
									<div className="text-gold mb-3">
										<Bell size={22} />
									</div>
									<h3 className="h6 fw-semibold">Receba lembretes automáticos</h3>
									<p className="muted mb-0">
										Notificações para não perder a sua consulta.
									</p>
								</div>
							</div>
						</div>

						<div className="col-12 col-md-4">
							<div className="card card-soft shadow-sm h-100">
								<div className="card-body p-4">
									<div className="text-gold mb-3">
										<Activity size={22} />
									</div>
									<h3 className="h6 fw-semibold">Acompanhe os seus tratamentos</h3>
									<p className="muted mb-0">Histórico e evolução sempre consigo.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Equipa */}
			<section id="equipa" className="py-5 bg-cream">
				<div className="container py-4">
					<h2 className="h3 mb-4">Conheça a nossa equipa de especialistas</h2>

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

			{/* Contactos */}
			<section id="contactos" className="py-5">
				<div className="container py-4">
					<h2 className="h3 mb-4">Contactos e Localização</h2>

					<div className="row g-4">
						<div className="col-12">
							<div className="card card-soft shadow-sm h-100">
								<div className="card-body p-4">
									<div className="mb-3">
										<div className="fw-semibold">Clinimolelos</div>
										<div className="small">
											<span className="fw-semibold">Av. Dr. Adriano Figueiredo 158, 3460-009 Tondela</span>
										</div>
										<div className="small">
											<span className="fw-semibold">Telefone:</span> +351 232 823 220
										</div>
										<div className="small">
											<span className="fw-semibold">Email:</span> geral@clinimolelos.pt
										</div>
									</div>

									<div className="ratio ratio-16x9 bg-light rounded-4 overflow-hidden border">
										<iframe
											title="Mapa Clinimolelos"
											src="https://www.openstreetmap.org/export/embed.html?bbox=-8.1382%2C40.5177%2C-8.1242%2C40.5252&layer=mapnik&marker=40.5214%2C-8.1312"
											style={{ border: 0 }}
											loading="lazy"
											referrerPolicy="no-referrer-when-downgrade"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-white border-top">
				<div className="container py-4">
					<div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
						<div className="d-flex align-items-center gap-2">
							<span className="logo-mark" aria-hidden="true">
								<img src={logoClinimolelos} alt="" width="24" height="24" />
							</span>
							<span className="small">Clinimolelos</span>
						</div>

						<div className="d-flex align-items-center gap-2">
							<a className="text-gold" href="#" aria-label="Instagram">
								<Instagram size={18} />
							</a>
							<a className="text-gold" href="#" aria-label="Facebook">
								<Facebook size={18} />
							</a>
							<a className="text-gold" href="#" aria-label="YouTube">
								<Youtube size={18} />
							</a>
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

export default Webpage

