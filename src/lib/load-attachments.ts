import path from 'path';
import { Attachment } from '@/types';

const loadAttachments = (attachments: Attachment[]) => {
	const loadedAttachments = attachments.map(({ filename, cid, basePath }) => ({
		filename,
		cid,
		path: path.join(basePath, filename),
	}));

	return loadedAttachments;
};

export { loadAttachments };
