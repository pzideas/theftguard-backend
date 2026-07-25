const { Resend } = require('resend');
const fs = require('fs');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSosEmail(toEmail, deviceModel, lat, lng, photoPath) {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

  const hasPhoto = photoPath && fs.existsSync(photoPath);

  const emailPayload = {
    from: 'TheftGuard Alerts <onboarding@resend.dev>',
    to: toEmail,
    subject: `🚨 SOS Alert - ${deviceModel}`,
    html: `
      <h2 style="color:#d32f2f;">SOS Alert Triggered</h2>
      <p>Your device <b>${deviceModel}</b> has triggered an SOS alert.</p>
      <p><b>Live location:</b> <a href="${mapsLink}">${mapsLink}</a></p>
      ${hasPhoto
        ? '<p>A photo captured on the device is attached to this email.</p>'
        : '<p>No photo is attached to this alert.</p>'}
    `
  };

  if (hasPhoto) {
    const base64Photo = fs.readFileSync(photoPath).toString('base64');
    emailPayload.attachments = [
      {
        filename: 'capture.jpg',
        content: base64Photo
      }
    ];
  }

  await resend.emails.send(emailPayload);
}

module.exports = { sendSosEmail };
