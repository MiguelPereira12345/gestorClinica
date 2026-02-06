const nodemailer = require('nodemailer');

function env(name, fallback = '') {
	return process.env[name] != null && String(process.env[name]).trim() !== ''
		? String(process.env[name]).trim()
		: fallback;
}

function isMailConfigured() {
	const host = env('SMTP_HOST');
	const port = env('SMTP_PORT');
	const user = env('SMTP_USER');
	const pass = env('SMTP_PASS');
	return !!(host && port && user && pass);
}


let cachedTransport = null;
let cachedTransportKey = null;

function getTransportKey() {
	const host = env('SMTP_HOST');
	const port = env('SMTP_PORT');
	const secure = env('SMTP_SECURE');
	const user = env('SMTP_USER');
	// não incluir pass (segredo) na key
	return `${host}|${port}|${secure}|${user}`;
}

function createTransport() {
	const host = env('SMTP_HOST');
	const port = Number(env('SMTP_PORT', '587'));
	const secure = env('SMTP_SECURE', '').toLowerCase() === 'true' || port === 465;
	const user = env('SMTP_USER');
	let pass = env('SMTP_PASS');

	// Gmail app passwords are often shown with spaces; nodemailer expects the raw token.
	if (host === 'smtp.gmail.com' || host.endsWith('.gmail.com')) {
		pass = pass.replace(/\s+/g, '');
	}

	return nodemailer.createTransport({
		host,
		port,
		secure,
		requireTLS: !secure,
		auth: { user, pass },
	});
}

function getOrCreateTransport() {
	const key = getTransportKey();
	if (cachedTransport && cachedTransportKey === key) return cachedTransport;
	cachedTransportKey = key;
	cachedTransport = createTransport();
	return cachedTransport;
}

async function sendMail({ to, subject, text, html }) {
	if (!isMailConfigured()) {
		const err = new Error('SMTP não configurado (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)');
		err.code = 'MAIL_NOT_CONFIGURED';
		throw err;
	}

	const from = env('MAIL_FROM', env('SMTP_USER'));
	const transport = getOrCreateTransport();
	return transport.sendMail({ from, to, subject, text, html });
}

async function sendPasswordResetEmail({ to, resetUrl, ttlMinutes }) {
	const ttl = Number(ttlMinutes) || 15;
	const subject = 'Recuperação de palavra-passe';
	const text =
		`Recebemos um pedido de recuperação de palavra-passe.\n\n` +
		`Para redefinir a sua palavra-passe, abra este link (expira em ${ttl} minutos):\n` +
		`${resetUrl}\n\n` +
		`Se não foi você, pode ignorar este e-mail.`;

	const html = `
		<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
			<p><strong>Recuperação de palavra-passe</strong></p>
			<p>Recebemos um pedido de recuperação de palavra-passe.</p>
			<p>
				<a href="${resetUrl}" target="_blank" rel="noreferrer">Redefinir palavra-passe</a>
			</p>
			<p style="color:#555">Este link expira em ${ttl} minutos.</p>
			<p style="color:#555">Se não foi você, pode ignorar este e-mail.</p>
		</div>
	`;

	return sendMail({ to, subject, text, html });
}

module.exports = {
	sendMail,
	isMailConfigured,
	sendPasswordResetEmail,
};
