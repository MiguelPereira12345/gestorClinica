import React, { useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom'
import { Info, LogIn, Lock, Mail, RefreshCcw, UserPlus } from 'lucide-react'

import logoClinimolelos from './assets/Logo-CliniMolelos.png'

export default function Login() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			const response = await fetch(`${API_BASE_URL}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, senha: password }),
			})

			const data = await response.json().catch(() => null)
			if (!response.ok) {
				setError(data?.message || 'Não foi possível iniciar sessão.')
				return
			}

			// Guarda sessão simples em localStorage (sem JWT por agora)
			localStorage.setItem('auth_user', JSON.stringify(data))
			navigate('/pagina-inicial', { replace: true })
		} catch (err) {
			console.error('Erro no login:', err)
			setError('Erro de conexão. Verifique se o servidor está ativo.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="login-container">
			<section className="login-left" aria-label="Clinimolelos">
				<div className="login-left-inner">
					<img
						className="login-left-logo"
						src={logoClinimolelos}
						alt="CLINIMOLELOS"
						decoding="async"
						loading="eager"
						draggable="false"
					/>

					<p className="login-left-tagline">
						Aceda ao sistema clínico para gerir Horários,
						Consultas, Pacientes e Faturação.
					</p>
				</div>
			</section>

			<section className="login-right" aria-label="Entrar">
				<div className="login-card">
					<div className="login-card-header">
						<LogIn className="login-card-header-icon" />
						<h2 className="login-card-title">Entrar na Conta</h2>
					</div>

					<form className="login-form" onSubmit={handleSubmit}>
						{error ? (
							<div className="recover-alert" role="alert" aria-live="assertive">
								<Info className="recover-alert-icon" aria-hidden="true" />
								<span>{error}</span>
							</div>
						) : null}

						<label className="login-label" htmlFor="login-email">
							E-mail
						</label>
						<div className="login-input-wrap">
							<Mail className="login-input-icon" aria-hidden="true" />
							<input
								id="login-email"
								type="email"
								className="login-input"
								placeholder="nome@exemplo.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								required
							/>
						</div>

						<label className="login-label" htmlFor="login-password">
							Palavra-passe
						</label>
						<div className="login-input-wrap">
							<Lock className="login-input-icon" aria-hidden="true" />
							<input
								id="login-password"
								type="password"
								className="login-input"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="current-password"
								required
							/>
						</div>

						<div className="login-actions">
							<button
								className="login-forgot"
								type="button"
								onClick={() => navigate('/recuperar-palavra-passe')}
							>
								<RefreshCcw className="login-forgot-icon" aria-hidden="true" />
								<span>
									Recuperar
									<br />
									Palavra-passe
								</span>
							</button>

							<button className="login-primary" type="submit" disabled={isSubmitting}>
								<LogIn className="login-primary-icon" aria-hidden="true" />
								{isSubmitting ? 'A entrar…' : 'Entrar'}
							</button>
						</div>

						<div className="login-divider" role="separator" />

						<div className="login-secondary">
							<div className="login-secondary-text">Ainda não te conta?</div>
							<button
								className="login-secondary-button"
								type="button"
								onClick={() => navigate('/registar')}
							>
								<UserPlus className="login-secondary-icon" aria-hidden="true" />
								Criar Conta
							</button>
						</div>
					</form>
				</div>
			</section>
		</div>
	)
}

