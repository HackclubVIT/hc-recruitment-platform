import nodemailer from "nodemailer";
import prisma from "./db";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

const getSmtpSettings = async () => {
  try {
    const setting = await prisma.collection.findUnique({
      where: { name: "smtp_settings" }
    });
    
    if (setting && setting.data) {
      const data = setting.data as Record<string, any>;
      if (data.host && data.user && data.pass) {
        return {
          host: data.host,
          port: Number(data.port) || 587,
          secure: data.secure === true,
          auth: {
            user: data.user,
            pass: data.pass,
          },
          fromEmail: data.fromEmail,
          fromName: data.fromName
        };
      }
    }
  } catch (err) {
    console.error("[EMAIL CONFIG ERROR] Failed to fetch settings from DB", err);
  }
  return null;
};

const createTransporter = (config: any) => {
  return nodemailer.createTransport(config);
};

export const sendEmail = async (payload: EmailPayload) => {
  let config = await getSmtpSettings();
  
  let fromAddress = `"${process.env.SMTP_FROM_NAME || 'HC Recruitment'}" <${process.env.SMTP_FROM || 'recruitment@hackclubvit.co'}>`;

  if (!config) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(`[EMAIL SKIPPED] SMTP not fully configured. Would have sent email to ${payload.to} with subject: ${payload.subject}`);
      return;
    }
    config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      fromEmail: undefined,
      fromName: undefined
    };
  } else {
    fromAddress = `"${config.fromName || 'HC Recruitment'}" <${config.fromEmail || config.auth.user}>`;
  }

  const transporter = createTransporter(config);

  // Validate, deduplicate, and remove empty addresses
  let recipients: string[] = [];
  if (Array.isArray(payload.to)) {
    recipients = Array.from(new Set(payload.to.filter(email => email && typeof email === 'string' && email.trim() !== '')));
  } else if (typeof payload.to === 'string' && payload.to.trim() !== '') {
    recipients = [payload.to.trim()];
  }

  if (recipients.length === 0) {
    console.warn(`[EMAIL SKIPPED] No valid recipients provided for subject: ${payload.subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: recipients.length === 1 ? recipients[0] : undefined,
      bcc: recipients.length > 1 ? recipients : undefined,
      subject: payload.subject,
      html: payload.html,
    });
    console.log(`[EMAIL SENT] to ${recipients.length} recipient(s) - ${payload.subject}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${recipients.join(', ')}:`, error);
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
