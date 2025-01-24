'use strict';

import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { EmailSentResponse, SMTPEmail, SMTPTransporterConfig } from '@/types';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { formatPort, loadAttachments } from '@/lib';

export class SMTPTransporter {
	private static instance: Transporter | null = null;
	private static sender: string | null = null;

	private constructor() {}

	public static async connect(credentials: SMTPTransporterConfig): Promise<SMTPTransporter> {
		if (SMTPTransporter.instance) {
			return new Proxy(new SMTPTransporter(), this.proxyHandler());
		}

		const transporterOptions: SMTPTransport.Options = {
			host: credentials.host,
			port: formatPort(credentials.port),
			secure: credentials.port === 'secure' ? true : false,
			auth: {
				user: credentials.username,
				pass: credentials.password,
			},
		};

		try {
			SMTPTransporter.instance = createTransport(transporterOptions);
			SMTPTransporter.sender = credentials.username;

			return new Proxy(new SMTPTransporter(), this.proxyHandler());
		} catch (error) {
			throw new Error(
				`Error connecting to SMTP server: ${error instanceof Error ? error.message : error}`,
			);
		}
	}

	public getConnection(): Transporter {
		if (!SMTPTransporter.instance) {
			throw new Error('SMTP Transporter connection not found. Please connect first.');
		}

		return SMTPTransporter.instance;
	}

	public disconnect(): void {
		if (SMTPTransporter.instance) {
			SMTPTransporter.instance.close();
			SMTPTransporter.instance = null;
			SMTPTransporter.sender = null;
		}

		console.log('Gridbox Mailer SMTP transporter disconnected.');
	}

	public async send(emailOptions: SMTPEmail): Promise<EmailSentResponse> {
		if (!SMTPTransporter.instance) {
			throw new Error('SMTP Transporter connection not found. Please connect first.');
		}

		if (!SMTPTransporter.sender) {
			throw new Error('SMTP Transporter sender not found. Please connect first.');
		}

		const mailOptions: SendMailOptions = {
			from: SMTPTransporter.sender,
			to: emailOptions.sendTo,
			subject: emailOptions.subject,
			cc: emailOptions.cc,
			bcc: emailOptions.bcc,
			html: emailOptions.html,
			text: emailOptions.plainText,
			attachments: emailOptions.attachments
				? loadAttachments(emailOptions.attachments)
				: undefined,
		};

		if (emailOptions.retry) {
			const { maxRetries, delay } = emailOptions.retry;

			return SMTPTransporter.retrySend(mailOptions, maxRetries, delay);
		}

		try {
			await SMTPTransporter.instance.sendMail(mailOptions);

			return {
				success: true,
				code: 200,
				message: 'Email successfully sent.',
			};
		} catch (error) {
			throw new Error(
				`Error sending email: ${error instanceof Error ? error.message : error}`,
			);
		}
	}

	private static async retrySend(
		mailOptions: SendMailOptions,
		maxRetries: number = 3,
		delay: number = 3000,
	): Promise<EmailSentResponse> {
		if (!SMTPTransporter.instance) {
			throw new Error('SMTP Transporter connection not found. Please connect first.');
		}

		if (!SMTPTransporter.sender) {
			throw new Error('SMTP Transporter sender not found. Please connect first.');
		}

		let attempts = 0;

		while (attempts < maxRetries) {
			try {
				await SMTPTransporter.instance.sendMail(mailOptions);

				return {
					success: true,
					code: 200,
					message: 'Email successfully sent.',
				};
			} catch (error) {
				attempts++;

				if (attempts >= maxRetries) {
					throw new Error(
						`Failed sending email after ${maxRetries} attempts: ${
							error instanceof Error ? error.message : error
						}`,
					);
				}

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		throw new Error('Something went wrong while sending the email. Please try again later.');
	}

	private static proxyHandler() {
		return {
			get(target: SMTPTransporter, prop: string | symbol) {
				if (prop === 'send') {
					return target.send.bind(target);
				}

				if (prop === 'getConnection') {
					return target.getConnection.bind(target);
				}

				if (prop === 'disconnect') {
					return target.disconnect.bind(target);
				}

				if (prop === 'then') {
					return undefined;
				}

				throw new Error(`Property ${String(prop)} is not accessible`);
			},
		};
	}
}
