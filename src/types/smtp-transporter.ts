export type SMTPTransporterConfig = {
	host: string;
	port: 'secure' | 'tls' | number;
	username: string;
	password: string;
};
