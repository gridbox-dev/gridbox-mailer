import { ConnectionMetadata, GenerateMetadataProps } from '@/types';

export const generateMetadata = (props: GenerateMetadataProps): ConnectionMetadata => {
	const metadata: ConnectionMetadata = {
		id: `${props.host}:${props.port}:${props.username.split('@')[0]}${props.secure ? ':secure' : ''}`,
		host: props.host,
		port: props.port,
		secure: props.secure,
		createdAt: new Date(),
	};

	return metadata;
};
