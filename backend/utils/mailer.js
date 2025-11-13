import nodemailer from 'nodemailer';

const host = process.env.MAIL_HOST;
const port = process.env.MAIL_PORT;
const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;
const from = process.env.MAIL_FROM || (user ? user : 'no-reply@klheco.local');

let transporter;

if (host && port && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
} else {
  // fallback: console logger transport
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('Mail fallback - would send:', JSON.stringify(mailOptions, null, 2));
      return Promise.resolve();
    }
  };
}

export async function sendEmail(to, subject, text, html, fromOverride) {
  const mailOptions = {
    from: fromOverride || from,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendBulkEmails(recipients, subject, text, html, fromOverride) {
  // send individual emails to preserve privacy and have per-user bounces
  const results = [];
  for (const r of recipients) {
    try {
      await sendEmail(r, subject, text, html, fromOverride);
      results.push({ to: r, ok: true });
    } catch (err) {
      results.push({ to: r, ok: false, error: err.message });
    }
  }
  return results;
}
