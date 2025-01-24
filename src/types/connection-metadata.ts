import { AllowedPort } from './allowed-port';

export type ConnectionMetadata = {
	id: string;
	host: string;
	port: AllowedPort;
	secure: boolean;
	createdAt: Date;
};
