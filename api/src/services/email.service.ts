import { env } from "@/config/env";

/**
 * Placeholder email sender. Logs the email to the console instead of sending
 * it, so auth flows (verification, password reset) are fully testable without
 * an SMTP provider configured. Swap the body for a real provider (Resend,
 * SES, Postmark, etc.) before production.
 */
function send(to: string, subject: string, link: string) {
  console.log(`\n📧 [email] To: ${to}\n   Subject: ${subject}\n   Link: ${link}\n`);
}

export function sendVerificationEmail(to: string, token: string) {
  const link = `${env.CLIENT_URL}/verify-email/confirm?token=${token}`;
  send(to, "Verify your RoomMate account", link);
}

export function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
  send(to, "Reset your RoomMate password", link);
}

export function sendInvitationEmail(to: string, roomName: string, code: string) {
  const link = `${env.CLIENT_URL}/invite/${code}`;
  send(to, `You've been invited to join "${roomName}" on RoomMate`, link);
}
