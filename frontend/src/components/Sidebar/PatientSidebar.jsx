import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../../App.css'
import { apiFetch, getAuthSession } from '../../utils/apiClient'

const patientMenu = [
	{ label: 'Início', path: '/portal' },
	{ label: 'Consultas', path: '/portal/consultas' },
	{ label: 'Tratamentos', path: '/portal/planos' },
	{ label: 'Dependentes', path: '/portal/dependentes' },
	{ label: 'Perfil', path: '/portal/perfil' },
	{ label: 'Docs/Declarações', path: '/portal/docs' },
	{ label: 'Marcar consulta', path: '/portal/marcar-consulta' },
]

function iconFor(path) {
	// simple inline icons to match sidebar style
	switch (path) {
		case '/portal':
			return (
				<svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
				</svg>
			)
			case '/portal/consultas':
				return (
					<svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
						<path d="M8 7h8M8 11h8M8 15h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
					</svg>
				)
		case '/portal/planos':
			return (
				<svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.2" fill="none" />
				</svg>
			)
		case '/portal/dependentes':
			return (
				<svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.2" fill="none" />
					<path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.2" fill="none" />
					<path d="M17.5 7.5a2.5 2.5 0 1 0-2.5-2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
				</svg>
			)
		case '/portal/perfil':
			return (
				<svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.2" fill="none" />
					<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
				</svg>
			)
		case '/portal/docs':
			return (
				<svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
					<path d="M14 3v4a1 1 0 0 0 1 1h4" stroke="currentColor" strokeWidth="1.2" fill="none" />
					<path d="M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
				</svg>
			)
		case '/portal/marcar-consulta':
			return (
				<svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
					<path d="M7 2v4M17 2v4M3 10h18" stroke="currentColor" strokeWidth="1.2" />
					<path d="M9 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
					<path d="M12 12v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
				</svg>
			)
		default:
			return null
	}
}

export default function PatientSidebar() {
	const navigate = useNavigate()
	const location = useLocation()

	const isActive = (path) => {
		if (path === '/portal') return location.pathname === '/portal'
		return location.pathname === path || location.pathname.startsWith(`${path}/`)
	}

	const handleLogout = () => {
		void (async () => {
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
		})()
	}

	return (
		<aside className="sidebar">
			<div className="sidebar-top">
				<div className="sidebar-brand" aria-label="Clinimolelos">
					<div className="sidebar-brand-mark" aria-hidden="true">Cm</div>
					<div className="sidebar-brand-text">Clinimolelos</div>
				</div>

				<nav className="nav" aria-label="Navegação">
					{patientMenu.map((item) => {
						const active = isActive(item.path)
						return (
							<button
								key={item.label}
								className={`nav-link${active ? ' is-active' : ''}`}
								type="button"
								aria-current={active ? 'page' : undefined}
								onClick={() => navigate(item.path)}
							>
								{iconFor(item.path)}
								{item.label}
							</button>
						)
					})}
				</nav>
			</div>

			<button type="button" className="btn btn-light sidebar-logout" onClick={handleLogout}>
				Terminar Sessão
			</button>
		</aside>
	)
}
