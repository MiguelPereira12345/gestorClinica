import React, { useMemo } from 'react'

function normalizeItems(breadcrumb) {
  if (!breadcrumb) return []
  if (Array.isArray(breadcrumb)) {
    return breadcrumb
      .map((i) => {
        if (!i) return null
        if (typeof i === 'string') return { label: i }
        if (typeof i === 'object' && i.label) return i
        return null
      })
      .filter(Boolean)
  }

  if (typeof breadcrumb === 'string') {
    return breadcrumb
      .split('>')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label) => ({ label }))
  }

  return []
}

export default function Breadcrumbs({ breadcrumb = '' }) {
  const items = useMemo(() => normalizeItems(breadcrumb), [breadcrumb])

  if (!items.length) return null

  return (
    <nav className="ui-breadcrumbs" aria-label="Breadcrumb">
      <ol className="ui-breadcrumbs-list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={`${item.label}-${idx}`} className="ui-breadcrumbs-item">
              <span className={`ui-breadcrumbs-label${isLast ? ' is-current' : ''}`}>{item.label}</span>
              {!isLast ? <span className="ui-breadcrumbs-sep" aria-hidden="true">›</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
