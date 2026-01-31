import React, { useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import {
	ArrowLeft,
	Info,
	KeyRound,
	Mail,
	RefreshCcw,
	Send,
	ShieldCheck,
} from 'lucide-react'

import logoClinimolelos from './assets/Logo-CliniMolelos.png'

export default function Recuperarpass() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [feedback, setFeedback] = useState(null)
	const [feedbackVariant, setFeedbackVariant] = useState('info') // info | success | error

	const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

	const requestPasswordReset = async (via) => {
		if (!email) return
		setIsSubmitting(true)
		setFeedback(null)
		setFeedbackVariant('info')

		try {
			const response = await fetch(
				`${API_BASE_URL}/utilizadores/password-reset/request`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email, via }),
				}
			)

			const data = await response.json().catch(() => null)
			if (!response.ok) {
				const message =
					data?.message || 'Não foi possível pedir a recuperação. Tente novamente.'
				setFeedback(message)
				setFeedbackVariant('error')
				return
			}

			let message =
				data?.message ||
				'Se existir uma conta com esse e-mail, enviamos as instruções de recuperação.'
			if (data?.debugCode) {
				message += ` (Código de teste: ${data.debugCode})`
			}

			setFeedback(message)
			setFeedbackVariant('success')
		} catch (err) {
			setFeedback('Erro de rede ao contactar o servidor.')
			setFeedbackVariant('error')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		requestPasswordReset('link')
	}

	return (
		<div className="recover-container">
			<section className="recover-left" aria-label="Clinimolelos">
				<div className="recover-left-inner">
					<img
						className="recover-left-logo"
						src={logoClinimolelos}
						alt="CLINIMOLELOS"
						decoding="async"
						loading="eager"
						draggable="false"
					/>

					<p className="recover-left-tagline">
						Aceda ao sistema clínico para gerir Horários,
						Consultas, Pacientes e Faturação.
					</p>
				</div>
			</section>

			<section className="recover-right" aria-label="Recuperar palavra-passe">
				<div className="recover-card">
					<div className="recover-card-header">
						<div className="recover-card-header-left">
							<RefreshCcw className="recover-card-header-icon" />
							<h2 className="recover-card-title">Recuperar Palavra-passe</h2>
						</div>

						<div className="recover-badge" aria-label="Segurança">
							<ShieldCheck className="recover-badge-icon" aria-hidden="true" />
							Segurança
						</div>
					</div>

					<form className="recover-form" onSubmit={handleSubmit}>
						{feedback ? (
							<div
								className="recover-alert"
								role={feedbackVariant === 'error' ? 'alert' : 'status'}
								aria-live={feedbackVariant === 'error' ? 'assertive' : 'polite'}
							>
								<Info className="recover-alert-icon" aria-hidden="true" />
								<span>{feedback}</span>
							</div>
						) : null}

						<div className="recover-instruction">
							<Info className="recover-instruction-icon" aria-hidden="true" />
							<p className="recover-instruction-text">
								Introduza o seu e-mail para receber um link de redefinição.
							</p>
						</div>

						<label className="recover-label" htmlFor="recover-email">
							E-mail associado à conta
						</label>
						<div className="recover-input-wrap">
							<Mail className="recover-input-icon" aria-hidden="true" />
							<input
								id="recover-email"
								type="email"
								className="recover-input"
								placeholder="nome@exemplo.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								required
							/>
						</div>

						<div className="recover-alert" role="note">
							<Info className="recover-alert-icon" aria-hidden="true" />
							<span>
								O link expira em 30 minutos. Verifique também a pasta de spam.
							</span>
						</div>

						<div className="recover-actions">
							<button
								type="button"
								className="recover-back"
								onClick={() => navigate('/login')}
							>
								<ArrowLeft className="recover-back-icon" aria-hidden="true" />
								Voltar a Entrar
							</button>

							<div className="recover-buttons">
								<button className="recover-send" type="submit" disabled={isSubmitting}>
									<Send className="recover-send-icon" aria-hidden="true" />
									{isSubmitting ? 'A enviar…' : 'Enviar link'}
								</button>

								<button
									type="button"
									className="recover-code"
									disabled={isSubmitting}
									onClick={() => {
										requestPasswordReset('code')
									}}
								>
									<KeyRound className="recover-code-icon" aria-hidden="true" />
									{isSubmitting ? 'A enviar…' : 'Redefinir via código'}
								</button>
							</div>
						</div>

						<p className="recover-helper">Sem acesso ao e-mail?</p>
					</form>
				</div>
			</section>
		</div>
	)
}
