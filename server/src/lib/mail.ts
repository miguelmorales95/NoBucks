// Email through Resend's HTTP API (for password-reset codes). Without RESEND_API_KEY and MAIL_FROM
// nothing is sent and callers say reset isn't available.
import { env } from "../env";

export const mailConfigured = () => !!(env.resendApiKey && env.mailFrom);

export async function sendMail(to: string, subject: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.resendApiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.mailFrom, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status})`);
}
