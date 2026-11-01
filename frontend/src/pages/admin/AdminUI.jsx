export function AdminHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="admin-page-header__actions">{actions}</div>}
    </header>
  )
}

export function AdminFeedback({ error, notice }) {
  return (
    <>
      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          {error}
        </div>
      )}
      {notice && <div className="admin-alert admin-alert--success">{notice}</div>}
    </>
  )
}

export function AdminLoading({ label = 'Loading...' }) {
  return (
    <div className="admin-loading" role="status">
      <span className="page-loading__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function AdminPagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null

  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="btn btn--outline btn--small"
        disabled={pagination.page <= 1}
        onClick={() => onPage(pagination.page - 1)}
      >
        Previous
      </button>
      <span>
        Page {pagination.page} of {pagination.pages}
      </span>
      <button
        type="button"
        className="btn btn--outline btn--small"
        disabled={pagination.page >= pagination.pages}
        onClick={() => onPage(pagination.page + 1)}
      >
        Next
      </button>
    </div>
  )
}

export function AdminStatus({ status }) {
  return (
    <span className={`admin-status admin-status--${String(status).toLowerCase()}`}>
      {status}
    </span>
  )
}

export function formatAdminDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatAdminDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
