import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email');
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"AlphaX" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return false;
  }
}

// ─── Reusable HTML wrapper ────────────────────────────────────────────────────
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #050A14; font-family: 'Helvetica Neue', Arial, sans-serif; color: #cbd5e1; }
    .wrap { max-width: 560px; margin: 40px auto; background: #0A1628; border: 1px solid rgba(0,212,255,0.15); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0A1628 0%, #0d2040 100%); padding: 32px 32px 24px; border-bottom: 1px solid rgba(0,212,255,0.1); }
    .logo { font-size: 22px; font-weight: 800; color: #00D4FF; letter-spacing: -0.5px; }
    .logo span { color: #fff; }
    .body { padding: 28px 32px; }
    h2 { color: #fff; font-size: 20px; margin: 0 0 12px; font-weight: 700; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 14px; }
    .highlight { color: #00D4FF; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00D4FF, #00B4D8); color: #050A14 !important; font-weight: 700; font-size: 14px; border-radius: 10px; text-decoration: none; margin-top: 8px; }
    .info-box { background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.15); border-radius: 10px; padding: 16px; margin: 16px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
    .footer p { color: #475569; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">Alpha<span>X</span></div>
      <p style="margin: 6px 0 0; font-size: 12px; color: #475569;">Syrian Research Collective</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>AlphaX &mdash; From knowledge consumers to knowledge creators.</p>
      <p style="margin-top:4px;">This email was sent to you because you are a member of AlphaX.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, accessCode: string) {
  return sendEmail({
    to,
    subject: 'Welcome to AlphaX — Your Access Code',
    html: emailWrapper(`
      <h2>Welcome to AlphaX, ${name}!</h2>
      <p>You have been accepted as an <span class="highlight">Alphanaut</span>. Here is everything you need to get started.</p>
      <div class="info-box">
        <p style="margin:0; font-size:13px; color:#94a3b8;">Your Access Code</p>
        <p style="margin:6px 0 0; font-size:28px; font-weight:800; color:#00D4FF; letter-spacing:4px;">${accessCode}</p>
        <p style="margin:6px 0 0; font-size:12px; color:#64748b;">Keep this code safe — it is your key to the Alphanaut Portal.</p>
      </div>
      <p>Use your code to log in at the Alphanaut Portal. Read the Orientation Manual to understand our values, structure, and how blocks work.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" class="btn">Access Portal</a>
      <p style="margin-top:20px;">If you have questions, reach out to your Navigator or a Co-Captain.</p>
    `),
  });
}

export async function sendTaskAssignedEmail(
  to: string,
  name: string,
  taskTitle: string,
  blockName: string,
  deadline?: string,
  description?: string
) {
  return sendEmail({
    to,
    subject: `New Task Assigned — ${taskTitle}`,
    html: emailWrapper(`
      <h2>You have a new task, ${name}</h2>
      <p>Your Navigator has assigned you a task in the <span class="highlight">${blockName}</span> block.</p>
      <div class="info-box">
        <p style="margin:0; font-size:18px; font-weight:700; color:#fff;">${taskTitle}</p>
        ${description ? `<p style="margin:8px 0 0; font-size:13px; color:#94a3b8;">${description}</p>` : ''}
        ${deadline ? `<p style="margin:10px 0 0; font-size:12px; color:#f59e0b;">Deadline: <strong>${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>` : ''}
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard" class="btn">View in Portal</a>
    `),
  });
}

export async function sendPaperStatusEmail(
  to: string,
  name: string,
  paperTitle: string,
  status: 'published' | 'rejected',
  notes?: string
) {
  const approved = status === 'published';
  return sendEmail({
    to,
    subject: `Your paper has been ${approved ? 'approved' : 'rejected'} — ${paperTitle}`,
    html: emailWrapper(`
      <h2>${approved ? 'Paper Approved!' : 'Paper Not Approved'}</h2>
      <p>Hi ${name}, your submission to the Knowledge Bridge has been reviewed.</p>
      <div class="info-box">
        <p style="margin:0; font-size:16px; font-weight:700; color:#fff;">${paperTitle}</p>
        <p style="margin:8px 0 0;">
          <span class="badge" style="background:${approved ? 'rgba(0,212,255,0.15)' : 'rgba(239,68,68,0.15)'}; color:${approved ? '#00D4FF' : '#f87171'};">
            ${approved ? 'Published' : 'Rejected'}
          </span>
        </p>
        ${notes ? `<p style="margin:10px 0 0; font-size:13px; color:#94a3b8;"><strong>Navigator notes:</strong> ${notes}</p>` : ''}
      </div>
      ${approved
        ? '<p>Your paper is now live on the Knowledge Bridge. Thank you for your contribution!</p>'
        : '<p>Please review the navigator notes and consider revising your submission. You can resubmit after making improvements.</p>'
      }
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard/knowledge-bridge" class="btn">View in Portal</a>
    `),
  });
}

export async function sendInitiativeEmail(
  to: string,
  name: string,
  initiativeTitle: string,
  blockName: string,
  description: string,
  deadline?: string
) {
  return sendEmail({
    to,
    subject: `New Open Initiative in ${blockName} — ${initiativeTitle}`,
    html: emailWrapper(`
      <h2>New initiative in your block, ${name}</h2>
      <p>A new open initiative has been posted in the <span class="highlight">${blockName}</span> block. Let the team know if you want to participate!</p>
      <div class="info-box">
        <p style="margin:0; font-size:18px; font-weight:700; color:#fff;">${initiativeTitle}</p>
        <p style="margin:8px 0 0; font-size:13px; color:#94a3b8;">${description}</p>
        ${deadline ? `<p style="margin:10px 0 0; font-size:12px; color:#f59e0b;">Deadline: <strong>${new Date(deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>` : ''}
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard" class="btn">Respond in Portal</a>
    `),
  });
}

export async function sendApplicationResultEmail(
  to: string,
  name: string,
  accepted: boolean,
  accessCode?: string
) {
  return sendEmail({
    to,
    subject: accepted ? 'You have been accepted to AlphaX!' : 'AlphaX Application Update',
    html: accepted
      ? emailWrapper(`
          <h2>Congratulations, ${name}!</h2>
          <p>Your application to join AlphaX has been <span class="highlight">accepted</span>. Welcome to the collective!</p>
          <div class="info-box">
            <p style="margin:0; font-size:13px; color:#94a3b8;">Your Alphanaut Access Code</p>
            <p style="margin:6px 0 0; font-size:28px; font-weight:800; color:#00D4FF; letter-spacing:4px;">${accessCode}</p>
            <p style="margin:6px 0 0; font-size:12px; color:#64748b;">Use this code to log in at the Alphanaut Portal.</p>
          </div>
          <p>Start by reading the Orientation Manual, then your Navigator will reach out with your first tasks.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" class="btn">Access Portal</a>
        `)
      : emailWrapper(`
          <h2>Application Update</h2>
          <p>Hi ${name}, thank you for applying to AlphaX.</p>
          <p>After reviewing your application, we are not able to move forward at this time. This does not reflect on your abilities — we receive many strong applications and sometimes simply do not have open spots in the right blocks.</p>
          <p>We encourage you to apply again in the future when new recruitment rounds open. Keep following our announcements.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/announcements" class="btn">Follow Announcements</a>
        `),
  });
}
