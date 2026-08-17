import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BrevoClient } from '@getbrevo/brevo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveTermsPdfPath() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const preferred = path.join(assetsDir, 'terms-and-conditions.pdf');
  const legacy = path.join(assetsDir, 'TERMS & CONDITIONS.pdf');

  if (fs.existsSync(preferred)) return preferred;
  if (fs.existsSync(legacy)) return legacy;
  return preferred;
}

/**
 * Sends a welcome email with the Terms & Conditions PDF attached via Brevo.
 *
 * Important: SENDER_EMAIL must be a verified sender in the Brevo dashboard,
 * otherwise Brevo will reject the request.
 *
 * Never throws — failures are logged and return false so signup is not blocked.
 */
export async function sendWelcomeEmail(toEmail, toName) {
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
    const safeName = toName?.trim() || 'there';

    const brevo = new BrevoClient({ apiKey });

    await brevo.transactionalEmails.sendTransacEmail({
      subject: 'Welcome! Please find our Terms & Conditions',
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: toEmail,
          name: safeName,
        },
      ],
      htmlContent: `
        <p>Hi ${safeName},</p>
        <p>Welcome to Nexora Bizworks — thanks for signing up with us.</p>
        <p>Please find our Terms &amp; Conditions attached as a PDF for your records.</p>
        <p>If you have any questions, feel free to reach out through our official channels.</p>
        <p>— Team Nexora</p>
      `,
      attachment: [
        {
          name: 'Terms-and-Conditions.pdf',
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
