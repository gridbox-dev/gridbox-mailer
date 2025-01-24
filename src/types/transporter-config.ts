import { AllowedPort, UserCredentials } from '@/types';

export type TransporterConfig = {
	host: string;
	port: AllowedPort;
	credentials: UserCredentials;
	logging?: boolean;
};
