import { SendMailOptions, Transporter } from 'nodemailer';
import {EventEmitter} from 'events';

export type RetrySendProps = {
	props: SendMailOptions;
	transporter: Transporter;
	maxRetries: number;
	delay: number;
	eventEmmitter: EventEmitter;
};
