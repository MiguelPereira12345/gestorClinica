import React from 'react'
import { UserRound } from 'lucide-react'
import Sidebar from '../Sidebar/Sidebar'
import Breadcrumbs from '../UI/Breadcrumbs'
import '../../App.css'

export default function AppLayout({
  breadcrumb = '',
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

  const displayName = authDisplayName || (userName || '').trim() || 'Utilizador'

  return (
    <div className="app-shell">
      <Sidebar />

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
