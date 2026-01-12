/**
 * Mailtrap Email Testing
 *
 * Sends emails to Mailtrap sandbox for development/testing.
 * Emails are captured and viewable in Mailtrap dashboard instead of being delivered.
 */

import nodemailer from 'nodemailer';

interface MailtrapConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

// Check if Mailtrap is enabled
export function isMailtrapEnabled(): boolean {
  return process.env.USE_MAILTRAP === 'true';
}

// Get Mailtrap config from environment
function getMailtrapConfig(): MailtrapConfig | null {
  const host = process.env.MAILTRAP_HOST;
  const port = parseInt(process.env.MAILTRAP_PORT || '2525', 10);
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;

  if (!host || !user || !pass) {
    console.warn('[Mailtrap] Missing configuration. Set MAILTRAP_HOST, MAILTRAP_USER, MAILTRAP_PASS');
    return null;
  }

  return { host, port, auth: { user, pass } };
}

// Create Mailtrap transporter
function createTransporter(): nodemailer.Transporter | null {
  const config = getMailtrapConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    auth: config.auth,
  });
}

// Send email via Mailtrap
export async function sendViaMailtrap(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
  const transporter = createTransporter();

  if (!transporter) {
    return { success: false, error: 'Mailtrap not configured' };
  }

  try {
    const result = await transporter.sendMail({
      from: options.fromName ? `"${options.fromName}" <${options.from}>` : options.from,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Mailtrap] Email sent to ${options.to}, messageId: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Mailtrap] Error sending email:', error);
    return { success: false, error };
  }
}

// Build HTML email from template data (matching SendGrid dynamic template)
export function buildJobDispatchEmail(data: {
  technician_name: string;
  job_title: string;
  trade_needed: string;
  location: string;
  urgency: string;
  scheduled_date: string;
  duration: string;
  budget_range: string;
  description: string;
  response_url: string;
  company_name: string;
  company_address: string;
  unsubscribe_url: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#1a1a1a; font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#2f2f2f; border-radius:12px; max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="padding:32px; background:linear-gradient(135deg,#656290,#4a4875); border-radius:12px 12px 0 0;">
              <p style="margin:0 0 8px; color:rgba(255,255,255,0.7); font-size:12px;">RAVENSEARCH</p>
              <h1 style="margin:0; color:#fff; font-size:22px;">New Job Opportunity</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:14px;">${data.job_title}</p>
            </td>
          </tr>

          <!-- Introduction -->
          <tr>
            <td style="padding:24px 24px 0 24px;">
              <p style="margin:0; color:#aaa; font-size:14px; line-height:1.5;">
                Hi ${data.technician_name}, Ravensearch is an AI-powered dispatching platform that connects skilled technicians with clients who need their expertise. We found a job that matches your profile:
              </p>
            </td>
          </tr>

          <!-- Job Details Grid -->
          <tr>
            <td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="background:rgba(101,98,144,0.15); border-radius:8px; padding:14px;">
                    <p style="margin:0 0 4px; color:#888; font-size:10px; text-transform:uppercase;">Trade</p>
                    <p style="margin:0; color:#fff; font-size:15px; font-weight:600;">${data.trade_needed}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:rgba(101,98,144,0.15); border-radius:8px; padding:14px;">
                    <p style="margin:0 0 4px; color:#888; font-size:10px; text-transform:uppercase;">Urgency</p>
                    <p style="margin:0; color:#fff; font-size:15px; font-weight:600;">${data.urgency}</p>
                  </td>
                </tr>
                <tr><td colspan="3" height="12"></td></tr>
                <tr>
                  <td width="48%" style="background:rgba(101,98,144,0.15); border-radius:8px; padding:14px;">
                    <p style="margin:0 0 4px; color:#888; font-size:10px; text-transform:uppercase;">Location</p>
                    <p style="margin:0; color:#fff; font-size:15px;">${data.location}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:rgba(101,98,144,0.15); border-radius:8px; padding:14px;">
                    <p style="margin:0 0 4px; color:#888; font-size:10px; text-transform:uppercase;">Schedule</p>
                    <p style="margin:0; color:#fff; font-size:15px;">${data.scheduled_date}</p>
                  </td>
                </tr>
                <tr><td colspan="3" height="12"></td></tr>
                <tr>
                  <td width="48%" style="background:rgba(101,98,144,0.15); border-radius:8px; padding:14px;">
                    <p style="margin:0 0 4px; color:#888; font-size:10px; text-transform:uppercase;">Duration</p>
                    <p style="margin:0; color:#fff; font-size:15px;">${data.duration}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:rgba(101,98,144,0.15); border-radius:8px; padding:14px;">
                    <p style="margin:0 0 4px; color:#888; font-size:10px; text-transform:uppercase;">Budget</p>
                    <p style="margin:0; color:#fff; font-size:15px;">${data.budget_range}</p>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <div style="margin-top:20px; padding:16px; background:rgba(255,255,255,0.03); border-radius:8px;">
                <p style="margin:0 0 8px; color:#888; font-size:10px; text-transform:uppercase;">Description</p>
                <p style="margin:0; color:#ccc; font-size:14px; line-height:1.5;">${data.description}</p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${data.response_url}" style="display:inline-block; background:linear-gradient(135deg,#656290,#8B90E0); color:#fff; text-decoration:none; padding:14px 40px; border-radius:8px; font-weight:600; font-size:15px;">
                      I'm Interested
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0; color:#888; font-size:13px; text-align:center;">
                Or simply reply to this email with <strong style="color:#fff;">"Interested"</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px; border-top:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2); border-radius:0 0 12px 12px;">
              <p style="margin:0 0 8px; color:#666; font-size:11px; text-align:center;">
                ${data.company_name} · ${data.company_address}
              </p>
              <p style="margin:0; color:#666; font-size:11px; text-align:center;">
                <a href="${data.unsubscribe_url}" style="color:#656290;">Unsubscribe</a> ·
                <a href="https://ravensearch.ai/privacy" style="color:#656290;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
