export type EmailAttachment = {
	filename: string;
	cid: string;
	basePath: string;
};

export type EmailRetryOptions = {
	maxRetries: number;
	delay?: number;
};

export type EmailOptions = {
	from: string;
	sendTo: string | string[];
	subject: string;
	cc?: string | string[];
	bcc?: string | string[];
	html: string;
	plainText?: string;
	attachments?: EmailAttachment[];
	retry?: EmailRetryOptions;
};

export type EmailSentResponse = {
	success: boolean;
	status: number;
	message: string;
	messageId?: string;
};
