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

function createTransport() {
	const host = env('SMTP_HOST');
	const port = Number(env('SMTP_PORT', '587'));
	const secure = env('SMTP_SECURE', '').toLowerCase() === 'true' || port === 465;
	const user = env('SMTP_USER');
	const pass = env('SMTP_PASS');

	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});
}

async function sendMail({ to, subject, text, html }) {
	if (!isMailConfigured()) {
		const err = new Error('SMTP não configurado (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)');
		err.code = 'MAIL_NOT_CONFIGURED';
		throw err;
	}

	const from = env('MAIL_FROM', env('SMTP_USER'));
	const transport = createTransport();
	return transport.sendMail({ from, to, subject, text, html });
}

module.exports = {
	sendMail,
	isMailConfigured,
};
