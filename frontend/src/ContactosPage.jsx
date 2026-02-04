import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock, Bus, Car } from 'lucide-react'

import './webpage.css'
import PrivacyPolicyModal from './components/UI/PrivacyPolicyModal'
import logoClinimolelos from './assets/Logo-CliniMolelos.png'

function ContactosPage() {
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
								<Link className="nav-link" to="/equipa">
									Equipa
								</Link>
							</li>
							<li className="nav-item">
								<Link className="nav-link active" to="/contactos">
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
					<div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
						<div>
							<h1 className="display-6 mb-2">Contactos</h1>
							<p className="muted mb-0">
								Fale connosco para marcações, dúvidas sobre tratamentos ou apoio ao utente.
							</p>
						</div>

						<a className="btn btn-outline-gold rounded-pill px-4" href="tel:+351232823220">
							<span className="d-inline-flex align-items-center gap-2">
								<Phone size={18} />
								Ligue já: +351 232 823 220
							</span>
						</a>
					</div>
				</div>
			</header>

			<section className="py-5">
				<div className="container py-4">
					<div className="row g-4">
						<div className="col-12">
							<div className="card card-soft shadow-sm h-100">
								<div className="card-body p-4">
									<div className="fw-semibold mb-3">Localização e horários</div>

									<div className="d-flex flex-column gap-2">
										<div className="d-flex align-items-start gap-2 p-3 bg-light rounded-3 border">
											<MapPin size={18} className="mt-1 flex-shrink-0" />
											<div>
												<div className="small text-uppercase muted">Morada</div>
												<div className="fw-semibold">Av. Dr. Adriano Figueiredo 158,</div>
												<div className="small">3460-009 Tondela</div>
											</div>
										</div>

										<div className="d-flex align-items-center gap-2 p-3 bg-light rounded-3 border">
											<Mail size={18} className="flex-shrink-0" />
											<div className="flex-grow-1">
												<div className="small text-uppercase muted">Email</div>
												<a className="text-decoration-none" href="mailto:geral@clinimolelos.pt">
													geral@clinimolelos.pt
												</a>
											</div>
										</div>

										<div className="d-flex align-items-center gap-2 p-3 bg-light rounded-3 border">
											<Phone size={18} className="flex-shrink-0" />
											<div className="flex-grow-1">
												<div className="small text-uppercase muted">Telefone</div>
												<a className="text-decoration-none" href="tel:+351232823220">
													+351 232 823 220
												</a>
											</div>
										</div>

										<div className="p-3 bg-white rounded-3 border">
											<div className="d-flex align-items-center gap-2 mb-2">
												<Clock size={18} className="flex-shrink-0" />
												<div className="fw-semibold">Horário</div>
											</div>
											<div className="d-flex justify-content-between small">
												<span className="muted">Seg — Sex</span>
												<span>08:00 — 19:00</span>
											</div>
											<div className="d-flex justify-content-between small">
												<span className="muted">Sábado</span>
												<span>09:00 — 13:00</span>
											</div>
											<div className="d-flex justify-content-between small">
												<span className="muted">Domingo</span>
												<span>Encerrado</span>
											</div>
										</div>

										<div className="row g-3">
											<div className="col-12 col-md-6">
												<div className="p-3 bg-white rounded-3 border h-100">
													<div className="d-flex align-items-center gap-2">
														<Bus size={18} className="flex-shrink-0" />
														<div>
															<div className="fw-semibold">Transportes</div>
															<div className="small muted">Autocarro e acessos locais</div>
														</div>
													</div>
												</div>
											</div>
											<div className="col-12 col-md-6">
												<div className="p-3 bg-white rounded-3 border h-100">
													<div className="d-flex align-items-center gap-2">
														<Car size={18} className="flex-shrink-0" />
														<div>
															<div className="fw-semibold">Estacionamento</div>
															<div className="small muted">Parque privado e parque público</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="ratio ratio-16x9 bg-light rounded-4 overflow-hidden border mt-3">
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

export default ContactosPage
