import React, { useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import { Info, LogIn, Lock, Mail, RefreshCcw } from 'lucide-react'

import logoClinimolelos from './assets/Logo-CliniMolelos.png'
import { syncAllFromApi } from './utils/dataSync'
import { getApiBaseUrl } from './utils/apiClient'

export default function Login() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			const apiBase = getApiBaseUrl()

			async function tryLogin(path) {
				const response = await fetch(`${apiBase}${path}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, senha: password }),
				})
				const data = await response.json().catch(() => null)
				return { response, data }
			}

			// 1) Tenta como colaborador (admin/secretaria/médico)
			let out = await tryLogin('/auth/admin/login')
			if (out.response.ok) {
				localStorage.setItem('auth_user', JSON.stringify(out.data))
				try {
					await syncAllFromApi()
				} catch {
					// ignore
				}
				navigate('/pagina-inicial', { replace: true })
				return
			}

			// 2) Se falhou, tenta como paciente
			out = await tryLogin('/auth/paciente/login')
			if (out.response.ok) {
				localStorage.setItem('auth_user', JSON.stringify(out.data))
				navigate('/portal', { replace: true })
				return
			}

			setError(out.data?.message || 'Credenciais inválidas')
		} catch (err) {
			console.error('Erro no login:', err)
			setError('Erro de conexão. Verifique se o servidor está ativo.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div
			className="position-fixed top-0 start-0 w-100 h-100 overflow-auto"
			style={{ background: '#f4f1ec', zIndex: 999 }}
		>
			<div className="container-fluid h-100">
				<div className="row g-0 h-100">
					<section
						className="col-lg-5 d-none d-lg-flex align-items-center justify-content-center bg-white border-end"
						aria-label="Clinimolelos"
					>
						<div className="text-center" style={{ width: '100%', maxWidth: 420 }}>
							<img
								src={logoClinimolelos}
								alt="CLINIMOLELOS"
								decoding="async"
								loading="eager"
								draggable="false"
								className="img-fluid"
								style={{ maxWidth: 360 }}
							/>

							<p className="mt-4 mb-0 text-muted fw-semibold" style={{ fontSize: 15, lineHeight: 1.45 }}>
								Aceda ao sistema clínico para gerir Horários, Consultas, Pacientes e Faturação.
							</p>
						</div>
					</section>

					<section
						className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-3 p-lg-5"
						aria-label="Entrar"
					>
						<div
							className="ui-card w-100"
							style={{
								maxWidth: 620,
								background: '#fff',
								boxShadow: '0 18px 45px rgba(16, 24, 40, 0.18)',
							}}
						>
							<div className="d-flex align-items-center gap-2 border-bottom px-3 px-lg-4 py-3">
								<LogIn style={{ width: 18, height: 18 }} aria-hidden="true" />
								<h2 className="m-0 fw-bold" style={{ fontSize: 16 }}>
									Entrar
								</h2>
							</div>

							<form className="px-3 px-lg-4 py-3" onSubmit={handleSubmit}>
								{error ? (
									<div className="alert alert-danger d-flex align-items-start gap-2" role="alert" aria-live="assertive">
										<Info style={{ width: 18, height: 18, marginTop: 1 }} aria-hidden="true" />
										<div>{error}</div>
									</div>
								) : null}

								<label className="form-label fw-bold" htmlFor="login-email">
									E-mail
								</label>
								<div className="input-group mb-3">
									<span className="input-group-text bg-white">
										<Mail style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
									</span>
									<input
										id="login-email"
										type="email"
										className="form-control"
										placeholder="nome@exemplo.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										autoComplete="email"
										required
									/>
								</div>

								<label className="form-label fw-bold" htmlFor="login-password">
									Palavra-passe
								</label>
								<div className="input-group mb-3">
									<span className="input-group-text bg-white">
										<Lock style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
									</span>
									<input
										id="login-password"
										type="password"
										className="form-control"
										placeholder="••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										autoComplete="current-password"
										required
									/>
								</div>

								<div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mt-3">
									<button
										className="btn btn-link p-0 text-decoration-none text-dark fw-semibold d-inline-flex align-items-center gap-2"
										type="button"
										onClick={() => navigate('/recuperar-palavra-passe')}
									>
										<RefreshCcw style={{ width: 16, height: 16, opacity: 0.8 }} aria-hidden="true" />
										<span className="lh-sm text-start">
											Recuperar
											<br />
											Palavra-passe
										</span>
									</button>

									<button className="btn btn-primary" type="submit" disabled={isSubmitting}>
										<LogIn style={{ width: 16, height: 16 }} aria-hidden="true" />
										{isSubmitting ? 'A entrar…' : 'Entrar'}
									</button>
								</div>

							</form>
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}

