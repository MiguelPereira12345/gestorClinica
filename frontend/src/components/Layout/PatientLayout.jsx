import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch, getAuthSession, getCurrentUser } from '../../utils/apiClient'

function isActive(pathname, target) {
	if (target === '/portal') return pathname === '/portal'
	return pathname === target || pathname.startsWith(`${target}/`)
}

export default function PatientLayout({ title = '', subtitle = '', children }) {
	const location = useLocation()
	const navigate = useNavigate()
	const user = getCurrentUser()

	async function logout() {
		try {
			const session = getAuthSession()
			if (session?.refreshToken) {
				await apiFetch('/auth/logout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ refreshToken: session.refreshToken }),
				})
			}
		} catch {
			// ignore
		} finally {
			localStorage.removeItem('auth_user')
			sessionStorage.clear()
			navigate('/login')
		}
	}

	return (
		<div style={{ minHeight: '100vh', background: '#f4f1ec' }}>
			<header className="bg-white border-bottom">
				<div className="container py-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
					<div>
						<div className="fw-bold" style={{ fontSize: 16 }}>
							{title || 'Portal do Paciente'}
						</div>
						{subtitle ? <div className="text-muted" style={{ fontSize: 13 }}>{subtitle}</div> : null}
					</div>

					<div className="d-flex align-items-center gap-2">
						<div className="text-muted" style={{ fontSize: 13 }}>
							{user?.nome || user?.email || 'Paciente'}
						</div>
						<button type="button" className="btn btn-outline-secondary btn-sm" onClick={logout}>
							Sair
						</button>
					</div>
				</div>

				<nav className="bg-white border-top">
					<div className="container py-2 d-flex gap-2 flex-wrap">
						<Link className={`btn btn-sm ${isActive(location.pathname, '/portal') ? 'btn-primary' : 'btn-light'}`} to="/portal">
							Início
						</Link>
						<Link className={`btn btn-sm ${isActive(location.pathname, '/portal/planos') ? 'btn-primary' : 'btn-light'}`} to="/portal/planos">
							Planos
						</Link>
						<Link className={`btn btn-sm ${isActive(location.pathname, '/portal/dependentes') ? 'btn-primary' : 'btn-light'}`} to="/portal/dependentes">
							Dependentes
						</Link>
						<Link className={`btn btn-sm ${isActive(location.pathname, '/portal/perfil') ? 'btn-primary' : 'btn-light'}`} to="/portal/perfil">
							Perfil
						</Link>
						<Link className={`btn btn-sm ${isActive(location.pathname, '/portal/marcar-consulta') ? 'btn-primary' : 'btn-light'}`} to="/portal/marcar-consulta">
							Marcar consulta
						</Link>
					</div>
				</nav>
			</header>

			<main className="container py-4">{children}</main>
		</div>
	)
}
