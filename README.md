<div style="display: flex; gap: 10px;">
	<a href='https://www.gridbox.dev' target='_blank'>
  		<img src="https://img.shields.io/badge/Developed%20by-Gridbox-black?labelColor=gray&style=flat" alt="Developed by">
	</a>
	<a href='https://cl.linkedin.com/in/tdelrealb' target='_blank'>
  		<img src="https://img.shields.io/badge/Developed%20by-Tom%C3%A1s%20del%20Real%20B.-red?labelColor=gray&style=flat" alt="Developed by">
	</a>
	<a href='https://choosealicense.com/licenses/mit/' target='_blank'>
  	<img src="https://img.shields.io/badge/License-MIT-green?labelColor=gray&style=flat"  alt="License"/>
	</a>
</div>

<br>

# Gridbox Mailer

`Gridbox Mailer` is a flexible and easy-to-use Node.js package that simplifies SMTP connection management and email sending using Nodemailer. It allows you to easily connect to an SMTP server, load and customize HTML email templates, and send emails with attachments. It handles the connection management, template processing, and email sending processes in a streamlined way.

## Features

- **Management of multiple SMTP connections**: Establish, list, switch and close multiple SMTP connections.
- **Event-Driven**: Leverage custom events on real-time updates on email sending, connection changes and more.
- **Sending individual and batch emails**: Send emails in batches with customizable delays and sizes.
- **HTML Templating**: Use handlebars to load and cache reusable email templates.

## Installation

To install the package you must execute the following command in the console:

```bash
npm install gridbox-mailer
```

## Basic Usage

### Setup and connection

```ts
import GridboxMailer from 'gridbox-mailer';

const mailer = new GridboxMailer();

async function initializeConnection() {
	await mailer.connect({
		host: 'smtp.example.com',
		port: 'secure',
		credentials: {
			username: 'your-username',
			password: 'your-password',
		},
	});

	console.log('SMTP connection successfully established.');
}

initializeConnection();
```

### Sending an email

```ts
await mailer.send({
	from: 'your-email@example.com',
	to: ['user1@example.com', 'user2@example.com'],
	cc: 'user3@example.com',
	subject: 'Hello from Gridbox Mailer',
	html: '<h1>Welcome to Gridbox Mailer</h1>',
});
```

# Advanced Features

## Establish multiple connections

Gridbox Mailer allows managing multiple SMTP connections simultaneously:

```ts
await mailer.connect({
	host: 'smtp.example1.com',
	port: 'tls',
	credentials: {
		username: 'user1',
		password: 'pass1',
	},
});

await mailer.connect({
	host: 'smtp.example2.com',
	port: 'tls',
	credentials: {
		username: 'user2',
		password: 'pass2',
	},
});
```

### List active connections

```ts
mailer.listConnections();

// Outputs a table of active connections and connections metadata.
```

### Switch between connections

```ts
mailer.useConnection('connection-id');
```

### Close a specific connection

```ts
mailer.killConnection('connection-id');
```

### Close all connections

```ts
mailer.killAllConnection();
```

## Sending emails

Send emails in a simple way:

```ts
await mailer.send({
	from: 'sender@example.com',
	to: 'recipient@example.com',
	subject: 'Welcome!',
	html: template,
});
```

## Sending emails in batches

Send emails in batches with optional delays:

```ts
await mailer.sendBatch(
	[
		{ from: 'sender@example.com', to: 'user1@example.com', subject: 'Hello!', text: 'User 1' },
		{ from: 'sender@example.com', to: 'user2@example.com', subject: 'Hello!', text: 'User 2' },
	],
	10, // Batch size
	2000, // Delay in miliseconds
);
```

## HTML templating

Load, cache and reusable HTML templates:

### Loading an HTML Template

```ts
const template = await mailer.loadHTMLTemplate({
	location: './templates',
	filename: 'welcome-template',
	replacements: {
		username: 'John Doe',
		activationLink: 'https://example.com/activate',
	},
});

await mailer.send({
	from: 'sender@example.com',
	to: 'recipient@example.com',
	subject: 'Welcome!',
	html: template,
});
```

## Sending emails with attachments

`Gridbox Mailer` supports adding attachments to your emails:

```ts
await mailer.send({
  from: 'sender@example.com',
	to: 'recipient@example.com',
	subject: 'Welcome!',
	html: template,
  attachments: [
    filename: 'my-image.png',
    location: './src/assets',
    cid: 'my-image-cid'
  ]
})
```

## Event handling

Listen to events to track the status of your email workflows:

### Supported events

| Event Name           | Description                                     |
| -------------------- | ----------------------------------------------- |
| `connected`          | Emmited when an SMTP connection is established. |
| `connectionSwitched` | Emmited when the active connection is switched. |
| `connectionClosed`   | Emmited when a connection is closed.            |
| `sendingEmail`       | Emmited while sending an email.                 |
| `emailSent`          | Emmited after an email is successfully sent.    |
| `templateLoaded`     | Emmited when an HTML template is loaded.        |

### Usage example

```ts
GridboxMailer.on('connected', ({ metadata }) => {
	console.log(`Connected to SMTP server: ${metadata.host}`);
});

GridboxMailer.on('emailSent', ({ props, response }) => {
	console.log(`Email sent to ${props.to} with ID ${response.messageId}`);
});
```

## Error handling

Gridbox Mailer provides error messages for common issues like invalid configurations, missing connections or failed emails. Wrap your calls in try/catch blocks for additional control:

```ts
try {
	await mailer.send({
		from: 'invalid@example.com',
		to: 'recipient@example.com',
		subject: 'Test',
		text: 'Testing error handling',
	});
} catch (error) {
	console.error('Failed to send email:', error);
}
```

# Props

## Connection configuration

| Option        | Type                          | Description                         |
| ------------- | ----------------------------- | ----------------------------------- |
| `host`        | `string`                      | SMTP server hostname.               |
| `port`        | `secure` or `tls` or `number` | Port to connect to the SMTP server. |
| `credentials` | `object`                      | STMP login credentials              |

## Email properties:

| Option        | Type                       | Description                             |
| ------------- | -------------------------- | --------------------------------------- |
| `from`        | `string`                   | Sender email address.                   |
| `to`          | `string` or `string array` | Recipients email address.               |
| `subject`     | `string`                   | Subject of the email.                   |
| `cc`          | `string` or `string array` | Copied recipients email address.        |
| `bcc`         | `string` or `string array` | Secret copied recipients email address. |
| `html`        | `string`                   | HTML template or email body in HTML.    |
| `text`        | `string`                   | Plain email body text.                  |
| `attachments` | `object`                   | Attached files.                         |

# Full example

```ts
import GridboxMailer from 'gridbox-mailer';

const mailer = new GridboxMailer();

(async () => {
	try {
		// Connect to SMTP server
		await mailer.connect({
			host: 'smtp.example.com',
			port: 587,
			credentials: {
				username: 'your-username',
				password: 'your-password',
			},
		});

		// Send a basic email
		await mailer.send({
			from: 'sender@example.com',
			to: 'recipient@example.com',
			subject: 'Welcome!',
			text: 'Hello, welcome to our platform!',
		});

		// List connections
		mailer.listConnections();

		// Send a batch of emails
		await mailer.sendBatch(
			[
				{ from: 'sender@example.com', to: 'user1@example.com', subject: 'Batch 1', text: 'Email 1' },
				{ from: 'sender@example.com', to: 'user2@example.com', subject: 'Batch 2', text: 'Email 2' },
			],
			2, // Batch size
			1000, // Delay in milliseconds
		);

		// Load and send an HTML template
		const htmlContent = await mailer.loadHTMLTemplate({
			location: './templates',
			filename: 'welcome',
			replacements: { name: 'John Doe' },
		});

		await mailer.send({
			from: 'sender@example.com',
			to: 'recipient@example.com',
			subject: 'Welcome!',
			html: htmlContent,
		});

		// Send an email with attachments
		await mailer.send({
			from: 'sender@example.com',
			to: 'recipient@example.com',
			subject: 'Monthly Report',
			text: 'Please find the attached reports.',
			attachments: [
				{
					filename: 'report.pdf',
					path: './path/to/report.pdf',
				},
			],
		});

		// Close all connections
		await mailer.killAllConnections();
	} catch (error) {
		console.error('Error:', error);
	}
})();
```
