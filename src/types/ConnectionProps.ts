import { AllowedPort, UserCredentials } from '@/types';

export type ConnectionProps = {
	host: string;
	port: AllowedPort;
	credentials: UserCredentials;
};
