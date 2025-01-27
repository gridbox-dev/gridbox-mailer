import { EmailSentResponse, RetrySendProps } from '@/types';

export const retrySend = async ({
	props,
	transporter,
	maxRetries = 3,
	delay = 3000,
	eventEmmitter,
}: RetrySendProps): Promise<EmailSentResponse> => {
	let attempts = 0;

	while (attempts < maxRetries) {
		try {
			await transporter.sendMail(props);

			eventEmmitter.emit('emailSent', {
				EmailSentResponse: { success: true, message: 'Email sent successfully.' },
			});

			return { success: true, message: 'Email sent successfully.' };
		} catch (error) {
			attempts++;

			if (attempts >= maxRetries) {
				throw new Error(`Failed to send email after ${attempts} attempts. ${error}`);
			}

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error(`Failed to send email after ${maxRetries} attempts.`);
};
