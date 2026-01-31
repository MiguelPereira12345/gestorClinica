import React from 'react'

export default function Button({
  type = 'button',
  variant = 'secondary',
  className = '',
  leftIcon = null,
  children,
  ...props
}) {
  const bsVariantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'danger'
        ? 'btn-danger'
        : variant === 'light'
          ? 'btn-light'
        : 'btn-secondary'

  return (
    <button
      type={type}
      className={`btn ${bsVariantClass}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  )
}
