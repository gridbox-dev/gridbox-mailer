import { createTransport, SendMailOptions, Transporter } from "nodemailer";
import path from "path";
import fs from "fs";

import { IEmailClientTransporter, IEmailTemplate, ISendEmail } from "./types";

export class emailClient {
  private static transporter: Transporter | null = null;
  private static user: string | null = null;

  public static async connect({
    host,
    port,
    username,
    password,
  }: IEmailClientTransporter): Promise<typeof emailClient> {
    if (emailClient.transporter) return emailClient;

    emailClient.transporter = createTransport({
      host,
      port,
      secure: false,
      auth: {
        user: username,
        pass: password,
      },
    });

    emailClient.user = username;
    return emailClient;
  }

  public static getConnection(): Transporter {
    if (!emailClient.transporter)
      throw new Error(
        "No email client connection found. Please connect first."
      );

    return emailClient.transporter;
  }

  public static disconnect(): void {
    if (emailClient.transporter) emailClient.transporter.close();

    emailClient.transporter = null;
    emailClient.user = null;
  }

  public static loadHTMLTemplate({
    templateBasePath,
    templateName,
    replacements,
  }: IEmailTemplate): string {
    try {
      const filePath = path.join(templateBasePath, `${templateName}.html`);

      if (!fs.existsSync(filePath))
        throw new Error(
          `HTML template "${templateName}" not found in the given path: ${filePath}`
        );

      let content = fs.readFileSync(filePath, "utf-8");

      if (replacements) {
        for (const [key, value] of Object.entries(replacements)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          content = content.replace(regex, value);
        }
      }

      return content;
    } catch (error) {
      throw new Error(
        `Failed to load HTML template "${templateName}": ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  public static async sendEmail({
    html,
    subject,
    to,
    attachments,
  }: ISendEmail): Promise<void> {
    if (!emailClient.transporter)
      throw new Error(
        "No email client connection found. Please connect first."
      );

    if (!emailClient.user) throw new Error("No email client user found.");

    try {
      const loadAttachments = attachments?.map(
        ({ filename, cid, attachmentBasePath }) => ({
          filename,
          cid,
          path: path.join(attachmentBasePath, filename),
        })
      );

      const mailOptions: SendMailOptions = {
        from: emailClient.user,
        to,
        subject,
        html,
        attachments: loadAttachments,
      };

      await emailClient.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(
        `Failed to send email: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }
}
