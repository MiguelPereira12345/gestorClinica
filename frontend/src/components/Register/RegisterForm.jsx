import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Lock, Mail, Phone, User } from 'lucide-react'
import { isValidName, isValidPhone, sanitizeName, sanitizePhone } from '../../utils/validation'

export default function RegisterForm() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

  const cleanName = sanitizeName(name)
  const cleanPhone = sanitizePhone(phone)
  setName(cleanName)
  setPhone(cleanPhone)

  if (!isValidName(cleanName)) {
    setError('O nome não pode conter números e deve estar completo.')
    return
  }
  if (!isValidPhone(cleanPhone)) {
    setError('Telefone inválido (use apenas dígitos; mínimo 9).')
    return
  }

    // Validar que os termos foram aceites
    if (!accepted) {
      setError('Deve aceitar os Termos e Política de Privacidade para continuar')
      alert('⚠️ É obrigatório aceitar os Termos e Política de Privacidade para criar uma conta.')
      return
    }

    // Validar que as senhas coincidem
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem')
      return
    }

    // Validar comprimento mínimo da senha
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:3001/utilizadores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: cleanName,
          telefone: cleanPhone,
          email: email,
          senha: password,
          tipo: 'user'
        }),
      })

      const data = await response.json()

      //notificação pop up
      if (response.ok) {
        alert('Conta criada com sucesso! Por favor, faça login.')
        navigate('/login')
      } else {
        setError(data.message || 'Erro ao criar conta. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao registar:', err)
      setError('Erro de conexão. Verifique se o servidor está ativo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="px-3 px-lg-4 py-3" onSubmit={handleSubmit}>
      {error ? (
        <div className="alert alert-danger" role="alert" aria-live="assertive">
          {error}
        </div>
      ) : null}

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold" htmlFor="register-name">
            Nome
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <User style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
            </span>
            <input
              id="register-name"
              type="text"
              className="form-control"
              placeholder="O seu nome completo"
              value={name}
              onChange={(e) => setName(sanitizeName(e.target.value))}
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-bold" htmlFor="register-phone">
            Telefone
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <Phone style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
            </span>
            <input
              id="register-phone"
              type="tel"
              className="form-control"
              placeholder="+351"
              value={phone}
              onChange={(e) => setPhone(sanitizePhone(e.target.value))}
              autoComplete="tel"
              required
            />
          </div>
        </div>

        <div className="col-12">
          <label className="form-label fw-bold" htmlFor="register-email">
            E-mail
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <Mail style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
            </span>
            <input
              id="register-email"
              type="email"
              className="form-control"
              placeholder="nome@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-bold" htmlFor="register-password">
            Palavra-passe
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <Lock style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
            </span>
            <input
              id="register-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-bold" htmlFor="register-confirm-password">
            Confirmar Palavra-passe
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <Lock style={{ width: 18, height: 18, opacity: 0.85 }} aria-hidden="true" />
            </span>
            <input
              id="register-confirm-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-check mt-3">
        <input
          id="register-terms"
          type="checkbox"
          className="form-check-input"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          required
        />
        <label className="form-check-label fw-semibold" htmlFor="register-terms">
          Aceito os Termos e Política
        </label>
      </div>

      <hr className="my-3" />

      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <button className="btn btn-secondary" type="button" onClick={() => navigate('/login')} disabled={loading}>
          <ArrowLeft style={{ width: 16, height: 16 }} aria-hidden="true" />
          Voltar para Entrar
        </button>

        <button className="btn btn-primary" type="submit" disabled={loading || !accepted}>
          <Check style={{ width: 16, height: 16 }} aria-hidden="true" />
          {loading ? 'A criar conta...' : 'Criar Conta'}
        </button>
      </div>

      <p className="mt-2 mb-0 small text-muted">
        Ao criar a conta, concorda com os Termos de Serviço e Política de Privacidade.
      </p>
    </form>
  )
}
