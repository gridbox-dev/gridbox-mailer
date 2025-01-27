import { AllowedPort } from '@/types';

export type GenerateMetadataProps = {
	host: string;
	port: number;
	secure: boolean;
	username: string;
};
