import { EmailSentResponse, EmailUtilityProps } from '@/types';
import { validateEmail, loadAttachments, retrySend } from '@/modules';
import { SendMailOptions } from 'nodemailer';

export const sendEmail = async (props: EmailUtilityProps): Promise<EmailSentResponse> => {
	const fieldsToValidate = [props.from, props.to];

	if (props.cc) fieldsToValidate.push(...props.cc);
	if (props.bcc) fieldsToValidate.push(...props.bcc);

	for (const field of fieldsToValidate) {
		if (!validateEmail(field!)) {
			throw new Error(`Invalid email address: ${field}`);
		}
	}

	const mailConfig: SendMailOptions = {
		from: props.from,
		to: props.to,
		cc: props.cc,
		bcc: props.bcc,
		subject: props.subject,
		text: props.text,
		html: props.html,
		attachments: props.attachments ? loadAttachments(props.attachments) : undefined,
	};

	if (props.retry) {
		const { maxRetries, delay } = props.retry;

		return await retrySend({
			props: mailConfig,
			transporter: props.transporter,
			maxRetries,
			delay,
			eventEmmitter: props.eventEmitter,
		});
	}

	try {
		const info = await props.transporter.sendMail(mailConfig);
		props.eventEmitter.emit('emailSent', {
			EmailSentResponse: {
				success: true,
				message: `Email successfully sent to ${props.to}.`,
				messageId: info.messageId,
			},
		});
		return {
			success: true,
			message: `Email successfully sent to ${props.to}.`,
			messageId: info.messageId,
		};
	} catch (error) {
		throw new Error(`Failed to send email: ${error}`);
	}
};
