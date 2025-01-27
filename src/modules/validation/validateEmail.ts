export const validateEmail = (email: string | string[]): boolean => {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (Array.isArray(email)) {
		return email.every((e) => regex.test(e));
	}

	return regex.test(email);
};
