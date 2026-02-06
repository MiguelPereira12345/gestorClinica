function safeString(value) {
	try {
		if (value == null) return ''
		if (typeof value === 'string') return value
		return JSON.stringify(value)
	} catch {
		return String(value)
	}
}

function toErrorLike(reason) {
	if (reason instanceof Error) return reason
	const err = new Error(typeof reason === 'string' ? reason : safeString(reason))
	// mantém referência para debug
	err.cause = reason
	return err
}

export function setupGlobalErrorHandlers() {
	// Evita instalar duas vezes em HMR
	if (typeof window === 'undefined') return
	if (window.__globalErrorHandlersInstalled) return
	window.__globalErrorHandlersInstalled = true

	window.addEventListener('error', (event) => {
		// event.error pode ser undefined (ex: script load / CORS)
		const message = event?.message || 'Unknown window error'
		const source = event?.filename || ''
		const line = event?.lineno || 0
		const col = event?.colno || 0
		const err = event?.error

		console.error('[GlobalError]', {
			message,
			source,
			line,
			col,
			stack: err?.stack,
			error: err,
		})
	})

	window.addEventListener('unhandledrejection', (event) => {
		const err = toErrorLike(event?.reason)
		console.error('[UnhandledRejection]', {
			message: err?.message,
			stack: err?.stack,
			reason: event?.reason,
		})
	})
}
