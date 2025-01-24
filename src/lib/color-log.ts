export const log = {
	warning: (...args: any[]) => {
		console.log('\x1b[33m', args.join(' '), '\x1b[0m');
	},
	error: (...args: any[]) => {
		console.error('\x1b[31m', args.join(' '), '\x1b[0m');
	},
	success: (...args: any[]) => {
		console.log('\x1b[32m', args.join(' '), '\x1b[0m');
	},
	info: (...args: any[]) => {
		console.log('\x1b[34m', args.join(' '), '\x1b[0m');
	},
	neutral: (...args: any[]) => {
		console.log('\x1b[37m', args.join(' '), '\x1b[0m');
	},
};
