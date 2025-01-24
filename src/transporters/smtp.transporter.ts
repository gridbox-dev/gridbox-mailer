'use strict';

import { createTransport, Transporter } from 'nodemailer';
import { SMTPTransporterConfig } from '@/types';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { formatPort } from '@/lib';

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

	private static proxyHandler() {
		return {
			get(target: SMTPTransporter, prop: string | symbol) {
				if (prop === 'then') {
					return undefined;
				}

				throw new Error(`Property ${String(prop)} is not accessible`);
			},
		};
	}
}
