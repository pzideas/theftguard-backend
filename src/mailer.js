const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSosEmail(toEmail, deviceModel, lat, lng, photoPath) {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  await resend.emails.send({
    from: 'TheftGuard Alerts <onboarding@resend.dev>',
    to: toEmail,
    subject: `🚨 SOS Alert - ${deviceModel}`,
    html: `
      <h2 style="color:#d32f2f;">SOS Alert Triggered</h2>
      <p>Your device <b>${deviceModel}</b> has triggered an SOS alert.</p>
      <p><b>Live location:</b> <a href="${mapsLink}">${mapsLink}</a></p>
      <p>Please check your TheftGuard dashboard for full details and captured photo.</p>
    `
  });
}

module.exports = { sendSosEmail };
