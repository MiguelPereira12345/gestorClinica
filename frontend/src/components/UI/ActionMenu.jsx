import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'

export default function ActionMenu({
  label = 'Ações',
  items = [],
  align = 'right',
  className = '',
}) {
  const buttonId = useId()
  const menuId = `${buttonId}-menu`
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const enabledItems = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items])

  useEffect(() => {
    function onDocMouseDown(e) {
      const inside = rootRef.current?.contains?.(e.target)
      if (!inside) setOpen(false)
    }

    function onDocKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [])

  return (
    <div ref={rootRef} className={`ui-actionmenu${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="ui-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={label}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="ui-icon" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`ui-actionmenu-menu${align === 'left' ? ' is-left' : ''}`}
        >
          {enabledItems.map((it, idx) => (
            <button
              key={`${it.label}-${idx}`}
              type="button"
              role="menuitem"
              className={`ui-actionmenu-item${it.variant === 'danger' ? ' is-danger' : ''}`}
              onClick={() => {
                setOpen(false)
                it.onClick?.()
              }}
            >
              {it.icon ? <span className="ui-actionmenu-icon">{it.icon}</span> : null}
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
