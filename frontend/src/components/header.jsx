import React from 'react'
import '../App.css'

export default function Header({ userName = 'Pedro Saraiva', actionText = 'Editar Utentes' }) {
	return (
		<header className="top-bar">
			<div className="top-bar-left">
				<div className="top-bar-icon">⚙️</div>
				<div className="top-bar-text">
					<div className="top-title">Gestor</div>
					<div className="top-sub">{userName}</div>
				</div>
			</div>
			<div className="top-bar-right">{actionText}</div>
		</header>
	)
}

