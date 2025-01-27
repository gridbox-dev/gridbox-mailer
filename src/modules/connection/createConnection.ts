import { createTransport, Transporter } from 'nodemailer';

import { generateMetadata, validateConfiguration, formatToTransporter } from '@/modules';
import { ConnectionMetadata, ConnectionProps } from '@/types';

export const createConnection = async (props: ConnectionProps): Promise<[Transporter, ConnectionMetadata]> => {
	validateConfiguration(props);

	const { host, credentials } = props;

	const transporterOptions = formatToTransporter(props);

	try {
		const transporter = createTransport(transporterOptions);

		const connectionMetadata = generateMetadata({
			host,
			port: transporterOptions.port!,
			secure: transporterOptions.secure!,
			username: credentials.username,
		});

		return [transporter, connectionMetadata];
	} catch (error) {
		throw new Error(`Failed to create connection: ${error}`);
	}
};
