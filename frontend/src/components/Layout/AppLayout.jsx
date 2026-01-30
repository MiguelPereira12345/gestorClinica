import React from 'react'
import { UserRound } from 'lucide-react'
import Sidebar from '../Sidebar/Sidebar'
import '../../App.css'

export default function AppLayout({
  breadcrumb = '',
  userName = 'Dra. Sofia Lima',
  actions = null,
  children,
}) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <header className="app-topbar" aria-label="Topo">
          <div className="app-breadcrumb">{breadcrumb}</div>

          <div className="app-topbar-right">
            {actions ? <div className="app-topbar-actions">{actions}</div> : null}

            <div className="app-profile">
              <div className="app-profile-img" aria-hidden="true">
                <UserRound className="app-profile-icon" />
              </div>
              <div className="app-profile-name">{userName}</div>
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
