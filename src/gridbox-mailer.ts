'use strict';
import { SMTPTransporter } from '@/transporters';

import {
	GridboxMailerConfig,
	GmailTransporterConfig,
	MailchimpTransporterConfig,
	MailgunTransporterConfig,
	SendgridTransporterConfig,
	SMTPTransporterConfig,
} from '@/types';

export class GridboxMailer {
	private static instance: SMTPTransporter | null = null;

	public static async connect<T extends GridboxMailerConfig['transporter']>(options: {
		transporter: T;
		config: Extract<GridboxMailerConfig, { transporter: T }>['config'];
	}): Promise<GridboxMailer> {
		if (GridboxMailer.instance) {
			return new Proxy(new GridboxMailer(), this.proxyHandler());
		}
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
				const smtpConfig = options.config as SMTPTransporterConfig;
				const smtp = await SMTPTransporter.connect(smtpConfig);

				GridboxMailer.instance = smtp;
				return new Proxy(new GridboxMailer(), this.proxyHandler());

			default:
				throw new Error(`Transporter ${options.transporter} does not exist.`);
		}
	}

	private static proxyHandler() {
		return {
			get(target: any, prop: string | symbol) {
				if (prop === 'then') {
					return undefined;
				}

				throw new Error(`Property ${String(prop)} does not exist.`);
			},
		};
	}
}
