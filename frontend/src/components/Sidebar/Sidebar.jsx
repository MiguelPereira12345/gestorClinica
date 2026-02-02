import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../../App.css'
import menuItems from './icons'
import { apiFetch, getAuthSession } from '../../utils/apiClient'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (item, idx) => {
    if (idx === 0 && location.pathname === '/pagina-inicial') return true
    if (item.path && location.pathname === item.path) return true
    if (item.path && location.pathname.startsWith(`${item.path}/`)) return true
    return false
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
          {menuItems.map((item, idx) => {
            const active = isActive(item, idx)
            return (
              <button
                key={item.label}
                className={`nav-link${active ? ' is-active' : ''}`}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (idx === 0) {
                    navigate('/pagina-inicial')
                  } else if (item.path) {
                    navigate(item.path)
                  }
                }}
              >
                {item.icon}
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
