export type HTMLTemplateProps = {
	location: string;
	filename: string;
	replacements?: HTMLReplacement;
};

export type HTMLReplacement = Record<string, any>;
