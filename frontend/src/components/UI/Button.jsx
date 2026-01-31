import React from 'react'

export default function Button({
  type = 'button',
  variant = 'secondary',
  className = '',
  leftIcon = null,
  children,
  ...props
}) {
  const variantClass =
    variant === 'primary'
      ? 'ui-btn ui-btn--primary'
      : variant === 'danger'
        ? 'ui-btn ui-btn--danger'
        : 'ui-btn ui-btn--secondary'

  return (
    <button type={type} className={`${variantClass}${className ? ` ${className}` : ''}`} {...props}>
      {leftIcon}
      {children}
    </button>
  )
}
