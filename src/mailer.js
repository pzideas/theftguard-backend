const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD
  }
});

async function sendSosEmail(toEmail, deviceModel, lat, lng, photoPath) {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const mailOptions = {
    from: `"TheftGuard Alerts" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `🚨 SOS Alert - ${deviceModel}`,
    html: `
      <h2 style="color:#d32f2f;">SOS Alert Triggered</h2>
      <p>Your device <b>${deviceModel}</b> has triggered an SOS alert.</p>
      <p><b>Live location:</b> <a href="${mapsLink}">${mapsLink}</a></p>
      <p>Please check your TheftGuard dashboard for full details and captured photo.</p>
    `,
    attachments: photoPath ? [{ filename: 'capture.jpg', path: photoPath }] : []
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendSosEmail };
