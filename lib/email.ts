import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpUser || !smtpPass) {
    console.log("[Email] SMTP not configured - emails will be logged to console")
    return null
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  })

  return transporter
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter()

  if (!transport) {
    console.log("[Email] Would send:", { to: options.to, subject: options.subject, text: options.text })
    return true
  }

  try {
    await transport.sendMail({
      from: `"HackClub VIT Chennai" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
    console.log("[Email] Sent to", options.to)
    return true
  } catch (error) {
    console.error("[Email] Failed to send:", error)
    return false
  }
}

export async function sendInterviewScheduledEmail(
  to: string,
  candidateName: string,
  interviewDate: Date,
  mode: "ONLINE" | "OFFLINE",
  locationOrLink: string,
  panelists: string[]
) {
  const dateStr = interviewDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = interviewDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const text = `
Interview Scheduled - HackClub VIT Chennai

Dear ${candidateName},

Your interview has been scheduled for ${dateStr} at ${timeStr}.

Mode: ${mode === "ONLINE" ? "Online" : "In-person"}
${mode === "ONLINE" ? `Link: ${locationOrLink}` : `Location: ${locationOrLink}`}

Panel: ${panelists.join(", ")}

Please be ready 10 minutes before the scheduled time.

Best regards,
HackClub VIT Chennai Recruitment Team
  `.trim()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ac120c;">Interview Scheduled</h2>
      <p>Dear <strong>${candidateName}</strong>,</p>
      <p>Your interview has been scheduled for <strong>${dateStr} at ${timeStr}</strong>.</p>
      <p><strong>Mode:</strong> ${mode === "ONLINE" ? "Online" : "In-person"}</p>
      <p>${mode === "ONLINE" ? `<strong>Link:</strong> <a href="${locationOrLink}">${locationOrLink}</a>` : `<strong>Location:</strong> ${locationOrLink}`}</p>
      <p><strong>Panel:</strong> ${panelists.join(", ")}</p>
      <p>Please be ready 10 minutes before the scheduled time.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #888; font-size: 12px;">HackClub VIT Chennai Recruitment Team</p>
    </div>
  `

  return sendEmail({ to, subject: "Interview Scheduled - HackClub VIT Chennai", text, html })
}

export async function sendInterviewRescheduledEmail(
  to: string,
  candidateName: string,
  oldDate: Date,
  newDate: Date,
  mode: "ONLINE" | "OFFLINE",
  locationOrLink: string
) {
  const oldDateStr = oldDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const oldTimeStr = oldDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  const newDateStr = newDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const newTimeStr = newDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  const text = `
Interview Rescheduled - HackClub VIT Chennai

Dear ${candidateName},

Your interview has been rescheduled.

Previous: ${oldDateStr} at ${oldTimeStr}
New: ${newDateStr} at ${newTimeStr}

Mode: ${mode === "ONLINE" ? "Online" : "In-person"}
${mode === "ONLINE" ? `Link: ${locationOrLink}` : `Location: ${locationOrLink}`}

Please be ready 10 minutes before the scheduled time.

Best regards,
HackClub VIT Chennai Recruitment Team
  `.trim()

  return sendEmail({
    to,
    subject: "Interview Rescheduled - HackClub VIT Chennai",
    text,
  })
}

export async function sendInterviewCancelledEmail(
  to: string,
  candidateName: string,
  interviewDate: Date
) {
  const dateStr = interviewDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const timeStr = interviewDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  const text = `
Interview Cancelled - HackClub VIT Chennai

Dear ${candidateName},

Your interview scheduled for ${dateStr} at ${timeStr} has been cancelled.

If you have any questions, please contact the recruitment team.

Best regards,
HackClub VIT Chennai Recruitment Team
  `.trim()

  return sendEmail({
    to,
    subject: "Interview Cancelled - HackClub VIT Chennai",
    text,
  })
}

export async function sendDecisionEmail(
  to: string,
  candidateName: string,
  decision: "SELECTED" | "REJECTED" | "WAITLISTED",
  reason?: string
) {
  const decisionText = {
    SELECTED: "Congratulations! You have been selected.",
    REJECTED: "We regret to inform you that your application was not successful.",
    WAITLISTED: "You have been placed on the waitlist.",
  }[decision]

  const text = `
Application Decision - HackClub VIT Chennai

Dear ${candidateName},

${decisionText}

${reason ? `Reason: ${reason}` : ""}

Best regards,
HackClub VIT Chennai Recruitment Team
  `.trim()

  return sendEmail({
    to,
    subject: `Application ${decision} - HackClub VIT Chennai`,
    text,
  })
}

export async function sendShortlistedEmail(to: string, candidateName: string) {
  const text = `
Application Shortlisted - HackClub VIT Chennai

Dear ${candidateName},

Congratulations! Your application has been shortlisted for the next round.

The recruitment team will contact you shortly regarding interview scheduling.

Best regards,
HackClub VIT Chennai Recruitment Team
  `.trim()

  return sendEmail({
    to,
    subject: "Application Shortlisted - HackClub VIT Chennai",
    text,
  })
}