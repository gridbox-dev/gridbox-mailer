export interface IEmailClientTransporter {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface IEmailTemplate {
  templateBasePath: string;
  templateName: string;
  replacements?: Record<string, string>;
}

export interface ISendEmail {
  html: string;
  subject: string;
  to: string[];
  attachments?: {
    filename: string;
    cid: string;
    attachmentBasePath: string;
  }[];
}
