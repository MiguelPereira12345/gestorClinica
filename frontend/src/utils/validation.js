export function sanitizePhone(value, { maxDigits = 15 } = {}) {
	const raw = String(value || '').trim()
	const hasPlus = raw.startsWith('+')
	const digits = raw.replace(/\D+/g, '')
	const clipped = digits.slice(0, Math.max(0, Number(maxDigits) || 0))
	return hasPlus ? `+${clipped}` : clipped
}

export function sanitizeDigits(value, { maxDigits = 20 } = {}) {
	const digits = String(value || '').replace(/\D+/g, '')
	return digits.slice(0, Math.max(0, Number(maxDigits) || 0))
}

export function sanitizeName(value, { maxLen = 120 } = {}) {
	let s = String(value || '')
	// allow letters (incl. accents), spaces, apostrophe, hyphen
	s = s.replace(/[^\p{L}\p{M}\s'\-]/gu, '')
	s = s.replace(/\s+/g, ' ')
	s = s.slice(0, Math.max(0, Number(maxLen) || 0))
	return s
}

export function isValidName(value) {
	const s = String(value || '').trim()
	if (!s) return false
	// must contain at least 2 letters
	const letters = s.match(/[\p{L}\p{M}]/gu) || []
	if (letters.length < 2) return false
	// reject digits
	if (/\d/.test(s)) return false
	return true
}

export function isValidPhone(value) {
	const s = String(value || '').trim()
	if (!s) return false
	// allow leading +, rest digits
	if (!/^\+?\d+$/.test(s)) return false
	const digits = s.replace(/\D+/g, '')
	// PT typical 9, but allow international up to 15
	return digits.length >= 9 && digits.length <= 15
}

export function isValidNif(value) {
	const digits = sanitizeDigits(value, { maxDigits: 32 })
	return digits.length === 9
}

export function isValidNumeroUtente(value) {
	const digits = sanitizeDigits(value, { maxDigits: 32 })
	if (!digits) return true // optional
	return digits.length <= 9
}
