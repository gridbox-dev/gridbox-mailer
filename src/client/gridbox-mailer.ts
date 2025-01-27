import { Transporter } from 'nodemailer';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';

import { createConnection, sendEmail } from '@/modules';

import {
	ConnectionMetadata,
	ConnectionProps,
	EmailProps,
	EmailSentResponse,
	HTMLTemplateProps,
	MailerEvents,
} from '@/types';
import Handlebars from 'handlebars';

export class GridboxMailer {
	private static connections: Map<string, { metadata: ConnectionMetadata; transporter: Transporter }> = new Map();
	private static templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();
	private static currentConnection: Transporter | null = null;
	private static eventEmitter: EventEmitter = new EventEmitter();

	constructor() {}

	public async connect(config: ConnectionProps): Promise<void> {
		try {
			const [transporter, metadata] = await createConnection(config);

			GridboxMailer.connections.set(metadata.id, { metadata, transporter });
			GridboxMailer.currentConnection = transporter;
			GridboxMailer.eventEmitter.emit('connected', { metadata: metadata, transporter: transporter });
			return;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	public getCurrentConnection(): Transporter | null {
		if (GridboxMailer.currentConnection) {
			const connectionId = GridboxMailer.getConnectionId(GridboxMailer.currentConnection);

			if (connectionId === undefined) {
				console.error('Failed to get current connection. Connection ID could not be found.');
				return null;
			}

			GridboxMailer.connections.get(connectionId)?.metadata;
			return GridboxMailer.currentConnection;
		}

		throw new Error('No active SMTP connection found. Please connect first.');
	}

	public listConnections(): void {
		if (GridboxMailer.connections.size === 0) {
			throw new Error('No active SMTP connections found. Please connect first.');
		}

		const connectionsMetadata = Array.from(GridboxMailer.connections.values()).map(({ metadata }) => metadata);

		console.table(connectionsMetadata);
	}

	public useConnection(connectionId: string): void {
		const connection = GridboxMailer.connections.get(connectionId);

		if (!connection) {
			throw new Error(`Connection with ID ${connectionId} not found.`);
		}

		GridboxMailer.currentConnection = connection.transporter;
		GridboxMailer.eventEmitter.emit('connectionSwitched', {
			metadata: connection.metadata,
			transporter: connection.transporter,
		});
	}

	public async killConnection(connectionId?: string): Promise<void> {
		let connectionToKill: Transporter | null = null;

		if (connectionId) {
			const connection = GridboxMailer.connections.get(connectionId);

			if (!connection) {
				throw new Error(`Connection with ID ${connectionId} not found.`);
			}

			connectionToKill = connection.transporter;
		} else {
			if (!GridboxMailer.currentConnection) {
				throw new Error('No active SMTP connection found. Please connect first.');
			}

			connectionToKill = GridboxMailer.currentConnection;
		}

		const connectionIdToKill = GridboxMailer.getConnectionId(connectionToKill);

		if (!connectionIdToKill) {
			throw new Error('Failed to close connection. Connection ID could not be found.');
		}

		try {
			connectionToKill.close();
			GridboxMailer.eventEmitter.emit('connectionClosed', {
				connectionId: connectionIdToKill,
				message: 'Connection closed.',
			});

			GridboxMailer.connections.delete(connectionIdToKill);

			if (!connectionId) {
				GridboxMailer.currentConnection = null;
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	public async killAllConnections() {
		if (GridboxMailer.connections.size === 0) {
			console.error('No active SMTP connections found. Please connect first.');
			return;
		}

		for (let [connectionId, { transporter }] of GridboxMailer.connections.entries()) {
			try {
				transporter.close();
				GridboxMailer.eventEmitter.emit('connectionClosed', {
					connectionId: connectionId,
					message: 'Connection closed.',
				});

				GridboxMailer.connections.delete(connectionId);
			} catch (error) {
				console.error(error);
			}
		}

		if (GridboxMailer.connections.size === 0) {
			GridboxMailer.currentConnection = null;
			console.log('All active SMTP connections have been successfully closed.');
		}
	}

	public async send(props: EmailProps): Promise<EmailSentResponse> {
		if (!GridboxMailer.currentConnection) {
			throw new Error('No active SMTP connection found. Please connect first.');
		}

		try {
			GridboxMailer.eventEmitter.emit('sendingEmail', { props });

			const response = await sendEmail({
				...props,
				transporter: GridboxMailer.currentConnection,
				eventEmitter: GridboxMailer.eventEmitter,
			});

			return response;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	public async sendBatch(props: EmailProps[], batchSize: number, delay: number = 3000): Promise<EmailSentResponse[]> {
		if (!GridboxMailer.currentConnection) {
			throw new Error('No active SMTP connection found. Please connect first.');
		}

		const responses: EmailSentResponse[] = [];

		for (let i = 0; i < props.length; i += batchSize) {
			const batch = props.slice(i, i + batchSize);

			const batchResponses = await Promise.all(batch.map(async (props) => await this.send(props)));

			responses.push(...batchResponses);

			if (i + batchSize < props.length) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		return responses;
	}

	public async loadHTMLTemplate(props: HTMLTemplateProps): Promise<string> {
		if (!props.location || !props.filename) {
			throw new Error('Location and filename are required.');
		}

		const templateKey = `${props.location}/${props.filename}.html`;

		if (GridboxMailer.templateCache.has(templateKey)) {
			const cachedTemplate = GridboxMailer.templateCache.get(templateKey);
			return cachedTemplate!(props.replacements || {});
		}

		const templatePath = path.join(props.location, `${props.filename}.html`);

		try {
			const templateFile = fs.readFileSync(templatePath, 'utf8');
			const compiledTemplate = handlebars.compile(templateFile);

			GridboxMailer.templateCache.set(templateKey, compiledTemplate);
			GridboxMailer.eventEmitter.emit('templateLoaded', { templateKey });

			return compiledTemplate(props.replacements || {});
		} catch (error) {
			throw new Error(`Failed to load HTML template: ${error}`);
		}
	}

	private static getConnectionId(transporter: Transporter): string | undefined {
		for (let [id, { transporter: conn }] of GridboxMailer.connections.entries()) {
			if (conn === transporter) {
				return id;
			}
		}
		return undefined;
	}

	public static on<K extends keyof MailerEvents>(event: K, listener: (data: MailerEvents[K]) => void) {
		GridboxMailer.eventEmitter.on(event, listener);
		return () => GridboxMailer.eventEmitter.off(event, listener);
	}
}
