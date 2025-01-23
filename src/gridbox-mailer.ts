'use strict';
import {
	GmailTransporter,
	MailchimpTransporter,
	MailgunTransporter,
	SendgridTransporter,
	SMTPTransporter,
} from '@/transporters';

import {
	GridboxMailerConfig,
	GmailTransporterConfig,
	MailchimpTransporterConfig,
	MailgunTransporterConfig,
	SendgridTransporterConfig,
	SMTPTransporterConfig,
} from '@/types';

export default class GridboxMailer {
	public static async connect<T extends GridboxMailerConfig['transporter']>(options: {
		transporter: T;
		config: Extract<GridboxMailerConfig, { transporter: T }>['config'];
	}): Promise<any> {
		switch (options.transporter) {
			case 'gmail':
				const gmailConfig = options.config as GmailTransporterConfig;
				console.log(gmailConfig);
				break;

			case 'mailchimp':
				const mailchimpConfig = options.config as MailchimpTransporterConfig;
				console.log(mailchimpConfig);
				break;

			case 'mailgun':
				const mailgunConfig = options.config as MailgunTransporterConfig;
				console.log(mailgunConfig);
				break;

			case 'sendgrid':
				const sendgridConfig = options.config as SendgridTransporterConfig;
				console.log(sendgridConfig);
				break;

			case 'smtp':
				const smtpConfig = options.config as SMTPTransporterConfig;
				console.log(smtpConfig);
				break;
		}
	}
}
