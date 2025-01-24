'use strict';
import { SMTPTransporter } from '@/transporters';

import { GridboxMailerConfig, SMTPTransporterConfig } from '@/types';

export class GridboxMailer {
	private static smtp: SMTPTransporter | null = null;

	public static async connect<T extends GridboxMailerConfig['transporter']>(options: {
		transporter: T;
		config: Extract<GridboxMailerConfig, { transporter: T }>['config'];
	}): Promise<GridboxMailer> {
		switch (options.transporter) {
			// case 'gmail':
			// 	const gmailConfig = options.config as GmailTransporterConfig;
			// 	console.log(gmailConfig);
			// 	break;

			// case 'mailchimp':
			// 	const mailchimpConfig = options.config as MailchimpTransporterConfig;
			// 	console.log(mailchimpConfig);
			// 	break;

			// case 'mailgun':
			// 	const mailgunConfig = options.config as MailgunTransporterConfig;
			// 	console.log(mailgunConfig);
			// 	break;

			// case 'sendgrid':
			// 	const sendgridConfig = options.config as SendgridTransporterConfig;
			// 	console.log(sendgridConfig);
			// 	break;

			case 'smtp':
				if (GridboxMailer.smtp) {
					return new Proxy(new GridboxMailer(), this.proxyHandler());
				}

				const smtpConfig = options.config as SMTPTransporterConfig;
				const smtp = await SMTPTransporter.connect(smtpConfig);

				GridboxMailer.smtp = smtp;
				return new Proxy(new GridboxMailer(), this.proxyHandler());

			default:
				throw new Error(`Transporter ${options.transporter} does not exist.`);
		}
	}

	public getConnection(transporter: GridboxMailerConfig['transporter']) {
		switch (transporter) {
			case 'smtp':
				if (!GridboxMailer.smtp) {
					throw new Error('SMTP Transporter connection not found. Please connect first.');
				}

				return GridboxMailer.smtp?.getConnection();

			default:
				throw new Error(`Transporter ${transporter} does not exist.`);
		}
	}

	public disconnect(transporter: GridboxMailerConfig['transporter']): void {
		switch (transporter) {
			case 'smtp':
				if (GridboxMailer.smtp) {
					GridboxMailer.smtp.disconnect();
					GridboxMailer.smtp = null;
				}

				break;

			default:
				throw new Error(`Transporter ${transporter} does not exist.`);
		}
	}

	private static proxyHandler() {
		return {
			get(target: any, prop: string | symbol) {
				if (prop === 'getConnection') {
					return target.getConnection.bind(target);
				}

				if (prop === 'disconnect') {
					return target.disconnect.bind(target);
				}

				if (prop === 'then') {
					return undefined;
				}

				throw new Error(`Property ${String(prop)} does not exist.`);
			},
		};
	}
}
