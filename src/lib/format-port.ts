export const formatPort = (port: 'secure' | 'tls' | number) => {
	switch (port) {
		case 'secure':
			return 465;
		case 'tls':
			return 587;
		default:
			return port;
	}
};
