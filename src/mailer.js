const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD
  }
});

async function sendSosEmail(toEmail, deviceModel, lat, lng, photoUrl, opts) {
  const options = opts || {};
  const title = options.title || 'SOS Alert Triggered';
  const subjectPrefix = options.subjectPrefix || '🚨 SOS Alert';

  const mapsLink = (lat != null && lng != null)
    ? `https://maps.google.com/?q=${lat},${lng}`
    : null;

  const mailOptions = {
    from: `"TheftGuard Alerts" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `${subjectPrefix} - ${deviceModel}`,
    html: `
      <h2 style="color:#d32f2f;">${title}</h2>
      <p>Your device <b>${deviceModel}</b> triggered an alert.</p>
      ${mapsLink ? `<p><b>Live location:</b> <a href="${mapsLink}">${mapsLink}</a></p>` : ''}
      ${photoUrl ? `<p><b>Captured photo:</b><br/><a href="${photoUrl}"><img src="${photoUrl}" style="max-width:320px;border-radius:8px;margin-top:8px;" /></a></p>` : ''}
      <p>Check your TheftGuard dashboard for full details.</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendSosEmail };
