import React, { useEffect, useState } from 'react'
import './App.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
	ArrowLeft,
	Info,
	Mail,
	RefreshCcw,
	Send,
	ShieldCheck,
} from 'lucide-react'

import logoClinimolelos from './assets/Logo-CliniMolelos.png'
import { apiFetch } from './utils/apiClient'

export default function Recuperarpass() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [email, setEmail] = useState('')
	const [step, setStep] = useState('request') // request | reset
	const [token, setToken] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [feedback, setFeedback] = useState(null)
	const [feedbackVariant, setFeedbackVariant] = useState('info') // info | success | error

	useEffect(() => {
		const t = searchParams.get('token')
		if (t) {
			setToken(String(t))
			setStep('reset')
			setFeedback(null)
			setFeedbackVariant('info')
		}
	}, [searchParams])

	const requestPasswordReset = async () => {
		if (!email) return
		setIsSubmitting(true)
		setFeedback(null)
		setFeedbackVariant('info')

		try {
			const data = await apiFetch('/utilizadores/password-reset/request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			})

			let message =
				data?.message ||
				'Se existir uma conta com esse e-mail, enviamos as instruções de recuperação.'

			setFeedback(message)
			setFeedbackVariant('success')
		} catch (err) {
			const message = err?.data?.message || err?.message || 'Erro de rede ao contactar o servidor.'
			setFeedback(message)
			setFeedbackVariant('error')
		} finally {
			setIsSubmitting(false)
		}
	}

	const confirmPasswordReset = async () => {
		if (!token) {
			setFeedback('Link inválido ou em falta. Peça um novo link.')
			setFeedbackVariant('error')
			return
		}
		if (!newPassword || newPassword.length < 6) {
			setFeedback('A palavra-passe deve ter pelo menos 6 caracteres.')
			setFeedbackVariant('error')
			return
		}
		if (newPassword !== confirmPassword) {
			setFeedback('As palavras-passe não coincidem.')
			setFeedbackVariant('error')
			return
		}

		setIsSubmitting(true)
		setFeedback(null)
		setFeedbackVariant('info')
		try {
			const body = { token, newPassword }
			const data = await apiFetch('/utilizadores/password-reset/confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			setFeedback(data?.message || 'Palavra-passe atualizada com sucesso.')
			setFeedbackVariant('success')
		} catch (err) {
			const message = err?.data?.message || err?.message || 'Erro de rede ao contactar o servidor.'
			setFeedback(message)
			setFeedbackVariant('error')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		if (step === 'reset') {
			confirmPasswordReset()
			return
		}
		requestPasswordReset()
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
								Aceda ao sistema clínico para gerir Horários, Consultas, Utentes e Faturação.
							</p>
						</div>
					</section>

					<section
						className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-3 p-lg-5"
						aria-label="Recuperar palavra-passe"
					>
						<div
							className="ui-card w-100"
							style={{
								maxWidth: 720,
								background: '#fff',
								boxShadow: '0 18px 45px rgba(16, 24, 40, 0.18)',
							}}
						>
							<div className="d-flex align-items-center justify-content-between gap-3 border-bottom px-3 px-lg-4 py-3 flex-wrap">
								<div className="d-inline-flex align-items-center gap-2">
									<RefreshCcw style={{ width: 18, height: 18 }} aria-hidden="true" />
									<h2 className="m-0 fw-bold" style={{ fontSize: 16 }}>
										Recuperar Palavra-passe
									</h2>
								</div>

								<div className="badge text-bg-light border text-dark d-inline-flex align-items-center gap-2 fw-semibold">
									<ShieldCheck style={{ width: 14, height: 14, opacity: 0.85 }} aria-hidden="true" />
									Segurança
								</div>
							</div>

							<form className="px-3 px-lg-4 py-3" onSubmit={handleSubmit}>
								{feedback ? (
									<div
										className={`alert d-flex align-items-start gap-2 ${
											feedbackVariant === 'error'
												? 'alert-danger'
												: feedbackVariant === 'success'
													? 'alert-success'
													: 'alert-info'
										}`}
										role={feedbackVariant === 'error' ? 'alert' : 'status'}
										aria-live={feedbackVariant === 'error' ? 'assertive' : 'polite'}
									>
										<Info style={{ width: 18, height: 18, marginTop: 1 }} aria-hidden="true" />
										<div>{feedback}</div>
									</div>
								) : null}

								<div className="d-flex align-items-start gap-2 text-muted small fw-semibold mb-3">
									<Info style={{ width: 16, height: 16, marginTop: 1, opacity: 0.85 }} aria-hidden="true" />
									<p className="mb-0" style={{ lineHeight: 1.4 }}>
										{step === 'reset'
											? 'Defina uma nova palavra-passe para a sua conta.'
											: 'Introduza o seu e-mail para receber um link de redefinição.'}
									</p>
								</div>

								{step === 'request' ? (
									<>
										<label className="form-label fw-bold" htmlFor="recover-email">
											E-mail associado à conta
										</label>
										<div className="input-group mb-3">
											<span className="input-group-text bg-white">
												<Mail style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
											</span>
											<input
												id="recover-email"
												type="email"
												className="form-control"
												placeholder="nome@exemplo.com"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												autoComplete="email"
												required
											/>
										</div>
									</>
								) : null}

								{step === 'reset' ? (
									<>
										<label className="form-label fw-bold" htmlFor="recover-new-pass">
											Nova palavra-passe
										</label>
										<input
											id="recover-new-pass"
											type="password"
											className="form-control mb-3"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											autoComplete="new-password"
											required
										/>

										<label className="form-label fw-bold" htmlFor="recover-confirm-pass">
											Confirmar palavra-passe
										</label>
										<input
											id="recover-confirm-pass"
											type="password"
											className="form-control mb-3"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											autoComplete="new-password"
											required
										/>
									</>
								) : null}

								<div className="alert alert-light border d-flex align-items-start gap-2" role="note">
									<Info style={{ width: 18, height: 18, marginTop: 1, opacity: 0.85 }} aria-hidden="true" />
									<div className="small fw-semibold text-muted">
										{step === 'reset'
											? 'O link expira em 30 minutos. Se reiniciar o backend, o link perde-se (modo dev).'
											: 'O link expira em 30 minutos. Verifique também a pasta de spam.'}
									</div>
								</div>

								<div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mt-3">
									<button type="button" className="btn btn-secondary" onClick={() => navigate('/login')}>
										<ArrowLeft style={{ width: 16, height: 16 }} aria-hidden="true" />
										Voltar a Entrar
									</button>

									<div className="d-flex align-items-center gap-2 flex-wrap">
										<button className="btn btn-primary" type="submit" disabled={isSubmitting}>
											<Send style={{ width: 16, height: 16 }} aria-hidden="true" />
											{step === 'reset'
												? isSubmitting ? 'A redefinir…' : 'Redefinir palavra-passe'
												: isSubmitting ? 'A enviar…' : 'Enviar link'}
										</button>
									</div>
								</div>


							</form>
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}
