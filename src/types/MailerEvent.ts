import { Transporter } from 'nodemailer';
import { ConnectionMetadata, EmailProps, EmailSentResponse } from '@/types';

export type MailerEvents = {
	connected: { metadata: ConnectionMetadata; transporter: Transporter };
	connectionSwitched: { metadata: ConnectionMetadata; transporter: Transporter };
	connectionClosed: { connectionId: string; message: string };
	sendingEmail: { EmailProps: EmailProps };
	emailSent: { EmailSentResponse: EmailSentResponse };
	templateLoaded: { templateKey: string };
};
