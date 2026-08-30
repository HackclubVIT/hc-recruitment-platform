import nodemailer from "nodemailer";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (payload: EmailPayload) => {
  // If email is not configured in env, we just log and skip to not break the app
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[EMAIL SKIPPED] SMTP not fully configured. Would have sent email to ${payload.to} with subject: ${payload.subject}`);
    return;
  }

  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"HackClub VIT" <recruitment@hackclubvit.co>`,
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    console.log(`[EMAIL SENT] to ${payload.to} - ${payload.subject}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${payload.to}:`, error);
    // Don't throw the error, just log it so transactions aren't broken by email failure
  }
};

export const templates = {
  applicationSubmitted: (name: string, recruitmentName: string) => `
    <h2>Application Received</h2>
    <p>Hi ${name},</p>
    <p>We have successfully received your application for <strong>${recruitmentName}</strong>.</p>
    <p>Our team will review your profile and get back to you soon.</p>
    <br/>
    <p>Best regards,<br/>HackClub VIT</p>
  `,
  
  statusUpdated: (name: string, status: string, message?: string) => `
    <h2>Application Update</h2>
    <p>Hi ${name},</p>
    <p>Your application status has been updated to: <strong>${status}</strong>.</p>
    ${message ? `<p>${message}</p>` : ''}
    <br/>
    <p>Best regards,<br/>HackClub VIT</p>
  `,

  interviewScheduled: (name: string, date: string, time: string, duration: number, round: number, link: string) => `
    <h2>Interview Scheduled (Round ${round})</h2>
    <p>Hi ${name},</p>
    <p>Your interview has been scheduled.</p>
    <ul>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Duration:</strong> ~${duration} mins</li>
      <li><strong>Meeting Link:</strong> <a href="${link}">${link}</a></li>
    </ul>
    <br/>
    <p>Best regards,<br/>HackClub VIT</p>
  `,

  interviewRescheduled: (name: string, date: string, time: string, round: number, link: string) => `
    <h2>Interview Rescheduled (Round ${round})</h2>
    <p>Hi ${name},</p>
    <p>Your interview has been rescheduled.</p>
    <ul>
      <li><strong>New Date:</strong> ${date}</li>
      <li><strong>New Time:</strong> ${time}</li>
      <li><strong>Meeting Link:</strong> <a href="${link}">${link}</a></li>
    </ul>
    <br/>
    <p>Best regards,<br/>HackClub VIT</p>
  `,

  interviewCancelled: (name: string, round: number) => `
    <h2>Interview Cancelled</h2>
    <p>Hi ${name},</p>
    <p>Your Round ${round} interview has been cancelled. Our team will reach out with further updates soon.</p>
    <br/>
    <p>Best regards,<br/>HackClub VIT</p>
  `
};
