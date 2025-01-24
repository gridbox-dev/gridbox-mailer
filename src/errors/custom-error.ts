'use strict';

export class CustomError extends Error {
	public type: string;
	public metadata: Record<string, any>;
	public severity: 'info' | 'warning' | 'error' | 'critical';
	public isRecoverable: boolean;
	public retryFunction?: () => void;

	constructor(
		message: string,
		name: string,
		type: string,
		metadata: Record<string, any> = {},
		severity: 'info' | 'warning' | 'error' | 'critical' = 'error',
		isRecoverable: boolean = false,
		retryFunction?: () => void,
	) {
		super(message);
		this.name = name;
		this.type = type;
		this.metadata = metadata;
		this.severity = severity;
		this.isRecoverable = isRecoverable;
		this.retryFunction = retryFunction;
	}

	static ConfigurationError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'ConfigurationError', 'ConfigurationError', metadata, 'error', false);
	}

	static SMTPConnectionError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'SMTPConnectionError', 'SMTPConnectionError', metadata, 'critical', true, () =>
			console.log('Retrying SMTP connection...'),
		);
	}

	static SMTPAuthenticationError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'SMTPAuthenticationError', 'SMTPAuthenticationError', metadata, 'error', false);
	}

	static SendEmailError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'SendEmailError', 'SendEmailError', metadata, 'warning', true, () =>
			console.log('Retrying email sending...'),
		);
	}

	static EmailValidationError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'EmailValidationError', 'EmailValidationError', metadata, 'warning', false);
	}

	static AttachmentValidationError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(
			message,
			'AttachmentValidationError',
			'AttachmentValidationError',
			metadata,
			'warning',
			false,
		);
	}

	static RateLimitConfigurationError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(
			message,
			'RateLimitConfigurationError',
			'RateLimitConfigurationError',
			metadata,
			'error',
			false,
		);
	}

	static SMTPServerError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'SMTPServerError', 'SMTPServerError', metadata, 'critical', true);
	}

	static HTMLTemplateError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'HTMLTemplateError', 'HTMLTemplateError', metadata, 'warning', false);
	}

	static QueueProcessingError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'QueueProcessingError', 'QueueProcessingError', metadata, 'info', true);
	}

	static SendSchedulingError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'SendSchedulingError', 'SendSchedulingError', metadata, 'info', true);
	}

	static SMTPDisconnectionError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(
			message,
			'SMTPDisconnectionError',
			'SMTPDisconnectionError',
			metadata,
			'critical',
			true,
			() => console.log('Retrying SMTP disconnection...'),
		);
	}

	static DatabaseConnectionError(message: string, metadata: Record<string, any> = {}) {
		return new CustomError(message, 'DatabaseConnectionError', 'DatabaseConnectionError', metadata, 'error', false);
	}
}
