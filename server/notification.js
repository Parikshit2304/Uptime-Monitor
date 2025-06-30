const { Resend } = require('resend');
require('dotenv').config();


const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmailAlert(to, subject, body) {
  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev', // or any verified sender
      to,
      subject,
      html: `<p>${body}</p>`
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
  }
}

module.exports = { sendEmailAlert };