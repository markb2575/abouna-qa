import "server-only";
import { EmailClient } from "@azure/communication-email";

let cachedClient: EmailClient | null = null;

function getEmailClient(): EmailClient {
  if (!cachedClient) {
    const connectionString = process.env.ACS_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("ACS_CONNECTION_STRING is not set");
    }
    cachedClient = new EmailClient(connectionString);
  }
  return cachedClient;
}

function fromAddress(): string {
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!from) throw new Error("EMAIL_FROM_ADDRESS is not set");
  return from;
}

function baseUrl(): string {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) throw new Error("PUBLIC_BASE_URL is not set");
  return url.replace(/\/$/, "");
}

async function sendEmail(to: string, subject: string, html: string, plainText: string) {
  const client = getEmailClient();
  const poller = await client.beginSend({
    senderAddress: fromAddress(),
    content: { subject, html, plainText },
    recipients: { to: [{ address: to }] },
  });
  await poller.pollUntilDone();
}

export async function sendPriestInviteEmail(params: {
  to: string;
  rawToken: string;
  invitedByName?: string;
}): Promise<void> {
  const link = `${baseUrl()}/invite/${params.rawToken}`;
  const inviter = params.invitedByName ? ` by ${params.invitedByName}` : "";
  const plainText = `You've been invited${inviter} to join Abouna as a priest.\n\nCreate your account: ${link}\n\nThis link expires in 7 days and can only be used once.`;
  const html = `
    <p>You've been invited${inviter} to join Abouna as a priest.</p>
    <p><a href="${link}">Create your account</a></p>
    <p>This link expires in 7 days and can only be used once.</p>
  `;
  await sendEmail(params.to, "You've been invited to join Abouna as a priest", html, plainText);
}

export async function sendMagicSignInEmail(params: { to: string; rawToken: string }): Promise<void> {
  const link = `${baseUrl()}/priest/verify?token=${params.rawToken}`;
  const plainText = `Sign in to Abouna: ${link}\n\nThis link expires in 15 minutes and can only be used once. If you didn't request this, you can ignore this email.`;
  const html = `
    <p><a href="${link}">Sign in to Abouna</a></p>
    <p>This link expires in 15 minutes and can only be used once. If you didn't request this, you can ignore this email.</p>
  `;
  await sendEmail(params.to, "Your Abouna sign-in link", html, plainText);
}

export async function sendQuestionAnsweredEmail(params: {
  to: string;
  questionText: string;
  answerText: string;
  isPublic: boolean;
  questionId: string;
}): Promise<void> {
  const publicLink = params.isPublic ? `${baseUrl()}/questions/${params.questionId}` : null;
  const plainText = [
    "Your question has been answered.",
    "",
    `Question: ${params.questionText}`,
    "",
    `Answer: ${params.answerText}`,
    publicLink ? `\nView it here: ${publicLink}` : "",
  ].join("\n");
  const html = `
    <p>Your question has been answered.</p>
    <p><strong>Question:</strong> ${escapeHtml(params.questionText)}</p>
    <p><strong>Answer:</strong> ${escapeHtml(params.answerText)}</p>
    ${publicLink ? `<p><a href="${publicLink}">View it on the site</a></p>` : ""}
  `;
  await sendEmail(params.to, "Your question has been answered", html, plainText);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
