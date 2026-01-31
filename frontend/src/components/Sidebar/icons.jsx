import React from 'react'

export const menuItems = [
  {
    label: 'Painel',
    icon: (
      <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v6h8V3h-8zM3 21h8v-8H3v8z" fill="currentColor"/></svg>
    )
  },
  {
    label: 'Agenda',
    path: '/agenda',
    icon: (
      <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M3 10h18" stroke="currentColor" strokeWidth="1.2"/></svg>
    )
  },
  {
    label: 'Consultas',
    path: '/consultas',
    icon: (
      <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="7" y="3" width="10" height="2" rx="0.8" fill="currentColor" />
        <path d="M7 5h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <rect x="9" y="10" width="6" height="5" rx="0.6" fill="currentColor" />
      </svg>
    )
  },
  {
    label: 'Pacientes',
    path: '/pacientes',
    icon: (
      <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8.5" cy="8" r="2.2" fill="currentColor"/><path d="M3 20c0-2.2 2.7-4 5.5-4s5.5 1.8 5.5 4" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="17" cy="9" r="1.8" fill="currentColor"/><path d="M13.5 20c0-1.6 1.8-3 4-3s4 1.4 4 3" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
    )
  },
  {
    label: 'Colaboradores',
    path: '/pagina-inicial',
    icon: (
      <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M7 7V5h2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M17 7V5h2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><rect x="6" y="11" width="4" height="4" fill="currentColor"/></svg>
    )
  },
  
]

export default menuItems
