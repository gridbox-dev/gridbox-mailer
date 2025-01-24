import { Attachment } from './attachment';
import { RetryOptions } from './retry-options';

export type SMTPEmail = {
	sendTo: string | string[];
	subject: string;
	cc?: string | string[];
	bcc?: string | string[];
	html: string;
	plainText?: string;
	attachments?: Attachment[];
	retry?: RetryOptions;
};
