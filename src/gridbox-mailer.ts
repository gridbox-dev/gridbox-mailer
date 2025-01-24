'use strict';

import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { v4 as uuid } from 'uuid';
import { log } from '@/lib';

import { TransporterConfig, AllowedPort, ConnectionMetadata } from '@/types';
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

	public async send() {}

	public async sendBatch() {}

	public async scheduleSend() {}

	public async getScheduledEmails() {}

	public async cancelScheduleSend() {}

	public async previewEmail() {}

	// Utilities

	public static validateEmail() {}

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

	private static async retrySend() {}

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

	private static loadAttachments() {}

	private static validateAttachments() {}
}
