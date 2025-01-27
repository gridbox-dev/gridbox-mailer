import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { ConnectionProps } from '@/types';
import { formatPort } from '@/modules';

export const formatToTransporter = (config: ConnectionProps): SMTPTransport.Options => {
	const transporterOptions: SMTPTransport.Options = {
		host: config.host,
		port: formatPort(config.port),
		secure: config.port === 'secure' || config.port === 465,
		auth: {
			user: config.credentials.username,
			pass: config.credentials.password,
		},
	};

	return transporterOptions;
};
