import path from 'path';
import { EmailAttachment } from '@/types';

export const loadAttachments = (attachments: EmailAttachment[]) => {
	const loaded = attachments.map((attachment) => {
		const basePath = path.join(attachment.location, attachment.filename);

		return {
			filename: attachment.filename,
			cid: attachment.cid,
			path: basePath,
		};
	});

	return loaded;
};
