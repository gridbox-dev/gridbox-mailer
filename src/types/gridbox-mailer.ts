import {
	GmailTransporterConfig,
	MailchimpTransporterConfig,
	MailgunTransporterConfig,
	SendgridTransporterConfig,
	SMTPTransporterConfig,
} from '@/types';

export type GridboxMailerConfig =
	| {
			transporter: 'gmail';
			config: GmailTransporterConfig;
	  }
	| {
			transporter: 'mailchimp';
			config: MailchimpTransporterConfig;
	  }
	| {
			transporter: 'mailgun';
			config: MailgunTransporterConfig;
	  }
	| {
			transporter: 'sendgrid';
			config: SendgridTransporterConfig;
	  }
	| {
			transporter: 'smtp';
			config: SMTPTransporterConfig;
	  };
