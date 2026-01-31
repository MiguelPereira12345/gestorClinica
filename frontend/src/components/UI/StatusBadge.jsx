import React, { useMemo } from 'react'

function normalizeStatus(status) {
  if (typeof status === 'boolean') {
    return status ? { key: 'confirmed', label: 'Confirmado' } : { key: 'pending', label: 'Pendente' }
  }

  const raw = String(status || '').trim()
  const s = raw.toLowerCase()

  if (!s) return { key: 'pending', label: 'Pendente' }

  if (['confirmada', 'confirmado', 'confirmar'].includes(s)) return { key: 'confirmed', label: 'Confirmado' }
  if (['a_confirmar', 'a confirmar', 'pendente', 'em_espera', 'em espera'].includes(s)) return { key: 'pending', label: 'Pendente' }
  if (['cancelada', 'cancelado', 'cancelar'].includes(s)) return { key: 'cancelled', label: 'Cancelado' }
  if (['ativo', 'activa', 'ativo '].includes(s)) return { key: 'active', label: 'Ativo' }
  if (['inativo', 'inactiva', 'inativo '].includes(s)) return { key: 'inactive', label: 'Inativo' }

  // fallback: keep original label, but map tone if we can infer
  return { key: 'neutral', label: raw }
}

export default function StatusBadge({ status, className = '' }) {
  const normalized = useMemo(() => normalizeStatus(status), [status])

  return (
    <span className={`ui-badge ui-badge--${normalized.key}${className ? ` ${className}` : ''}`}>
      {normalized.label}
    </span>
  )
}
