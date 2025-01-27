import { AllowedPort } from "@/types";

export const formatPort = (port: AllowedPort): number => {
	switch (port) {
		case 'secure':
			return 465;
		case 'tls':
			return 587;
		default:
			return port;
	}
};
