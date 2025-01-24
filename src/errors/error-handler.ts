'use strict';

import { log } from '@/lib';
import { CustomError } from '@/errors';

export class ErrorHandler {
	private static ignoredErrors: string[] = [];
	private static alertService?: (error: CustomError) => void;

	public static handle(error: CustomError | Error): void {
		const isCustomError = error instanceof CustomError;

		if (isCustomError && this.ignoredErrors.includes(error.type)) {
			log.info(`Ignoring error: ${error.type}`);
			return;
		}

		const severity = isCustomError ? error.severity : 'error';
		this.logError(error, severity);

		if (isCustomError && severity === 'critical') {
			this.notify(error);
		}

		if (isCustomError && error.isRecoverable && error.type !== 'SMTPConnectionError') {
			this.retry(error);
		}
	}

	private static logError(error: CustomError | Error, severity: 'info' | 'warning' | 'error' | 'critical'): void {
		const message = error instanceof CustomError ? error.message : error.message;
		const metadata = error instanceof CustomError ? JSON.stringify(error.metadata) : '';

		switch (severity) {
			case 'info':
				log.info(`[INFO] ${message} ${metadata}`);
				break;

			case 'warning':
				log.warning(`[WARNING] ${message} ${metadata}`);
				break;

			case 'critical':
				log.error(`[CRITICAL] ${message} ${metadata}`);
				break;

			default:
				log.error(`[ERROR] ${message} ${metadata}`);
				break;
		}
	}

	private static notify(error: CustomError): void {
		if (this.alertService) {
			try {
				this.alertService(error);
				log.success('Critical error successfully notified.');
			} catch (notifyError) {
				log.error(`Failed to notify error: ${notifyError}`);
			}
		}
	}

	private static retry(error: CustomError): void {
		if (error.type === 'SMTPConnectionError') {
			log.warning(`SMTP Connection Error encountered, no retry will be attempted.`);
			return;
		}

		if (!error.retryFunction) {
			log.warning(`No retry function defined for error: ${error.type}`);
			return;
		}

		log.info(`Retrying operation for error: ${error.type}`);

		try {
			error.retryFunction();
			log.success(`Operation successfully retried for error: ${error.type}`);
		} catch (error) {
			log.error(`Failed to retry operation for error: ${error}`);
		}
	}

	public static ignoreErrors(errorTypes: string[]): void {
		this.ignoredErrors = errorTypes;
	}

	public static setAlertService(service: (error: CustomError) => void): void {
		this.alertService = service;
	}
}
