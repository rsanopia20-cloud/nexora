import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BrevoClient } from '@getbrevo/brevo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveTermsPdfPath() {
  return path.join(__dirname, '..', 'assets', 'Nexora_Terms_and_Conditions.pdf');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatAcceptedAt(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  const when = Number.isNaN(date.getTime()) ? new Date() : date;

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(when);
}

/**
 * Sends a welcome email with the Terms & Conditions PDF attached via Brevo.
 *
 * Important: SENDER_EMAIL must be a verified sender in the Brevo dashboard,
 * otherwise Brevo will reject the request.
 *
 * Never throws — failures are logged and return false so signup is not blocked.
 */
export async function sendWelcomeEmail(toEmail, toName, acceptedAt) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;
    const senderName = process.env.SENDER_NAME || 'Nexora';

    if (!apiKey || !senderEmail) {
      console.error(
        'Welcome email skipped: BREVO_API_KEY and/or SENDER_EMAIL missing from .env'
      );
      return false;
    }

    if (!toEmail) {
      console.error('Welcome email skipped: recipient email is missing');
      return false;
    }

    const pdfPath = resolveTermsPdfPath();
    if (!fs.existsSync(pdfPath)) {
      console.error(
        `Welcome email skipped: Terms PDF not found at ${pdfPath}`
      );
      return false;
    }

    const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');
    const participantName = toName?.trim() || 'Participant';
    const safeName = escapeHtml(participantName);
    const safeEmail = escapeHtml(toEmail);
    const acceptedOn = escapeHtml(formatAcceptedAt(acceptedAt));

    const brevo = new BrevoClient({ apiKey });

    await brevo.transactionalEmails.sendTransacEmail({
      subject: 'Confirmation of your NEXORA Terms and Conditions acceptance',
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: toEmail,
          name: participantName,
        },
      ],
      htmlContent: `
        <p>Hi ${safeName},</p>
        <p>This is to confirm that you have read, understood and voluntarily agreed to the NEXORA Terms and Conditions.</p>
        <p>
          Name: ${safeName}<br>
          Email: ${safeEmail}<br>
          Accepted on: ${acceptedOn}
        </p>
        <p>A copy of the accepted Terms &amp; Conditions is attached as a PDF for your records.</p>
        <p>Regards,<br>NEXORA / Nexora Bizworks</p>
      `,
      attachment: [
        {
          name: 'Nexora_Terms_and_Conditions.pdf',
          content: pdfBase64,
        },
      ],
    });

    console.log(`Welcome email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Welcome email failed:', error?.message || error);
    return false;
  }
}
