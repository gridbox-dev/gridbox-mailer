'use strict';

import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { log } from '@/lib';

import {
	TransporterConfig,
	AllowedPort,
	ConnectionMetadata,
	EmailOptions,
	EmailAttachment,
	EmailSentResponse,
} from '@/types';
import { CustomError, ErrorHandler } from '@/errors';

export class GridboxMailer {
	private static connections: Map<string, { metadata: ConnectionMetadata; transporter: Transporter }> = new Map();
	private static currentConnection: Transporter | null = null;

	constructor() {}

	// Connection management

	public async connect(config: TransporterConfig): Promise<void> {
		GridboxMailer.validateConfiguration(config);

		const { host, port, credentials, logging = false } = config;

		const transporterOptions: SMTPTransport.Options = {
			host: host,
			port: GridboxMailer.formatPort(port),
			secure: port === 'secure',
			auth: {
				user: credentials.username,
				pass: credentials.password,
			},
		};

		try {
			const transporter = createTransport(transporterOptions);

			const connectionMetadata = GridboxMailer.generateConnectionMetadata(
				host,
				transporterOptions.port!,
				transporterOptions.secure!,
			);

			GridboxMailer.connections.set(connectionMetadata.id, {
				metadata: connectionMetadata,
				transporter,
			});

			GridboxMailer.currentConnection = transporter;

			if (logging) {
				log.neutral(`Connection established on ${host} with ID: ${connectionMetadata.id}`);
			}
		} catch (error) {
			ErrorHandler.handle(
				CustomError.SMTPConnectionError('Failed to establish SMTP connection', { host, port, credentials }),
			);
		}
	}

	public getCurrentConnection(): Transporter | null {
		if (GridboxMailer.currentConnection) {
			const connectionId = GridboxMailer.getConnectionId(GridboxMailer.currentConnection);

			if (connectionId === undefined) {
				const errorMessage = 'Connection ID could not be found for the current transporter.';
				ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
				return null;
			}

			const currentMetadata = GridboxMailer.connections.get(connectionId)?.metadata;

			if (currentMetadata) {
				console.table([currentMetadata]);
			}

			return GridboxMailer.currentConnection;
		}

		const errorMessage = 'No active SMTP connection found. Use the `connect` method to establish a connection.';
		ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
		return null;
	}

	public listConnections(): void {
		if (GridboxMailer.connections.size === 0) {
			log.info('No active connections.');
			return;
		}

		const connectionsMetadata = Array.from(GridboxMailer.connections.values()).map(({ metadata }) => metadata);

		console.table(connectionsMetadata);
	}

	public useConnection(connectionId: string): void {
		const connection = GridboxMailer.connections.get(connectionId);

		if (!connection) {
			const errorMessage = `No connection found with ID: ${connectionId}. Use the \`listConnections\` method to see available connections.`;
			ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
			return;
		}

		GridboxMailer.currentConnection = connection.transporter;
		log.neutral(`Switched to connection with ID: ${connectionId}`);
	}

	public async killConnection(connectionId?: string): Promise<void> {
		let connectionToKill: Transporter | null = null;

		if (connectionId) {
			const connection = GridboxMailer.connections.get(connectionId);

			if (!connection) {
				const errorMessage = `No connection found with ID: ${connectionId}. Please use the \`listConnections\` method to view available connections.`;
				ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
				return;
			}

			connectionToKill = connection.transporter;
		} else {
			if (!GridboxMailer.currentConnection) {
				const errorMessage =
					'No active SMTP connection found. Please use the `connect` method to establish a connection first.';
				ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
				return;
			}

			connectionToKill = GridboxMailer.currentConnection;
		}

		const connectionIdToKill = GridboxMailer.getConnectionId(connectionToKill);

		if (!connectionIdToKill) {
			const errorMessage = 'Connection ID could not be found for the connection to close.';
			ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
			return;
		}

		try {
			await connectionToKill.close();
			log.neutral(`Connection with ID: ${connectionIdToKill} has been successfully closed.`);

			GridboxMailer.connections.delete(connectionIdToKill);

			if (!connectionId) {
				GridboxMailer.currentConnection = null;
			}
		} catch (error) {
			const errorMessage = `Failed to close connection with ID: ${connectionIdToKill}. Ensure the connection is not in use and try again.`;
			ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
		}
	}

	public async killAllConnections() {
		if (GridboxMailer.connections.size === 0) {
			log.info('No active connections to close.');
			return;
		}

		for (let [connectionId, { transporter }] of GridboxMailer.connections.entries()) {
			try {
				await transporter.close();
				console.log(`Connection with ID: ${connectionId} has been successfully closed.`);

				GridboxMailer.connections.delete(connectionId);
			} catch (error) {
				const errorMessage = `Failed to close connection with ID: ${connectionId}. Ensure the connection is not in use and try again.`;
				ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
			}
		}

		if (GridboxMailer.connections.size === 0) {
			GridboxMailer.currentConnection = null;
			log.info('All active connections have been closed.');
		}
	}

	// Mail management

	public async send(emailOptions: EmailOptions): Promise<EmailSentResponse> {
		if (!GridboxMailer.currentConnection) {
			const errorMessage =
				'No active SMTP connection found. Please use the `connect` method to establish a connection first.';
			ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
			return { success: false, status: 500, message: errorMessage };
		}

		const fieldsToValidate = [emailOptions.from, emailOptions.sendTo, emailOptions.cc, emailOptions.bcc];
		for (const field of fieldsToValidate) {
			if (field && !GridboxMailer.validateEmail(field)) {
				const errorMessage = `Invalid email address in one of the fields: ${JSON.stringify(field)}`;
				ErrorHandler.handle(CustomError.SendEmailError(errorMessage));
				return { success: false, status: 400, message: errorMessage };
			}
		}

		const mailConfig: SendMailOptions = {
			from: emailOptions.from,
			to: emailOptions.sendTo,
			subject: emailOptions.subject,
			cc: emailOptions.cc,
			bcc: emailOptions.bcc,
			html: emailOptions.html,
			text: emailOptions.plainText,
			attachments: emailOptions.attachments ? GridboxMailer.loadAttachments(emailOptions.attachments) : undefined,
		};

		if (emailOptions.retry) {
			const { maxRetries, delay } = emailOptions.retry;
			return await GridboxMailer.retrySend(mailConfig, maxRetries, delay);
		}

		try {
			const info = await GridboxMailer.currentConnection.sendMail(mailConfig);
			return {
				success: true,
				status: 200,
				message: 'Email successfully sent.',
				messageId: info.messageId,
			};
		} catch (error) {
			const errorMessage = `Error sending email: ${error instanceof Error ? error.message : error}`;
			ErrorHandler.handle(CustomError.SendEmailError(errorMessage));
			return {
				success: false,
				status: 500,
				message: errorMessage,
			};
		}
	}

	public async sendBatch(
		batch: EmailOptions[],
		batchSize: number,
		delay: number = 3000,
	): Promise<EmailSentResponse[]> {
		if (!GridboxMailer.currentConnection) {
			const errorMessage =
				'No active SMTP connection found. Please use the `connect` method to establish a connection first.';
			ErrorHandler.handle(CustomError.SMTPConnectionError(errorMessage));
			return [];
		}

		const responses: EmailSentResponse[] = [];

		for (let i = 0; i < batch.length; i += batchSize) {
			const batchSlice = batch.slice(i, i + batchSize);

			const batchResponses = await Promise.all(
				batchSlice.map(async (emailOptions) => {
					const fieldsToValidate = [
						emailOptions.from,
						emailOptions.sendTo,
						emailOptions.cc,
						emailOptions.bcc,
					];
					for (const field of fieldsToValidate) {
						if (field && !GridboxMailer.validateEmail(field)) {
							const errorMessage = `Invalid email address in one of the fields: ${JSON.stringify(field)}`;
							ErrorHandler.handle(CustomError.SendEmailError(errorMessage));
							return {
								success: false,
								status: 400,
								message: errorMessage,
							};
						}
					}

					try {
						return await this.send(emailOptions);
					} catch (error) {
						const errorMessage = `Error sending email: ${error instanceof Error ? error.message : error}`;
						ErrorHandler.handle(CustomError.SendEmailError(errorMessage));
						return {
							success: false,
							status: 500,
							message: errorMessage,
						};
					}
				}),
			);

			responses.push(...batchResponses);

			if (i + batchSize < batch.length) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		return responses;
	}

	public async scheduleSend() {}

	public async getScheduledEmails() {}

	public async cancelScheduleSend() {}

	public async previewEmail() {}

	// Utilities

	public static validateEmail(email: string | string[]): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (Array.isArray(email)) {
			return email.every((e) => emailRegex.test(e));
		}

		return emailRegex.test(email);
	}

	public async loadHTMLTemplate() {}

	public async addCustomHeader() {}

	public async removeCustomHeader() {}

	public async isHealthy() {}

	public async setRateLimit() {}

	public async handleQueue() {}

	// Handlers

	private static validateConfiguration(config: TransporterConfig): void {
		try {
			if (!config.host) {
				throw CustomError.ConfigurationError('Missing SMTP host.');
			} else if (!config.port) {
				throw CustomError.ConfigurationError('Missing SMTP port.');
			} else if (!config.credentials.username) {
				throw CustomError.ConfigurationError('Missing SMTP username.');
			} else if (!config.credentials.password) {
				throw CustomError.ConfigurationError('Missing SMTP password.');
			}
		} catch (error) {
			if (error instanceof CustomError) {
				ErrorHandler.handle(error);
			}
		}
	}

	private static async retrySend(
		mailOptions: SendMailOptions,
		maxRetries: number = 3,
		delay: number = 3000,
	): Promise<EmailSentResponse> {
		let attempts = 0;

		while (attempts < maxRetries) {
			try {
				await GridboxMailer.currentConnection!.sendMail(mailOptions);
				return { success: true, status: 200, message: 'Email successfully sent.' };
			} catch (error) {
				attempts++;
				if (attempts >= maxRetries) {
					const errorMessage = `Error sending email after ${attempts} retries: ${error instanceof Error ? error.message : error}`;
					ErrorHandler.handle(CustomError.SendEmailError(errorMessage));
					return {
						success: false,
						status: 500,
						message: errorMessage,
					};
				}

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		const errorMessage = 'Unexpected failure during retry logic.';
		ErrorHandler.handle(CustomError.SendEmailError(errorMessage));
		return { success: false, status: 500, message: errorMessage };
	}

	private static proxyHandler() {}

	private static generateConnectionMetadata(host: string, port: AllowedPort, secure: boolean): ConnectionMetadata {
		const metadata: ConnectionMetadata = {
			id: `${host}:${port}:${secure ? 'secure' : 'tls'}`,
			host: host,
			port: port,
			secure: secure,
			createdAt: new Date(),
		};

		return metadata;
	}

	private static getConnectionId(transporter: Transporter): string | undefined {
		for (let [id, { transporter: conn }] of GridboxMailer.connections.entries()) {
			if (conn === transporter) {
				return id;
			}
		}
		return undefined;
	}

	private static formatPort(port: AllowedPort) {
		switch (port) {
			case 'secure':
				return 465;
			case 'tls':
				return 587;
			default:
				return port;
		}
	}

	private static loadAttachments(attachments: EmailAttachment[]): SendMailOptions['attachments'] {
		this.validateAttachments(attachments);

		const fs = require('fs');
		return attachments.map((attachment) => {
			return {
				filename: attachment.filename,
				cid: attachment.cid,
				content: fs.readFileSync(attachment.basePath),
			};
		});
	}

	private static validateAttachments(attachments: EmailAttachment[]): void {
		if (!attachments || attachments.length === 0) {
			throw CustomError.AttachmentValidationError('No attachments provided.');
		}

		const fs = require('fs');
		const allowedFormats = ['.png', '.jpg', '.jpeg', '.pdf', '.docx'];
		const maxFileSize = 5 * 1024 * 1024;

		for (const attachment of attachments) {
			if (!attachment.filename) {
				throw CustomError.AttachmentValidationError('Attachment is missing a filename.');
			}

			if (!attachment.cid) {
				throw CustomError.AttachmentValidationError(`Attachment "${attachment.filename}" is missing a CID.`);
			}

			if (!attachment.basePath) {
				throw CustomError.AttachmentValidationError(
					`Attachment "${attachment.filename}" is missing a basePath.`,
				);
			}

			if (!fs.existsSync(attachment.basePath)) {
				throw CustomError.AttachmentValidationError(
					`The file at basePath "${attachment.basePath}" for attachment "${attachment.filename}" does not exist.`,
				);
			}

			const stats = fs.statSync(attachment.basePath);
			if (stats.size > maxFileSize) {
				throw CustomError.AttachmentValidationError(
					`The file "${attachment.filename}" exceeds the maximum allowed size of ${maxFileSize / (1024 * 1024)} MB.`,
				);
			}

			const fileExtension = attachment.filename.slice(((attachment.filename.lastIndexOf('.') - 1) >>> 0) + 2);
			if (!allowedFormats.includes(`.${fileExtension}`)) {
				throw CustomError.AttachmentValidationError(
					`The file "${attachment.filename}" has an unsupported format. Allowed formats: ${allowedFormats.join(', ')}.`,
				);
			}
		}
	}
}
