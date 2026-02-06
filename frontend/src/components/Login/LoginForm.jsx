import React, { useState } from 'react'

export default function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { email, pin }
    if (onSubmit) onSubmit(payload)
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="login-label">Email</label>
      <input
        className="login-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="login-label">PIN</label>
      <input
        className="login-input"
        type="password"
        placeholder="Password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />

      <div style={{ height: '1rem' }} />
      <button className="btn btn-primary" type="submit">Entrar</button>
    </form>
  )
}
