import { ConnectionProps } from '@/types';

export const validateConfiguration = (props: ConnectionProps): void => {
	if (!props.host) {
		throw new Error('SMTP host is required to connect to the email service.');
	}

	if (!props.port) {
		throw new Error('SMTP port is required to connect to the email service.');
	}

	if (!props.credentials.username) {
		throw new Error('SMTP username is required to connect to the email service.');
	}

	if (!props.credentials.password) {
		throw new Error('SMTP password is required to connect to the email service.');
	}
};
