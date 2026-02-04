import React from 'react'
import { UserRound } from 'lucide-react'
import PatientSidebar from '../Sidebar/PatientSidebar'
import Breadcrumbs from '../UI/Breadcrumbs'
import '../../App.css'

export default function PatientAppLayout({
	breadcrumb = 'Portal',
	userName = '',
	actions = null,
	children,
}) {
	let authDisplayName = ''
	try {
		const raw = localStorage.getItem('auth_user')
		const session = raw ? JSON.parse(raw) : null
		const user = session?.user || session?.utilizador || null
		authDisplayName =
			(user?.nome || user?.name || user?.email || user?.username || '')?.trim?.() ||
			''
	} catch {
		authDisplayName = ''
	}

	const displayName = authDisplayName || (userName || '').trim() || 'Utente'

	return (
		<div className="app-shell">
			<PatientSidebar />

			<div className="app-main">
				<header className="app-topbar" aria-label="Topo">
					<div className="app-breadcrumb">
						<Breadcrumbs breadcrumb={breadcrumb} />
					</div>

					<div className="app-topbar-right">
						{actions ? <div className="app-topbar-actions">{actions}</div> : null}

						<div className="app-profile">
							<div className="app-profile-img" aria-hidden="true">
								<UserRound className="app-profile-icon" />
							</div>
							<div className="app-profile-name">{displayName}</div>
						</div>
					</div>
				</header>

				<main className="app-content" aria-label="Conteúdo">
					{children}
				</main>
			</div>
		</div>
	)
}
