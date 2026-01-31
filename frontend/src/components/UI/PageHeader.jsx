import React from 'react'

export default function PageHeader({ title, subtitle, actions = null }) {
  return (
    <div className="ui-page-header">
      <div className="ui-page-heading">
        <h1 className="ui-page-title">{title}</h1>
        {subtitle ? <div className="ui-page-subtitle">{subtitle}</div> : null}
      </div>

      {actions ? <div className="ui-page-actions">{actions}</div> : null}
    </div>
  )
}
