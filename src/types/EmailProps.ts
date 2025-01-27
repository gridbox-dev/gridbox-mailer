import { EmailAttachment, EmailRetryProps } from '@/types';
import { Transporter } from 'nodemailer';
import { EventEmitter } from 'events';

export type EmailProps = {
	from: string;
	to: string | string[];
	subject: string;
	cc?: string | string[];
	bcc?: string | string[];
	text?: string;
	html?: string;
	attachments?: EmailAttachment[];
	retry?: EmailRetryProps;
};

export type EmailUtilityProps = EmailProps & { transporter: Transporter; eventEmitter: EventEmitter };
